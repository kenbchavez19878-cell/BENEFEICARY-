from .testing import api_test_client
import json
import tempfile
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .models import AicsCase, CaseDocument, WomenAndSoloParentCase


def intake_payload(module, **overrides):
    data = {
        'firstName': 'Test', 'middleName': '', 'lastName': 'Applicant', 'extensionName': '',
        'birthDate': '1990-08-20', 'gender': 'Female', 'civilStatus': 'Single',
        'barangay': 'San Juan', 'contactNumber': '',
    }
    if module == 'aics':
        data.update(crisisType='MEDICAL', crisisSummary='Hospital confinement',
                    incomeStatus='Indigent / No Regular Income', requestedAmount=5000)
    else:
        data.update(category='SOLO_PARENT', dependentChildren=2,
                    soloParentReason='Unmarried Parent', indigencyLevel='Low Income')
    data.update(overrides)
    return data


class IntakeDocumentTests(TestCase):
    def test_intake_cannot_prepopulate_release_details(self):
        for module in ('aics', 'women-solo-parent'):
            for field, value in (('release_method', 'CASH'), ('payout_date', '2026-11-13'), ('guarantee_letter_number', 'GL-123')):
                if module == 'women-solo-parent' and field == 'guarantee_letter_number':
                    continue
                with self.subTest(module=module, field=field):
                    response = self.client.post(f'/api/cases/{module}', intake_payload(module, **{field: value}), format='json')
                    self.assertEqual(response.status_code, 400, response.data)

    def test_registered_accountable_officer_identity(self):
        from django.contrib.auth import get_user_model
        from rest_framework.exceptions import ValidationError
        from .workflow_rules import officer
        user = get_user_model().objects.create_user(username='release.staff', first_name='Maria', last_name='Santos', is_staff=True)
        name, identity = officer({'payoutOfficerId': user.pk})
        self.assertEqual(name, 'Maria Santos')
        self.assertEqual(identity, user)
        with self.assertRaises(ValidationError):
            officer({'payoutOfficerId': user.pk, 'payoutOfficer': 'Another Person'})
        user.is_active = False
        user.save(update_fields=['is_active'])
        with self.assertRaises(ValidationError):
            officer({'payoutOfficerId': user.pk})

    def test_ordered_workflows_officer_validation_and_nonfinancial_release(self):
        for module in ('aics', 'women-solo-parent'):
            for kind in ('MONETARY', 'REFERRAL', 'DIRECT_SERVICE'):
                referral = kind == 'REFERRAL'
                nonfinancial = kind != 'MONETARY'
                with self.subTest(module=module, kind=kind):
                    case = self.submit(module).data['data']
                    endpoint = f"/api/cases/{module}/{case['id']}/step"
                    def send(payload, expected=200):
                        response = self.client.patch(endpoint, payload, format='json')
                        self.assertEqual(response.status_code, expected, response.data)
                        health = self.client.get('/api/health/')
                        self.assertEqual(health.status_code, 200, health.data)
                        self.assertEqual(health.data['database'], 'connected')
                        return response.data.get('data')
                    send({'status': 'RELEASED_COMPLETED'}, 400)
                    send({'status': 'APPROVED_FOR_RELEASE'}, 400)
                    send({'status': 'UNDER_REVIEW'})
                    send({'status': 'IN_ASSESSMENT'}, 400)
                    send({'documents_status': {'requirement-1': 'Valid'}, 'status': 'IN_ASSESSMENT'})
                    assessment = {'intakeNotes': 'Interview', 'caseStudySummary': 'Assessment', 'assignedSocialWorker': 'Maria Santos'}
                    if module == 'aics':
                        send({'socialAssessment': assessment}, 400)
                        send({'intakeInterview': {'notes': 'Interview', 'interviewer': 'Maria Santos'}, 'socialAssessment': assessment}, 400)
                        send({'intakeInterview': {'notes': 'Interview', 'interviewer': 'Maria Santos'}})
                    send({'socialAssessment': assessment})
                    if module == 'aics':
                        send({'intakeInterview': {'notes': 'Changed interview', 'interviewer': 'Maria Santos'},
                              'eligibility': 'ELIGIBLE', 'eligibilityDetails': {'notes': 'Premature determination'},
                              'status': 'ELIGIBILITY_EVALUATED'}, 400)
                    send({'status': 'APPROVED_FOR_RELEASE'}, 400)
                    send({'eligibility': 'FOR_REFERRAL' if referral else 'ELIGIBLE', 'eligibilityDetails': {'notes': 'Supported determination'}, 'status': 'ELIGIBILITY_EVALUATED'})
                    award = 'approved_amount' if module == 'aics' else 'financial_aid_amount'
                    send({award: 0 if nonfinancial else 5000, 'servicePlan': {'nonMonetarySupport': 'Hospital referral' if referral else 'Approved assistance'}, 'status': 'APPROVED_FOR_RELEASE'})
                    release = {'release_method': kind if nonfinancial else 'CASH', 'payout_date': '2026-11-13', 'status': 'RELEASED_COMPLETED'}
                    for bad in ('', 'N/A', '12345', {'name': 'Maria Santos'}, 42):
                        send({**release, 'serviceRelease': {'payoutOfficer': bad}}, 400)
                    released = send({**release, 'serviceRelease': {'payoutOfficer': 'Maria Santos', 'approvedAmount': 0 if nonfinancial else 5000}})
                    self.assertEqual(released['payout_officer_name'], 'Maria Santos')
                    self.assertIn('release', released['workflow_data']['_completed'])
                    send({'payout_date': '2026-11-14'}, 400)
                    send({'expected_version': released['workflow_version'] - 1}, 400)
                    send({'closureNotes': 'Complete', 'status': 'CASE_CLOSED'}, 400)
                    send({'monitoring_logs': [{'id': 'follow-up', 'type': 'visit', 'title': 'Visit', 'description': 'Delivery confirmed'}]})
                    send({'closureNotes': 'Complete', 'status': 'CASE_CLOSED'})
                    send({'status': 'UNDER_REVIEW'}, 400)

    def setUp(self):
        self.storage = tempfile.TemporaryDirectory()
        self.addCleanup(self.storage.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.storage.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.client = api_test_client()

    def submit(self, module, content=b'%PDF-1.7\nverification', filename='certificate.pdf', payload_overrides=None):
        return self.client.post(f'/api/cases/{module}', {
            'payload': json.dumps({
                **intake_payload(module, **(payload_overrides or {})),
                'document_metadata': [{'id': 'requirement-1', 'name': 'Verification Document'}],
            }),
            'uploaded_files': SimpleUploadedFile(filename, content, content_type='application/pdf'),
        }, format='multipart')

    def test_upload_retrieve_verify_and_open_for_both_modules(self):
        for module in ('women-solo-parent', 'aics'):
            with self.subTest(module=module):
                response = self.submit(module)
                self.assertEqual(response.status_code, 201, response.data)
                case = response.data['data']
                document = case['documents'][0]
                self.assertEqual(case['beneficiary_name'], 'Test Applicant')
                self.assertEqual(document['status'], 'Incomplete')
                self.assertFalse(document['reviewed'])
                self.assertEqual(document['fileRef'], 'certificate.pdf')
                detail = self.client.get(f"/api/cases/{case['tracking_id']}").data['data']
                self.assertEqual(detail['documents'], case['documents'])
                opened = self.client.get(document['fileUrl'])
                self.assertEqual(opened.status_code, 200)
                self.assertEqual(opened['Content-Type'], 'application/pdf')
                self.assertEqual(b''.join(opened.streaming_content), b'%PDF-1.7\nverification')
                self.client.patch(f"/api/cases/{module}/{case['id']}/step", {'status': 'UNDER_REVIEW'}, format='json')
                updated = self.client.patch(f"/api/cases/{module}/{case['id']}/step", {
                    'documents_status': {'requirement-1': 'Valid'},
                }, format='json')
                self.assertEqual(updated.status_code, 200, updated.data)
                self.assertEqual(updated.data['data']['documents'][0]['status'], 'Valid')
                self.assertTrue(updated.data['data']['documents'][0]['reviewed'])
        # Original filenames can repeat without overwriting another applicant's file.
        paths = list(CaseDocument.objects.values_list('file', flat=True))
        self.assertEqual(len(set(paths)), 2)

    def test_review_decisions_and_returned_status_survive_reload(self):
        for module in ('women-solo-parent', 'aics'):
            with self.subTest(module=module):
                response = self.client.post(f'/api/cases/{module}', {
                    'payload': json.dumps({
                        **intake_payload(module),
                        'document_metadata': [
                            {'id': 'first', 'name': 'First Document'},
                            {'id': 'second', 'name': 'Second Document'},
                        ],
                    }),
                    'uploaded_files': [
                        SimpleUploadedFile('first.pdf', b'%PDF-1.7\nfirst'),
                        SimpleUploadedFile('second.pdf', b'%PDF-1.7\nsecond'),
                    ],
                }, format='multipart')
                self.assertEqual(response.status_code, 201, response.data)
                case = response.data['data']
                endpoint = f"/api/cases/{module}/{case['id']}/step"
                self.client.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json')
                reviewed = self.client.patch(endpoint, {
                    'documents_status': {'first': 'Incomplete'},
                }, format='json')
                self.assertEqual(reviewed.status_code, 200, reviewed.data)
                docs = reviewed.data['data']['documents']
                self.assertTrue(docs[0]['reviewed'])
                self.assertFalse(docs[1]['reviewed'])
                returned = self.client.patch(endpoint, {
                    'documents_status': {'first': 'Invalid'},
                    'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Please replace the rejected verification documents.',
                }, format='json')
                self.assertEqual(returned.status_code, 200, returned.data)
                reloaded = self.client.get(f"/api/cases/{case['tracking_id']}").data['data']
                self.assertEqual(reloaded['status'], 'RETURNED_FOR_CORRECTION')
                self.assertEqual(reloaded['documents'][0]['status'], 'Invalid')
                self.assertTrue(reloaded['documents'][0]['reviewed'])
                self.assertFalse(reloaded['documents'][1]['reviewed'])

    def test_invalid_upload_does_not_create_case(self):
        for module in ('women-solo-parent', 'aics'):
            response = self.submit(module, b'not a PDF')
            self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(CaseDocument.objects.count(), 0)
        self.assertEqual(AicsCase.objects.count(), 0)
        self.assertEqual(WomenAndSoloParentCase.objects.count(), 0)

    def test_storage_failure_rolls_back_intake(self):
        with patch('django.core.files.storage.FileSystemStorage._save', side_effect=OSError('Storage unavailable')):
            response = self.submit('aics')
            self.assertEqual(response.status_code, 503)
            self.assertIn('application/json', response['Content-Type'])
        self.assertEqual(AicsCase.objects.count(), 0)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_json_structured_intake_without_documents_remains_supported(self):
        response = self.client.post('/api/cases/aics', intake_payload('aics'), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['data']['documents'], [])

    def test_name_parts_demographics_and_selector_codes_round_trip(self):
        for module in ('aics', 'women-solo-parent'):
            payload = intake_payload(module, firstName=' Maria Ana ', middleName='Dela Cruz',
                                     lastName='De Los Santos', extensionName='Jr.',
                                     gender='Other', civilStatus='Common Law', notes='Secretary endorsement')
            response = self.client.post(f'/api/cases/{module}', payload, format='json')
            self.assertEqual(response.status_code, 201, response.data)
            case = self.client.get(f"/api/cases/{response.data['data']['tracking_id']}").data['data']
            self.assertEqual(case['first_name'], 'Maria Ana')
            self.assertEqual(case['middle_name'], 'Dela Cruz')
            self.assertEqual(case['last_name'], 'De Los Santos')
            self.assertEqual(case['extension_name'], 'Jr.')
            self.assertEqual(case['gender'], 'OTHER')
            self.assertEqual(case['civil_status'], 'COMMON_LAW')
            self.assertEqual(case['birth_date'], '1990-08-20')
            self.assertEqual(case['intake_notes'], 'Secretary endorsement')
            self.assertIsNone(case['eligibility'])
            if module == 'aics':
                self.assertEqual(case['income_status'], payload['incomeStatus'])
                self.assertEqual(case['aics_type'], 'MEDICAL')

    def test_required_intake_fields_and_invalid_selectors_are_rejected(self):
        for field, bad_value in [('firstName', ' '), ('lastName', ''), ('gender', 'Unknown'),
                                 ('civilStatus', 'Unknown'), ('birthDate', '2999-01-01'),
                                 ('crisisSummary', ''), ('requestedAmount', 100)]:
            with self.subTest(field=field):
                response = self.client.post('/api/cases/aics', intake_payload('aics', **{field: bad_value}), format='json')
                self.assertEqual(response.status_code, 400, response.data)
        response = self.client.post('/api/cases/women-solo-parent', intake_payload('women-solo-parent', dependentChildren=0), format='json')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(AicsCase.objects.count(), 0)

    def test_workflow_sections_merge_without_overwriting_identity_or_endorsement(self):
        for module in ('aics', 'women-solo-parent'):
            response = self.submit(module, payload_overrides={'notes': 'Original endorsement'})
            self.assertEqual(response.status_code, 201, response.data)
            case = response.data['data']
            endpoint = f"/api/cases/{case['tracking_id']}/step"
            self.client.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json')
            self.client.patch(endpoint, {'documents_status': {'requirement-1': 'Valid'}, 'status': 'IN_ASSESSMENT'}, format='json')
            assessment = {'assignedSocialWorker': 'Registered Worker', 'intakeNotes': 'Interview completed',
                          'caseStudySummary': 'Household assessment', 'vulnerabilityLevel': 'High'}
            if module == 'aics':
                self.client.patch(endpoint, {'intakeInterview': {'notes': 'Interview completed', 'interviewer': 'Registered Worker'}}, format='json')
            saved = self.client.patch(endpoint, {'socialAssessment': assessment, 'assessment_notes': 'Staff notes'}, format='json')
            self.assertEqual(saved.status_code, 200, saved.data)
            saved = self.client.patch(endpoint, {'eligibility': 'ELIGIBLE',
                'eligibilityDetails': {'status': 'Eligible', 'notes': 'Requirements satisfied'},
                'status': 'ELIGIBILITY_EVALUATED'}, format='json')
            self.assertEqual(saved.status_code, 200, saved.data)
            saved = self.client.patch(endpoint, {'servicePlan': {'nonMonetarySupport': 'Food packs'},
                'status': 'APPROVED_FOR_RELEASE'}, format='json')
            self.assertEqual(saved.status_code, 200, saved.data)
            amount_field = 'approved_amount' if module == 'aics' else 'financial_aid_amount'
            saved = self.client.patch(endpoint, {'serviceRelease': {'payoutOfficer': 'Release Officer', 'releaseMethod': 'Guarantee Letter / GL',
                    'guaranteeLetterNumber': 'GL-TEST'}, 'release_method': 'Guarantee Letter / GL',
                    'payout_date': '2026-11-13',
                    'status': 'RELEASED_COMPLETED'}, format='json')
            self.assertEqual(saved.status_code, 200, saved.data)
            monitored = self.client.patch(endpoint, {'monitoring_logs': [{'id': 'monitor-1', 'type': 'visit', 'title': 'Follow-up', 'description': 'Service confirmed'}]}, format='json')
            self.assertEqual(monitored.status_code, 200, monitored.data)
            saved = self.client.patch(endpoint, {'closureNotes': 'Services completed', 'status': 'CASE_CLOSED'}, format='json')
            self.assertEqual(saved.status_code, 200, saved.data)
            detail = self.client.get(f"/api/cases/{case['tracking_id']}").data['data']
            self.assertEqual(detail['workflow_data']['socialAssessment'], assessment)
            self.assertEqual(detail['workflow_data']['eligibilityDetails']['notes'], 'Requirements satisfied')
            self.assertEqual(detail['workflow_data']['serviceRelease']['payoutOfficer'], 'Release Officer')
            self.assertEqual(detail['workflow_data']['closureNotes'], 'Services completed')
            self.assertEqual(detail['release_method'], 'GUARANTEE_LETTER')
            self.assertEqual(detail['intake_notes'], 'Original endorsement')
            self.assertEqual(detail['first_name'], 'Test')

    def test_incomplete_validation_steps_do_not_advance(self):
        case = self.client.post('/api/cases/aics', intake_payload('aics'), format='json').data['data']
        for payload in ({'socialAssessment': {'intakeNotes': 'Partial'}},
                        {'status': 'IN_ASSESSMENT'}, {'status': 'ELIGIBILITY_EVALUATED'},
                        {'status': 'APPROVED_FOR_RELEASE'}, {'status': 'RELEASED_COMPLETED'},
                        {'status': 'CASE_CLOSED'}):
            response = self.client.patch(f"/api/cases/{case['tracking_id']}/step", payload, format='json')
            self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(AicsCase.objects.get(pk=case['id']).status, 'BARANGAY_ENDORSED')

    def test_legacy_names_are_preserved_without_guessing_parts(self):
        case = AicsCase.objects.create(beneficiary_name='Dela Cruz, Maria Ana')
        detail = self.client.get(f'/api/cases/{case.tracking_id}').data['data']
        self.assertEqual(detail['beneficiary_name'], 'Dela Cruz, Maria Ana')
        self.assertEqual(detail['first_name'], '')
        self.assertEqual(detail['last_name'], '')

    def test_profile_name_updates_keep_all_parts_separate(self):
        for module in ('aics', 'women-solo-parent'):
            with self.subTest(module=module):
                created = self.client.post(f'/api/cases/{module}', intake_payload(module), format='json').data['data']
                names = {'firstName': 'Maria Ana', 'middleName': 'Dela Cruz',
                         'lastName': 'De Los Santos', 'extensionName': 'Jr.'}
                updated = self.client.patch(f"/api/cases/{module}/{created['id']}", names, format='json')
                self.assertEqual(updated.status_code, 200, updated.data)
                fetched = self.client.get(f"/api/cases/{created['tracking_id']}").data['data']
                for frontend, backend in [('firstName', 'first_name'), ('middleName', 'middle_name'),
                                          ('lastName', 'last_name'), ('extensionName', 'extension_name')]:
                    self.assertEqual(fetched[backend], names[frontend])
                self.assertEqual(fetched['status'], created['status'])
                self.assertEqual(fetched['gender'], created['gender'])
                cleared = self.client.patch(f"/api/cases/{module}/{created['id']}",
                    {'middleName': '', 'extensionName': ''}, format='json')
                self.assertEqual(cleared.status_code, 200, cleared.data)
                self.assertEqual(cleared.data['last_name'], 'De Los Santos')
                self.assertEqual(cleared.data['first_name'], 'Maria Ana')
                self.assertEqual(cleared.data['middle_name'], '')
                self.assertEqual(cleared.data['extension_name'], '')

    def test_beneficiary_name_parts_round_trip_through_create_and_patch(self):
        names = {'firstName': 'Juan Miguel', 'middleName': 'Dela Cruz',
                 'lastName': 'De Los Reyes', 'extensionName': 'III'}
        response = self.client.post('/api/beneficiaries', names, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        beneficiary = response.data['data']
        response = self.client.patch(f"/api/beneficiaries/{beneficiary['id']}",
                                    {'middleName': 'Santos', 'extensionName': 'Jr.'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        result = self.client.get(f"/api/beneficiaries/{beneficiary['id']}").data
        self.assertEqual(result['first_name'], 'Juan Miguel')
        self.assertEqual(result['middle_name'], 'Santos')
        self.assertEqual(result['last_name'], 'De Los Reyes')
        self.assertEqual(result['extension_name'], 'Jr.')
