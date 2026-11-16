from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .tests import intake_payload


class TabSessionHandoffTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('sync_demo_accounts', stdout=StringIO())

    def setUp(self):
        # One cookie jar models multiple tabs sharing the same browser cookies.
        self.browser = APIClient(enforce_csrf_checks=True)
        self.browser.get('/api/auth/session')

    def login(self, username, password, role):
        response = self.browser.post('/api/auth/login', {
            'username': username, 'password': password, 'role': role,
        }, format='json', HTTP_X_CSRFTOKEN=self.browser.cookies['csrftoken'].value)
        self.assertEqual(response.status_code, 200, response.data)
        return response.data['sessionToken']

    def headers(self, token):
        return {'HTTP_X_BENEFITRACK_SESSION': token, 'HTTP_X_CSRFTOKEN': self.browser.cookies['csrftoken'].value}

    def test_both_program_handoffs_survive_role_switches_and_independent_logout(self):
        secretary = self.login('barangaysecretary', 'Barangay_Sec@2026!', 'BarangaySecretary')
        for module, username, password in (
            ('aics', 'staff_aics', 'Staff_AICS@2026!'),
            ('women-solo-parent', 'staff_women_solo', 'Staff_Women@2026!'),
        ):
            staff = self.login(username, password, 'Staff')
            # The shared cookie now belongs to Staff; the Secretary tab retains its own identity.
            created = self.browser.post(f'/api/cases/{module}', intake_payload(module, barangay='Punta Tarawal'), format='json', **self.headers(secretary))
            self.assertEqual(created.status_code, 201, created.data)
            record = created.data['data']
            # A fresh Secretary login must not revoke either existing tab session.
            other_secretary = self.login('barangaysecretary', 'Barangay_Sec@2026!', 'BarangaySecretary')
            queue = self.browser.get(f'/api/cases/{module}', **self.headers(staff))
            self.assertIn(record['id'], [row['id'] for row in queue.data['data']])
            endpoint = f'/api/cases/{module}/{record["id"]}/step'
            ack = self.browser.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json', **self.headers(staff))
            self.assertEqual(ack.status_code, 200, ack.data)
            denied = self.browser.patch(endpoint, {'status': 'IN_ASSESSMENT'}, format='json', **self.headers(secretary))
            self.assertEqual(denied.status_code, 403)
            returned = self.browser.patch(endpoint, {'status': 'RETURNED_FOR_CORRECTION', 'correctionNotes': 'Correct the contact number.'}, format='json', **self.headers(staff))
            self.assertEqual(returned.status_code, 200, returned.data)
            fixed = self.browser.patch(endpoint, {'status': 'BARANGAY_ENDORSED', 'contactNumber': '09171234567'}, format='json', **self.headers(secretary))
            self.assertEqual(fixed.status_code, 200, fixed.data)
            self.assertEqual(self.browser.post('/api/auth/logout', **self.headers(other_secretary)).status_code, 200)
            self.assertEqual(self.browser.get('/api/auth/session', **self.headers(staff)).data['account']['role'], 'Staff')
            self.assertEqual(self.browser.patch(endpoint, {'status': 'UNDER_REVIEW'}, format='json', **self.headers(staff)).status_code, 200)
            wrong_module = 'aics' if module != 'aics' else 'women-solo-parent'
            self.assertEqual(self.browser.get(f'/api/cases/{wrong_module}', **self.headers(staff)).status_code, 403)
            self.assertEqual(self.browser.post('/api/auth/logout', **self.headers(staff)).status_code, 200)
            # Revoked credentials cannot silently fall back to a different cookie identity.
            self.assertEqual(self.browser.get('/api/auth/session', **self.headers(staff)).status_code, 403)
        self.assertEqual(self.browser.get('/api/auth/session', **self.headers(secretary)).data['account']['role'], 'BarangaySecretary')

    def test_invalid_token_and_missing_csrf_cannot_fall_back_to_cookie(self):
        staff = self.login('staff_women_solo', 'Staff_Women@2026!', 'Staff')
        self.assertEqual(self.browser.get('/api/cases/women-solo-parent', **self.headers(staff + 'bad')).status_code, 403)
        self.assertEqual(self.browser.post('/api/auth/logout', HTTP_X_BENEFITRACK_SESSION=staff).status_code, 403)
        self.assertEqual(self.browser.get('/api/auth/session', **self.headers(staff)).data['account']['role'], 'Staff')

    def test_document_access_uses_tab_identity_after_other_staff_login(self):
        import tempfile
        from django.test import override_settings
        from django.core.files.uploadedfile import SimpleUploadedFile
        from .models import AicsCase, WomenAndSoloParentCase, CaseDocument
        aics_staff = self.login('staff_aics', 'Staff_AICS@2026!', 'Staff')
        women_staff = self.login('staff_women_solo', 'Staff_Women@2026!', 'Staff')
        with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            for model, relation, allowed, denied in (
                (AicsCase, 'aics_case', aics_staff, women_staff),
                (WomenAndSoloParentCase, 'women_case', women_staff, aics_staff),
            ):
                case = model.objects.create(barangay_name='Punta Tarawal')
                document = CaseDocument(**{relation: case}, requirement_id='identity', name='Verification', original_name='verification.pdf', content_type='application/pdf')
                content = b'%PDF-1.7\nverification'
                document.file.save('verification.pdf', SimpleUploadedFile('verification.pdf', content))
                route = f'/api/documents/{document.pk}/file'
                response = self.browser.get(route, **self.headers(allowed))
                self.assertEqual(response.status_code, 200)
                self.assertEqual(b''.join(response.streaming_content), content)
                self.assertEqual(self.browser.get(route, **self.headers(denied)).status_code, 403)
