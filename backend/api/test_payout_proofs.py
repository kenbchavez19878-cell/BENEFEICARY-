import tempfile
from io import BytesIO
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from PIL import Image

from .models import AicsCase, WomenAndSoloParentCase, ApplicationAccount, PayoutProof


class PayoutProofTests(TestCase):
    def photo(self, image_format='PNG'):
        buffer = BytesIO()
        Image.new('RGB', (32, 24), 'white').save(buffer, format=image_format)
        suffix = 'png' if image_format == 'PNG' else 'jpg'
        return SimpleUploadedFile(f'payout.{suffix}', buffer.getvalue())

    def setUp(self):
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        settings = override_settings(MEDIA_ROOT=self.media.name)
        settings.enable()
        self.addCleanup(settings.disable)
        self.staff = {}
        for module in ('aics', 'women-solo-parent'):
            user = get_user_model().objects.create_user(username=f'proof-{module}', first_name='Proof', last_name='Reviewer')
            ApplicationAccount.objects.create(user=user, external_id=f'proof-{module}', role='Staff', case_module=module)
            self.staff[module] = user
        self.secretary = get_user_model().objects.create_user(username='proof-secretary')
        ApplicationAccount.objects.create(user=self.secretary, external_id='proof-secretary', role='BarangaySecretary', barangay='San Vicente')
        self.payout_date = '2026-11-13'

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def case(self, module, **overrides):
        model = AicsCase if module == 'aics' else WomenAndSoloParentCase
        field = 'approved_amount' if module == 'aics' else 'financial_aid_amount'
        workflow = {'_completed': {key: 'approved-cycle-1' for key in ('endorsementReviewed', 'documentsVerified', 'intakeInterview', 'assessment', 'eligibility', 'approval', 'release', 'monitoring')},
                    'fulfillmentKind': 'MONETARY', 'servicePlan': {'nonMonetarySupport': 'Approved cash aid'}}
        attrs = dict(first_name='Applicant', last_name='Example', barangay_name='San Vicente', submitted_by=self.secretary,
                     status='RELEASED_COMPLETED', payout_date=date.fromisoformat(self.payout_date),
                     eligibility='ELIGIBLE', workflow_data=workflow, **{field: 1000})
        attrs.update(overrides)
        if attrs['status'] == 'APPROVED_FOR_RELEASE':
            for key in ('release', 'monitoring'):
                workflow['_completed'].pop(key, None)
        return model.objects.create(**attrs)

    def upload(self, case, module, client=None, **overrides):
        client = client or self.client_for(self.staff[module])
        case.refresh_from_db()
        data = dict(moduleType=module, expected_version=case.workflow_version, proof_type='OFFICIAL_RECEIPT',
                    receipt_number='OR-DEFENSE-001', received_by='Parent Maria Example', released_on=self.payout_date,
                    confirmed_received=True, notes='Receipt inspected by staff.',
                    file=SimpleUploadedFile('receipt.pdf', b'%PDF-1.7\nreceipt', content_type='application/pdf'))
        data.update(overrides)
        return client.post(f'/api/cases/{case.tracking_id}/payout-proof', data, format='multipart')

    def release(self, case, module, client=None, **changes):
        data = {'status': 'RELEASED_COMPLETED', 'release_method': 'CASH', 'payout_date': self.payout_date,
                'serviceRelease': {'payoutOfficer': 'Accountable Release Officer', 'approvedAmount': 1000}}
        data.update(changes)
        return (client or self.client_for(self.staff[module])).patch(f'/api/cases/{module}/{case.pk}/step', data, format='json')

    def close(self, case, module, **changes):
        data = {'status': 'CASE_CLOSED', 'closureNotes': 'Payout received and proof verified.'}
        data.update(changes)
        return self.client_for(self.staff[module]).patch(f'/api/cases/{module}/{case.pk}/step', data, format='json')

    def test_release_needs_no_proof_but_closure_requires_verified_proof_on_every_route(self):
        for module in self.staff:
            case = self.case(module, status='APPROVED_FOR_RELEASE', payout_date=None)
            client = self.client_for(self.staff[module])
            self.assertEqual(self.upload(case, module).status_code, 400)
            released = self.release(case, module)
            self.assertEqual(released.status_code, 200, released.data)
            self.assertFalse(case.payout_proofs.exists())
            endpoint = f'/api/cases/{module}/{case.pk}/step'
            monitored = client.patch(endpoint, {'monitoring_logs': [{'id': 'visit', 'type': 'visit', 'title': 'Follow-up', 'description': 'Release followed up'}]}, format='json')
            self.assertEqual(monitored.status_code, 200, monitored.data)
            for route in (f'/api/cases/{module}/{case.pk}/step', f'/api/cases/{module}/{case.pk}', f'/api/cases/{case.tracking_id}/step'):
                response = client.patch(route, {'status': 'CASE_CLOSED', 'closureNotes': 'Ready to archive',
                                              'moduleType': module,
                                              'payout_proofs': [{'available': True}]}, format='json')
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn('payout_proof', response.data)
            uploaded = self.upload(case, module)
            self.assertEqual(uploaded.status_code, 201, uploaded.data)
            proof = PayoutProof.objects.get(pk=uploaded.data['proof']['id'])
            self.assertEqual(proof.verified_by_id, self.staff[module].pk)
            self.assertEqual(proof.amount, Decimal('1000'))
            monitored = client.patch(endpoint, {'monitoring_logs': [{'id': 'visit', 'type': 'visit', 'title': 'Follow-up', 'description': 'Receipt and payout confirmed'}]}, format='json')
            self.assertEqual(monitored.status_code, 200, monitored.data)
            audit = next(event for event in monitored.data['data']['monitoring_logs'] if event.get('action') == 'PAYOUT_PROOF_VERIFIED')
            self.assertEqual(audit['received_by'], 'Parent Maria Example')
            self.assertEqual(audit['verified_by_id'], self.staff[module].pk)
            self.assertIn('OR-DEFENSE-001', audit['note'])
            closed = client.patch(endpoint, {'status': 'CASE_CLOSED', 'closureNotes': 'Payout received and proof verified.'}, format='json')
            self.assertEqual(closed.status_code, 200, closed.data)
            self.assertEqual(len(closed.data['data']['payout_proofs']), 1)
            self.assertEqual(self.upload(case, module).status_code, 400)

    def test_nonfinancial_and_ineligible_closure_stay_unblocked(self):
        for module in self.staff:
            for kind in ('REFERRAL', 'DIRECT_SERVICE'):
                case = self.case(module, status='APPROVED_FOR_RELEASE', payout_date=None)
                field = 'approved_amount' if module == 'aics' else 'financial_aid_amount'
                setattr(case, field, 0)
                case.workflow_data['fulfillmentKind'] = kind
                case.workflow_data['servicePlan'] = {'nonMonetarySupport': 'Hospital referral' if kind == 'REFERRAL' else 'Counselling'}
                case.eligibility = 'FOR_REFERRAL' if kind == 'REFERRAL' else 'ELIGIBLE'
                case.save()
                released = self.release(case, module, release_method=kind, serviceRelease={'payoutOfficer': 'Service Officer', 'approvedAmount': 0})
                self.assertEqual(released.status_code, 200, released.data)
                self.assertEqual(self.upload(case, module).status_code, 400)
                monitored = self.client_for(self.staff[module]).patch(f'/api/cases/{module}/{case.pk}/step', {
                    'monitoring_logs': [{'id': 'followup', 'type': 'note', 'title': 'Follow-up', 'description': 'Service delivered'}],
                }, format='json')
                self.assertEqual(monitored.status_code, 200, monitored.data)
                self.assertEqual(self.close(case, module).status_code, 200)
            rejected = self.case(module, status='ELIGIBILITY_EVALUATED', eligibility='NOT_ELIGIBLE')
            closed = self.client_for(self.staff[module]).patch(f'/api/cases/{module}/{rejected.pk}/step', {'status': 'CASE_CLOSED', 'closureNotes': 'Ineligible determination explained.'}, format='json')
            self.assertEqual(closed.status_code, 200, closed.data)

    def test_permission_scope_for_upload_file_and_actor_is_server_controlled(self):
        for module in self.staff:
            case = self.case(module)
            self.assertEqual(self.upload(case, module, APIClient()).status_code, 403)
            self.assertEqual(self.upload(case, module, self.client_for(self.secretary)).status_code, 403)
            other = 'aics' if module != 'aics' else 'women-solo-parent'
            self.assertEqual(self.upload(case, module, self.client_for(self.staff[other])).status_code, 404)
            uploaded = self.upload(case, module, verified_by_id=self.secretary.pk, verified_by_name='Fake Officer', amount='99999')
            self.assertEqual(uploaded.status_code, 201, uploaded.data)
            proof = uploaded.data['proof']
            self.assertEqual(proof['verified_by_id'], self.staff[module].pk)
            self.assertNotEqual(proof['verified_by_name'], 'Fake Officer')
            self.assertEqual(Decimal(proof['amount']), Decimal('1000'))
            self.assertEqual(self.client_for(self.staff[other]).get(proof['fileUrl']).status_code, 403)
            self.assertEqual(APIClient().get(proof['fileUrl']).status_code, 403)
            file = self.client_for(self.staff[module]).get(proof['fileUrl'])
            self.assertEqual(file.status_code, 200)
            self.assertEqual(b''.join(file.streaming_content), b'%PDF-1.7\nreceipt')

    def test_upload_validation_and_wrong_stage_never_create_proof(self):
        case = self.case('aics')
        invalid = [dict(confirmed_received=False), dict(receipt_number=''), dict(received_by='12345'),
                   dict(released_on=(date.today() + timedelta(days=3)).isoformat()), dict(expected_version=9),
                   dict(file=SimpleUploadedFile('fake.pdf', b'not a pdf')), dict(proof_type='PAYOUT_PHOTO'),
                   dict(file=SimpleUploadedFile('large.pdf', b'%PDF-' + b'x' * (10 * 1024 * 1024)))]
        for changes in invalid:
            result = self.upload(case, 'aics', **changes)
            self.assertEqual(result.status_code, 400, result.data)
        case.status = 'BARANGAY_ENDORSED'
        case.save(update_fields=['status'])
        self.assertEqual(self.upload(case, 'aics').status_code, 400)
        self.assertFalse(PayoutProof.objects.exists())
        self.assertEqual(list(Path(self.media.name).rglob('*.pdf')), [])

    def test_valid_photo_and_missing_physical_file_block_completion(self):
        case = self.case('aics')
        uploaded = self.upload(case, 'aics', proof_type='PAYOUT_PHOTO', receipt_number='PHOTO-OR-001', file=self.photo())
        self.assertEqual(uploaded.status_code, 201, uploaded.data)
        proof = PayoutProof.objects.get()
        proof.file.storage.delete(proof.file.name)
        self.assertEqual(self.close(case, 'aics').status_code, 400)
        detail = self.client_for(self.staff['aics']).get(f'/api/cases/aics/{case.pk}')
        self.assertFalse(detail.data['data']['payout_proofs'][0]['available'])

    def test_corrupt_payout_images_do_not_authorize_completion(self):
        for module in self.staff:
            case = self.case(module)
            for name, contents in [('broken.png', b'\x89PNG\r\n\x1a\nphoto'),
                                   ('broken.jpg', b'\xff\xd8\xffphoto'),
                                   ('truncated.png', self.photo().read()[:40])]:
                response = self.upload(case, module, proof_type='PAYOUT_PHOTO',
                                       file=SimpleUploadedFile(name, contents))
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn('file', response.data)
            case.refresh_from_db()
            self.assertEqual(case.workflow_version, 0)
            self.assertFalse(case.payout_proofs.exists())
            self.assertEqual(self.close(case, module).status_code, 400)
        self.assertEqual(list(Path(self.media.name).rglob('*.*')), [])

    def test_valid_jpeg_and_png_can_be_retrieved_without_modification(self):
        for image_format in ('PNG', 'JPEG'):
            case = self.case('women-solo-parent')
            photo = self.photo(image_format)
            original = photo.read()
            photo.seek(0)
            uploaded = self.upload(case, 'women-solo-parent', proof_type='PAYOUT_PHOTO', file=photo)
            self.assertEqual(uploaded.status_code, 201, uploaded.data)
            response = self.client_for(self.staff['women-solo-parent']).get(uploaded.data['proof']['fileUrl'])
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b''.join(response.streaming_content), original)

    def test_unsafe_image_dimensions_and_corrupt_receipt_images_are_rejected(self):
        case = self.case('aics')
        photo = self.photo()
        with patch.object(Image, 'MAX_IMAGE_PIXELS', 500):
            response = self.upload(case, 'aics', proof_type='PAYOUT_PHOTO', file=photo)
        self.assertEqual(response.status_code, 400, response.data)
        response = self.upload(case, 'aics', proof_type='OFFICIAL_RECEIPT',
                               file=SimpleUploadedFile('receipt.jpg', b'\xff\xd8\xffbad receipt'))
        self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(PayoutProof.objects.exists())

    def test_dashboard_exposes_authorized_proof_actions_for_completed_records_and_history(self):
        cases = {}
        proof_ids = {}
        for module in self.staff:
            case = self.case(module)
            uploaded = self.upload(case, module)
            self.assertEqual(uploaded.status_code, 201, uploaded.data)
            proof_ids[module] = uploaded.data['proof']['id']
            # The proof history entry is accessible as soon as staff verifies it.
            response = self.client_for(self.staff[module]).get('/api/dashboard/stats')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data['data']['recentActivities'][0]['payoutProofs'][0]['id'], proof_ids[module])
            case.refresh_from_db()
            case.status = 'CASE_CLOSED'
            case.save(update_fields=['status'])
            cases[module] = case
        for module, case in cases.items():
            client = self.client_for(self.staff[module])
            response = client.get('/api/dashboard/stats?barangay=San%20Vicente')
            self.assertEqual(response.status_code, 200)
            data = response.data['data']
            self.assertEqual(data['matchedRecords'], 1)
            proof = data['filteredRecords'][0]['payoutProofs'][0]
            self.assertEqual(proof['id'], proof_ids[module])
            self.assertEqual(proof['receipt_number'], 'OR-DEFENSE-001')
            self.assertEqual(proof['fileUrl'], f'/api/payout-proofs/{proof_ids[module]}/file')
            self.assertTrue(proof['available'])
            for activity in data['recentActivities']:
                self.assertNotIn('_case', activity)
                self.assertNotIn('_proof_id', activity)
                self.assertEqual([p['id'] for p in activity['payoutProofs']], [proof_ids[module]])
        self.assertEqual(APIClient().get('/api/dashboard/stats').status_code, 403)

    def test_proof_is_bound_to_date_amount_and_approval_cycle(self):
        case = self.case('aics')
        self.assertEqual(self.upload(case, 'aics').status_code, 201)
        case.payout_date = date(2026, 11, 12)
        case.save(update_fields=['payout_date'])
        self.assertEqual(self.close(case, 'aics').status_code, 400)
        case.refresh_from_db()
        case.payout_date = date.fromisoformat(self.payout_date)
        case.approved_amount = 2000
        case.save(update_fields=['approved_amount', 'payout_date'])
        self.assertEqual(self.close(case, 'aics').status_code, 400)
        case.approved_amount = 1000
        case.workflow_data['_completed']['approval'] = 'approved-cycle-2'
        case.save(update_fields=['approved_amount', 'workflow_data'])
        self.assertEqual(self.close(case, 'aics').status_code, 400)
        self.assertEqual(self.upload(case, 'aics').status_code, 201)
        self.assertEqual(self.close(case, 'aics').status_code, 200)

    def test_failed_database_or_storage_write_rolls_back_files_and_audit(self):
        case = self.case('aics')
        original_logs = case.monitoring_logs
        with patch.object(AicsCase, 'save', side_effect=IntegrityError('private diagnostic')):
            failed = self.upload(case, 'aics')
        self.assertEqual(failed.status_code, 400)
        self.assertFalse(PayoutProof.objects.exists())
        self.assertEqual(list(Path(self.media.name).rglob('*.pdf')), [])
        case.refresh_from_db()
        self.assertEqual(case.monitoring_logs, original_logs)
        with patch('django.core.files.storage.FileSystemStorage.save', side_effect=OSError('private path')):
            failed = self.upload(case, 'aics')
        self.assertEqual(failed.status_code, 503)
        self.assertFalse(PayoutProof.objects.exists())
        self.assertEqual(self.client_for(self.staff['aics']).get('/api/health').status_code, 200)

    def test_existing_released_case_accepts_proof_before_closure_and_protects_audit(self):
        case = self.case('aics', status='RELEASED_COMPLETED', payout_date=date.fromisoformat(self.payout_date))
        case.workflow_data['_completed'].update(release='released', monitoring='followed-up')
        case.save(update_fields=['workflow_data'])
        client = self.client_for(self.staff['aics'])
        endpoint = f'/api/cases/aics/{case.pk}/step'
        self.assertEqual(client.patch(endpoint, {'status': 'CASE_CLOSED', 'closureNotes': 'Done'}, format='json').status_code, 400)
        self.assertEqual(self.upload(case, 'aics', released_on='2026-11-12').status_code, 400)
        uploaded = self.upload(case, 'aics')
        self.assertEqual(uploaded.status_code, 201, uploaded.data)
        event = next(item for item in uploaded.data['data']['monitoring_logs'] if item.get('type') == 'proof')
        forged = {**event, 'performed_by': 'Forged User', 'note': 'Forged reason', 'verified_by_id': self.secretary.pk}
        saved = client.patch(endpoint, {'monitoring_logs': [forged, forged]}, format='json')
        self.assertEqual(saved.status_code, 200, saved.data)
        self.assertEqual(saved.data['data']['monitoring_logs'], [event])
        self.assertEqual(client.patch(endpoint, {'monitoring_logs': [{'id': 'fake-proof', 'type': 'proof'}]}, format='json').status_code, 400)
        self.assertEqual(client.delete(f'/api/cases/aics/{case.pk}').status_code, 400)
        self.assertEqual(client.patch(endpoint, {'status': 'CASE_CLOSED', 'closureNotes': 'Done'}, format='json').status_code, 200)

    def test_unavailable_storage_returns_json_without_false_database_outage(self):
        case = self.case('aics')
        self.assertEqual(self.upload(case, 'aics').status_code, 201)
        with patch('django.core.files.storage.FileSystemStorage.exists', side_effect=OSError('private path')):
            response = self.close(case, 'aics')
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('private path', str(response.data))
        self.assertEqual(self.client_for(self.staff['aics']).get('/api/health').status_code, 200)

    def test_released_legacy_case_can_backfill_a_missing_payout_date_from_proof(self):
        case = self.case('women-solo-parent', status='RELEASED_COMPLETED', payout_date=None)
        uploaded = self.upload(case, 'women-solo-parent')
        self.assertEqual(uploaded.status_code, 201, uploaded.data)
        case.refresh_from_db()
        self.assertEqual(case.payout_date, date.fromisoformat(self.payout_date))
        self.assertEqual(PayoutProof.objects.get(women_case=case).released_on, case.payout_date)

    def test_new_intake_cannot_forge_a_verified_payout_history_entry(self):
        from .tests import intake_payload
        for module in self.staff:
            client = self.client_for(self.staff[module])
            response = client.post(f'/api/cases/{module}', {
                **intake_payload(module),
                'monitoring_logs': [{'id': 'forged-proof', 'action': 'PAYOUT_PROOF_VERIFIED', 'type': 'proof'}],
            }, format='json')
            self.assertEqual(response.status_code, 400, response.data)
            self.assertIn('monitoring_logs', response.data)
        self.assertFalse(PayoutProof.objects.exists())

    def test_official_receipt_number_is_required_for_photos_and_completion(self):
        case = self.case('aics')
        failed = self.upload(case, 'aics', proof_type='PAYOUT_PHOTO', receipt_number='', file=self.photo())
        self.assertEqual(failed.status_code, 400, failed.data)
        self.assertIn('receipt_number', failed.data)
        self.assertFalse(PayoutProof.objects.exists())
        valid = self.upload(case, 'aics', proof_type='PAYOUT_PHOTO', receipt_number='PHOTO-OR-002', file=self.photo())
        self.assertEqual(valid.status_code, 201, valid.data)
        self.assertEqual(valid.data['data']['payout_proofs'][0]['content_type'], 'image/png')
        # Historical photos without OR numbers remain viewable but cannot authorize a new completion.
        PayoutProof.objects.filter(pk=valid.data['proof']['id']).update(receipt_number='')
        response = self.close(case, 'aics')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn('payout_proof', response.data)
