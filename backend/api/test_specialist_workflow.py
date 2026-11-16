from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .tests import intake_payload


class SpecialistWorkflowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('sync_demo_accounts', stdout=StringIO())

    def client_for(self, username):
        client = APIClient()
        client.force_authenticate(get_user_model().objects.get(username=username))
        return client

    def test_secretary_endorse_return_and_resubmit_for_each_specialist(self):
        secretary = self.client_for('barangaysecretary')
        for module, username, other in (('aics', 'staff_aics', 'staff_women_solo'), ('women-solo-parent', 'staff_women_solo', 'staff_aics')):
            payload = intake_payload(module, barangay='San Vicente')
            created = secretary.post(f'/api/cases/{module}', payload, format='json')
            self.assertEqual(created.status_code, 201, created.data)
            record = created.data['data']
            client = self.client_for(username)
            endpoint = f'/api/cases/{module}/{record["id"]}/step'
            self.assertEqual(client.get(f'/api/cases/{module}').data['count'], 1)
            self.assertEqual(secretary.get(f'/api/cases/{module}?queue=secretary&barangay=San%20Vicente').data['count'], 1)
            denied = self.client_for(other)
            for path in (f'/api/cases/{module}', f'/api/cases/{module}/{record["id"]}'):
                self.assertEqual(denied.get(path).status_code, 403)
            self.assertEqual(denied.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json').status_code, 403)
            self.assertEqual(denied.get(f'/api/cases/{record["tracking_id"]}?module={module}').status_code, 404)
            self.assertEqual(client.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json').status_code, 200)
            returned = client.patch(endpoint, {'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Correct the contact number.'}, format='json')
            self.assertEqual(returned.status_code, 200, returned.data)
            rows = secretary.get(f'/api/cases/{module}?queue=secretary&barangay=San%20Vicente').data['data']
            self.assertEqual(rows[0]['status'], 'RETURNED_FOR_CORRECTION')
            self.assertEqual(rows[0]['correction_notes'], 'Correct the contact number.')
            resubmitted = secretary.patch(endpoint, {**payload, 'status': 'BARANGAY_ENDORSED', 'contactNumber': '09171234567'}, format='json')
            self.assertEqual(resubmitted.status_code, 200, resubmitted.data)
            self.assertEqual(client.get(f'/api/cases/{module}').data['data'][0]['status'], 'BARANGAY_ENDORSED')
            self.assertEqual(client.get('/api/dashboard/stats').data['data']['totalBeneficiaries'], 1)

    def test_session_authenticated_staff_can_acknowledge_and_advance(self):
        import json
        import tempfile
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test import override_settings
        from .models import ApplicationAccount

        for module, username, password, stored_role, stored_module in (
            ('aics', 'staff_aics', 'Staff_AICS@2026!', ' Staff ', ' AICS '),
            ('women-solo-parent', 'staff_women_solo', 'Staff_Women@2026!', 'MSWD Staff', 'WOMEN_SOLO_PARENT'),
        ):
            profile = ApplicationAccount.objects.get(user__username=username)
            profile.role, profile.case_module = stored_role, stored_module
            profile.save(update_fields=['role', 'case_module'])
            client = APIClient(enforce_csrf_checks=True)
            client.get('/api/auth/session')
            logged_in = client.post('/api/auth/login', {'username': username, 'password': password, 'role': 'Staff'},
                                   format='json', HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value)
            self.assertEqual(logged_in.status_code, 200, logged_in.data)
            csrf = {'HTTP_X_CSRFTOKEN': client.cookies['csrftoken'].value}
            with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
                created = client.post(f'/api/cases/{module}', {
                    'payload': json.dumps({**intake_payload(module), 'document_metadata': [{'id': 'identity', 'name': 'Verification'}]}),
                    'uploaded_files': SimpleUploadedFile('verification.pdf', b'%PDF-1.7\nverification'),
                }, format='multipart', **csrf)
                self.assertEqual(created.status_code, 201, created.data)
                record = created.data['data']
                endpoint = f'/api/cases/{module}/{record["id"]}/step'
                acknowledged = client.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json', **csrf)
                self.assertEqual(acknowledged.status_code, 200, acknowledged.data)
                advanced = client.patch(f'/api/cases/{record["tracking_id"]}/step', {
                    'moduleType': module, 'status': 'IN_ASSESSMENT', 'documents_status': {'identity': 'Valid'},
                }, format='json', **csrf)
                self.assertEqual(advanced.status_code, 200, advanced.data)
                other = 'aics' if module != 'aics' else 'women-solo-parent'
                self.assertEqual(client.patch(f'/api/cases/{other}/1/step', {'status': 'UNDER_REVIEW'}, format='json', **csrf).status_code, 403)
            client.post('/api/auth/logout', **csrf)
            self.assertEqual(client.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json').status_code, 403)

    def test_women_staff_acknowledgement_all_routes_and_methods(self):
        staff = self.client_for('staff_women_solo')
        secretary = self.client_for('barangaysecretary')
        for method, generic in (('patch', False), ('post', False), ('patch', True)):
            created = secretary.post('/api/cases/women-solo-parent', intake_payload('women-solo-parent', barangay='San Vicente'), format='json')
            self.assertEqual(created.status_code, 201, created.data)
            record = created.data['data']
            endpoint = (f'/api/cases/{record["tracking_id"]}/step' if generic
                        else f'/api/cases/women-solo-parent/{record["id"]}/step')
            denied = secretary.patch(endpoint, {'status': 'UNDER_REVIEW', 'moduleType': 'solo-parent'}, format='json')
            self.assertEqual(denied.status_code, 403)
            self.assertIn('BarangaySecretary', str(denied.data['detail']))
            response = getattr(staff, method)(endpoint, {'status': 'UNDER_REVIEW', 'moduleType': 'solo-parent'}, format='json')
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data['data']['status'], 'UNDER_REVIEW')
