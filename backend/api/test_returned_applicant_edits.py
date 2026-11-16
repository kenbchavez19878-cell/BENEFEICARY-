import json
import tempfile
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import AicsCase, WomenAndSoloParentCase
from .tests import intake_payload


class ReturnedApplicantEditsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('sync_demo_accounts', stdout=StringIO())

    def client_for(self, username):
        client = APIClient()
        client.force_authenticate(get_user_model().objects.get(username=username))
        return client

    def test_full_correction_preserves_identity_files_and_staff_handoff(self):
        secretary = self.client_for('barangaysecretary')
        with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            for module, model, username in (('aics', AicsCase, 'staff_aics'), ('women-solo-parent', WomenAndSoloParentCase, 'staff_women_solo')):
                staff = self.client_for(username)
                created = secretary.post(f'/api/cases/{module}', {
                    'payload': json.dumps({**intake_payload(module, barangay='San Vicente', notes='Original intake notes'),
                                          'document_metadata': [{'id': 'flagged', 'name': 'Flagged document'}, {'id': 'retained', 'name': 'Accepted document'}]}),
                    'uploaded_files': [SimpleUploadedFile('flagged.pdf', b'%PDF-1.7\nold'), SimpleUploadedFile('retained.pdf', b'%PDF-1.7\nretained')],
                }, format='multipart')
                self.assertEqual(created.status_code, 201, created.data)
                original = created.data['data']
                endpoint = f'/api/cases/{module}/{original["id"]}/step'
                self.assertEqual(staff.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json').status_code, 200)
                returned = staff.patch(endpoint, {'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Correct all applicant details and replace the flagged document.', 'requiredDocumentReplacements': ['flagged']}, format='json')
                self.assertEqual(returned.status_code, 200, returned.data)
                before = model.objects.get(pk=original['id']).attachments.get(requirement_id='retained').file.name
                changes = {'status': 'BARANGAY_ENDORSED', 'expected_version': returned.data['data']['workflow_version'],
                           'firstName': 'Corrected First', 'middleName': 'Updated Middle', 'lastName': 'Updated Last', 'extensionName': 'Jr.',
                           'birthDate': '1994-03-02', 'gender': 'OTHER', 'civilStatus': 'SEPARATED', 'barangay': 'Punta Tarawal',
                           'contactNumber': '09171234567', 'applicantNotes': 'Corrected intake narrative.',
                           'document_metadata': [{'id': 'flagged', 'name': 'Flagged document'}]}
                if module == 'aics':
                    changes.update(crisisType='BURIAL', crisisSummary='Updated funeral assistance request.', serviceProvider='Updated provider', incomeStatus='Seasonal worker', requestedAmount=1500)
                    expected = {'aics_type': 'BURIAL', 'crisis_summary': 'Updated funeral assistance request.', 'service_provider': 'Updated provider', 'income_status': 'Seasonal worker', 'approved_amount': '1500.00'}
                else:
                    changes.update(category='SOLO_PARENT', dependentChildren=4, soloParentReason='Abandonment', indigencyLevel='Extremely Indigent', financialAidAmount=1000)
                    expected = {'category': 'SOLO_PARENT', 'dependent_children': 4, 'solo_parent_reason': 'Abandonment', 'indigency_level': 'Extremely Indigent', 'financial_aid_amount': '1000.00'}
                saved = secretary.patch(endpoint, {'payload': json.dumps(changes), 'uploaded_files': SimpleUploadedFile('corrected.pdf', b'%PDF-1.7\nnew')}, format='multipart')
                self.assertEqual(saved.status_code, 200, saved.data)
                expected.update(first_name='Corrected First', middle_name='Updated Middle', last_name='Updated Last', extension_name='Jr.',
                                birth_date='1994-03-02', gender='OTHER', civil_status='SEPARATED', barangay_name='Punta Tarawal', contact_number='09171234567', intake_notes='Corrected intake narrative.', status='BARANGAY_ENDORSED')
                queue = staff.get(f'/api/cases/{module}').data['data']
                row = next(row for row in queue if row['id'] == original['id'])
                for field, value in expected.items():
                    self.assertEqual(row[field], value, field)
                self.assertEqual(row['tracking_id'], original['tracking_id'])
                self.assertEqual(row['workflow_data']['_completed'], {})
                case = model.objects.get(pk=original['id'])
                self.assertEqual(case.attachments.count(), 2)
                self.assertEqual(case.attachments.get(requirement_id='retained').file.name, before)
                self.assertEqual(case.attachments.get(requirement_id='flagged').original_name, 'corrected.pdf')
                self.assertEqual(secretary.patch(endpoint, {'eligibility': 'ELIGIBLE'}, format='json').status_code, 403)
                self.assertEqual(staff.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json').status_code, 200)
                self.assertEqual(secretary.patch(endpoint, {'firstName': 'Locked'}, format='json').status_code, 403)

    def test_category_can_be_corrected_and_notes_cannot_be_changed_outside_return(self):
        secretary = self.client_for('barangaysecretary')
        staff = self.client_for('staff_women_solo')
        created = secretary.post('/api/cases/women-solo-parent', intake_payload('women-solo-parent', barangay='San Vicente'), format='json')
        case = created.data['data']
        endpoint = f'/api/cases/women-solo-parent/{case["id"]}/step'
        self.assertEqual(secretary.patch(endpoint, {'applicantNotes': 'Premature correction'}, format='json').status_code, 400)
        self.assertEqual(staff.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json').status_code, 200)
        self.assertEqual(staff.patch(endpoint, {'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Correct the program category.'}, format='json').status_code, 200)
        saved = secretary.patch(endpoint, {'status': 'BARANGAY_ENDORSED', 'category': 'WOMEN_VAWC', 'dependentChildren': 0, 'soloParentReason': '', 'applicantNotes': ''}, format='json')
        self.assertEqual(saved.status_code, 200, saved.data)
        self.assertEqual(saved.data['data']['category'], 'WOMEN_VAWC')
        self.assertIsNone(saved.data['data']['solo_parent_reason'])
        self.assertEqual(saved.data['data']['intake_notes'], '')
