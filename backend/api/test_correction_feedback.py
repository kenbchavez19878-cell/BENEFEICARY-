from .testing import api_test_client
import json
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase, override_settings

from .models import AicsCase, CaseDocument, WomenAndSoloParentCase


class CorrectionFeedbackTests(TestCase):
    def setUp(self):
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        settings = override_settings(MEDIA_ROOT=self.media.name)
        settings.enable()
        self.addCleanup(settings.disable)
        self.client = api_test_client()

    def case(self, model):
        case = model.objects.create(first_name='Original', last_name='Applicant', barangay_name='San Juan', status='UNDER_REVIEW', documents_status={'required': 'Invalid'}, workflow_data={'_completed': {'endorsementReviewed': 'saved'}})
        relation = {'aics_case': case} if model is AicsCase else {'women_case': case}
        document = CaseDocument(**relation, requirement_id='required', name='Required Document', original_name='old.pdf', content_type='application/pdf')
        document.file.save('old.pdf', SimpleUploadedFile('old.pdf', b'%PDF-1.7\nold document'), save=True)
        return case, document

    def return_case(self, case, module):
        response = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {
            'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Replace the blurred document and correct the applicant name.',
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        case.refresh_from_db()
        return response

    def resubmit(self, case, module, content=b'%PDF-1.7\ncorrected document', filename='corrected.pdf'):
        return self.client.patch(f'/api/cases/{module}/{case.pk}/step', {
            'payload': json.dumps({
                'status': 'BARANGAY_ENDORSED', 'expected_version': case.workflow_version,
                'firstName': 'Corrected', 'lastName': 'Applicant',
                'birthDate': '1990-08-20', 'gender': 'Female', 'civilStatus': 'Single',
                'contactNumber': '09171234567',
                'action_note': 'Corrected details and replacement document submitted.',
                'document_metadata': [{'id': 'required', 'name': 'Required Document'}],
            }),
            'uploaded_files': SimpleUploadedFile(filename, content, content_type='application/pdf'),
        }, format='multipart')

    def test_specific_notes_required_and_visible_in_log_and_serializer(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            case, _ = self.case(model)
            for notes in (None, '', '   ', {'invalid': True}):
                payload = {'status': 'RETURNED_FOR_CORRECTION'}
                if notes is not None:
                    payload['correctionNotes'] = notes
                response = self.client.patch(f'/api/cases/{module}/{case.pk}/step', payload, format='json')
                self.assertEqual(response.status_code, 400, response.data)
            response = self.return_case(case, module)
            self.assertEqual(response.data['data']['correction_notes'], 'Replace the blurred document and correct the applicant name.')
            self.assertEqual(case.monitoring_logs[-1]['note'], response.data['data']['correction_notes'])
            self.assertEqual(case.workflow_data['_completed'], {})
            skipped = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {'status': 'UNDER_REVIEW'}, format='json')
            self.assertEqual(skipped.status_code, 400)

    def test_complete_replacement_resubmission_and_municipal_reverification(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            case, document = self.case(model)
            previous_file = document.file.name
            self.return_case(case, module)
            rejected = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {'status': 'BARANGAY_ENDORSED'}, format='json')
            self.assertEqual(rejected.status_code, 400)
            response = self.resubmit(case, module)
            self.assertEqual(response.status_code, 200, response.data)
            case.refresh_from_db()
            document.refresh_from_db()
            self.assertEqual(case.status, 'BARANGAY_ENDORSED')
            self.assertEqual(case.first_name, 'Corrected')
            self.assertEqual(case.gender, 'FEMALE')
            self.assertEqual(case.civil_status, 'SINGLE')
            self.assertEqual(case.contact_number, '09171234567')
            self.assertEqual(case.workflow_data['_completed'], {})
            self.assertNotIn('required', case.documents_status)
            self.assertNotEqual(document.file.name, previous_file)
            self.assertTrue((Path(self.media.name) / previous_file).exists())
            self.assertEqual(response.data['data']['documents'][0]['status'], 'Incomplete')
            self.assertFalse(response.data['data']['documents'][0]['reviewed'])
            self.assertEqual(case.monitoring_logs[-1]['action'], 'BARANGAY_ENDORSED')
            opened = self.client.get(response.data['data']['documents'][0]['fileUrl'])
            self.assertEqual(opened.status_code, 200)
            self.assertIn(b'corrected document', b''.join(opened.streaming_content))
            queue = self.client.get(f'/api/cases/{module}', {'queue': 'secretary', 'barangay': 'San Juan'})
            self.assertIn(case.pk, [row['id'] for row in queue.data['data']])
            route = f'/api/cases/{module}/{case.pk}/step'
            self.assertEqual(self.client.patch(route, {'status': 'UNDER_REVIEW'}, format='json').status_code, 200)
            self.assertEqual(self.client.patch(route, {'status': 'IN_ASSESSMENT'}, format='json').status_code, 400)
            verified = self.client.patch(route, {'documents_status': {'required': 'Valid'}, 'status': 'IN_ASSESSMENT'}, format='json')
            self.assertEqual(verified.status_code, 200, verified.data)
            self.assertEqual(self.client.get('/api/health/').data['database'], 'connected')

    def test_invalid_replacement_preserves_existing_document_and_case(self):
        case, document = self.case(WomenAndSoloParentCase)
        self.return_case(case, 'women-solo-parent')
        previous = document.file.name
        for content, filename in ((b'not a PDF', 'bad.pdf'), (b'%PDF-' + b'x' * (10 * 1024 * 1024), 'large.pdf')):
            response = self.resubmit(case, 'women-solo-parent', content, filename)
            self.assertEqual(response.status_code, 400, response.data)
        case.refresh_from_db()
        document.refresh_from_db()
        self.assertEqual(case.status, 'RETURNED_FOR_CORRECTION')
        self.assertEqual(document.file.name, previous)
        self.assertEqual(len(list(Path(self.media.name).rglob('*.pdf'))), 1)

    def test_failed_case_save_rolls_back_replacement_and_removes_new_file(self):
        case, document = self.case(WomenAndSoloParentCase)
        self.return_case(case, 'women-solo-parent')
        previous = document.file.name
        with patch.object(WomenAndSoloParentCase, 'save', side_effect=IntegrityError('Simulated write rejection')):
            response = self.resubmit(case, 'women-solo-parent')
        self.assertEqual(response.status_code, 400)
        case.refresh_from_db()
        document.refresh_from_db()
        self.assertEqual(case.status, 'RETURNED_FOR_CORRECTION')
        self.assertEqual(document.file.name, previous)
        self.assertEqual(len(list(Path(self.media.name).rglob('*.pdf'))), 1)
        self.assertEqual(self.client.get('/api/health/').data['database'], 'connected')

    def test_closed_case_cannot_accept_replacement(self):
        case, document = self.case(WomenAndSoloParentCase)
        WomenAndSoloParentCase.objects.filter(pk=case.pk).update(status='CASE_CLOSED')
        case.refresh_from_db()
        response = self.resubmit(case, 'women-solo-parent')
        self.assertEqual(response.status_code, 400)
        document.refresh_from_db()
        self.assertEqual(document.original_name, 'old.pdf')

    def test_valid_file_above_memory_upload_threshold_is_supported(self):
        case, document = self.case(WomenAndSoloParentCase)
        self.return_case(case, 'women-solo-parent')
        response = self.resubmit(case, 'women-solo-parent', b'%PDF-1.7\n' + b'x' * (3 * 1024 * 1024))
        self.assertEqual(response.status_code, 200, response.data)
        document.refresh_from_db()
        self.assertGreater(document.file.size, 3 * 1024 * 1024)

    def test_standard_detail_update_also_records_correction_instructions(self):
        case, _ = self.case(WomenAndSoloParentCase)
        response = self.client.patch(f'/api/cases/women-solo-parent/{case.pk}', {
            'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Please supply a readable certificate.',
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        case.refresh_from_db()
        self.assertEqual(case.monitoring_logs[-1]['action'], 'RETURNED_FOR_CORRECTION')
        self.assertEqual(case.monitoring_logs[-1]['note'], 'Please supply a readable certificate.')

    def test_storage_failure_is_json_503_and_preserves_original_document(self):
        case, document = self.case(WomenAndSoloParentCase)
        self.return_case(case, 'women-solo-parent')
        previous = document.file.name
        with patch.object(document.file.storage, 'save', side_effect=OSError('Private storage path')):
            response = self.resubmit(case, 'women-solo-parent')
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('Private', str(response.data))
        case.refresh_from_db()
        document.refresh_from_db()
        self.assertEqual(case.status, 'RETURNED_FOR_CORRECTION')
        self.assertEqual(document.file.name, previous)
        self.assertEqual(self.client.get('/api/health/').data['database'], 'connected')

    def test_resubmit_without_new_files_preserves_existing_attachments(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            for multipart in (False, True):
                case, document = self.case(model)
                case.documents_status = {'required': 'Valid'}
                case.save(update_fields=['documents_status'])
                before = (document.pk, document.file.name, document.original_name, document.uploaded_at)
                self.return_case(case, module)
                body = {'status': 'BARANGAY_ENDORSED', 'contactNumber': '09171234567'}
                response = self.client.patch(f'/api/cases/{module}/{case.pk}/step',
                                             {'payload': json.dumps(body)} if multipart else body,
                                             format='multipart' if multipart else 'json')
                self.assertEqual(response.status_code, 200, response.data)
                document.refresh_from_db()
                self.assertEqual(case.attachments.count(), 1)
                self.assertEqual((document.pk, document.file.name, document.original_name, document.uploaded_at), before)
                self.assertTrue(document.file.storage.exists(document.file.name))
                self.assertEqual(response.data['data']['documents'][0]['fileRef'], 'old.pdf')
                self.assertTrue(response.data['data']['documents'][0]['fileUrl'])

    def test_replacing_one_file_preserves_other_file_and_legacy_filename(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            case, replaced = self.case(model)
            relation = {'aics_case': case} if model is AicsCase else {'women_case': case}
            retained = CaseDocument(**relation, requirement_id='retained', name='Proof of Solo Parent Status', original_name='', content_type='application/pdf')
            retained.file.save('proof.pdf', SimpleUploadedFile('proof.pdf', b'%PDF-1.7\nretained'))
            before = (retained.file.name, retained.uploaded_at)
            self.return_case(case, module)
            response = self.resubmit(case, module)
            self.assertEqual(response.status_code, 200, response.data)
            retained.refresh_from_db()
            self.assertEqual((retained.file.name, retained.uploaded_at), before)
            self.assertEqual(case.attachments.count(), 2)
            serialized = next(doc for doc in response.data['data']['documents'] if doc['id'] == 'retained')
            self.assertEqual(serialized['fileRef'], Path(retained.file.name).name)
            self.assertTrue(retained.file.storage.exists(retained.file.name))

    def test_optional_incomplete_document_does_not_block_resubmission(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            case, document = self.case(model)
            case.documents_status = {'required': 'Incomplete'}
            case.save(update_fields=['documents_status'])
            response = self.return_case(case, module)
            self.assertFalse(response.data['data']['documents'][0]['replacementRequired'])
            previous = document.file.name
            submitted = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {'status': 'BARANGAY_ENDORSED'}, format='json')
            self.assertEqual(submitted.status_code, 200, submitted.data)
            document.refresh_from_db()
            self.assertEqual(document.file.name, previous)

    def test_explicit_requirements_can_be_waived_or_completed_before_resubmission(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            case, document = self.case(model)
            returned = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {
                'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Correct contact number; existing file is acceptable.',
                'requiredDocumentReplacements': [],
            }, format='json')
            self.assertEqual(returned.status_code, 200, returned.data)
            submitted = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {'status': 'BARANGAY_ENDORSED'}, format='json')
            self.assertEqual(submitted.status_code, 200, submitted.data)
            case, document = self.case(model)
            returned = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {
                'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Upload a readable replacement.',
                'requiredDocumentReplacements': ['required'],
            }, format='json')
            self.assertEqual(returned.status_code, 200, returned.data)
            self.assertTrue(returned.data['data']['documents'][0]['replacementRequired'])
            blocked = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {'status': 'BARANGAY_ENDORSED'}, format='json')
            self.assertEqual(blocked.status_code, 400)
            # A replacement may be saved first; later resubmission must not demand it again.
            uploaded = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {
                'payload': json.dumps({'document_metadata': [{'id': 'required', 'name': 'Required Document'}]}),
                'uploaded_files': SimpleUploadedFile('replacement.pdf', b'%PDF-1.7\nreplacement'),
            }, format='multipart')
            self.assertEqual(uploaded.status_code, 200, uploaded.data)
            self.assertFalse(uploaded.data['data']['documents'][0]['replacementRequired'])
            submitted = self.client.patch(f'/api/cases/{module}/{case.pk}/step', {'status': 'BARANGAY_ENDORSED'}, format='json')
            self.assertEqual(submitted.status_code, 200, submitted.data)
