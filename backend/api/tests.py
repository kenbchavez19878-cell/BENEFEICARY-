import json
import tempfile
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import AicsCase, CaseDocument, WomenAndSoloParentCase


class IntakeDocumentTests(TestCase):
    def setUp(self):
        self.storage = tempfile.TemporaryDirectory()
        self.addCleanup(self.storage.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.storage.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.client = APIClient()

    def submit(self, module, content=b'%PDF-1.7\nverification', filename='certificate.pdf'):
        return self.client.post(f'/api/cases/{module}', {
            'payload': json.dumps({
                'fullName': 'Test Applicant', 'barangay': 'San Juan',
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
                self.assertEqual(document['fileRef'], 'certificate.pdf')
                detail = self.client.get(f"/api/cases/{case['tracking_id']}").data['data']
                self.assertEqual(detail['documents'], case['documents'])
                opened = self.client.get(document['fileUrl'])
                self.assertEqual(opened.status_code, 200)
                self.assertEqual(opened['Content-Type'], 'application/pdf')
                self.assertEqual(b''.join(opened.streaming_content), b'%PDF-1.7\nverification')
                opened.close()
                updated = self.client.patch(f"/api/cases/{module}/{case['id']}/step", {
                    'documents_status': {'requirement-1': 'Valid'},
                }, format='json')
                self.assertEqual(updated.status_code, 200, updated.data)
                self.assertEqual(updated.data['data']['documents'][0]['status'], 'Valid')
        # Original filenames can repeat without overwriting another applicant's file.
        paths = list(CaseDocument.objects.values_list('file', flat=True))
        self.assertEqual(len(set(paths)), 2)

    def test_invalid_upload_does_not_create_case(self):
        for module in ('women-solo-parent', 'aics'):
            response = self.submit(module, b'not a PDF')
            self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(CaseDocument.objects.count(), 0)
        self.assertEqual(AicsCase.objects.count(), 0)
        self.assertEqual(WomenAndSoloParentCase.objects.count(), 0)

    def test_storage_failure_rolls_back_intake(self):
        with patch('django.core.files.storage.FileSystemStorage._save', side_effect=OSError('Storage unavailable')):
            with self.assertRaises(OSError):
                self.submit('aics')
        self.assertEqual(AicsCase.objects.count(), 0)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_json_intake_without_documents_remains_supported(self):
        response = self.client.post('/api/cases/aics', {'fullName': 'Existing Client'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['data']['documents'], [])
