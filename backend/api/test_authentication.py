import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from .models import ApplicationAccount, AicsCase, CaseDocument, WomenAndSoloParentCase
from .tests import intake_payload


class AuthenticationTests(TestCase):
    def setUp(self):
        self.staff = self.user('staff', 'Staff')
        self.secretary = self.user('secretary', 'BarangaySecretary', 'Brgy. San Juan')
        self.resident = self.user('resident', 'Beneficiary', tracking='OWN-RECORD')

    def user(self, username, role, barangay='', tracking=''):
        user = get_user_model().objects.create_user(username=username, password='New-Password-For-Tests!')
        ApplicationAccount.objects.create(user=user, external_id=username, role=role, barangay=barangay, beneficiary_tracking_id=tracking)
        return user

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    def test_anonymous_case_profile_document_and_stats_access_is_blocked(self):
        client = APIClient()
        for route in ('/api/cases/aics', '/api/cases/women-solo-parent', '/api/beneficiaries', '/api/dashboard/stats', '/api/documents/1/file', '/api/cases/1'):
            self.assertEqual(client.get(route).status_code, 403, route)
        self.assertEqual(client.get('/api/health').status_code, 200)

    def test_login_requires_csrf_new_password_and_correct_server_role(self):
        client = APIClient(enforce_csrf_checks=True)
        body = {'username': 'secretary', 'password': 'New-Password-For-Tests!', 'role': 'BarangaySecretary'}
        self.assertEqual(client.post('/api/auth/login', body, format='json').status_code, 403)
        client.get('/api/auth/session')
        csrf = client.cookies['csrftoken'].value
        for invalid in ({**body, 'password': 'password'}, {**body, 'role': 'Administrator'}, []):
            self.assertEqual(client.post('/api/auth/login', invalid, format='json', HTTP_X_CSRFTOKEN=csrf).status_code, 400)
        response = client.post('/api/auth/login', body, format='json', HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['account']['role'], 'BarangaySecretary')
        self.assertTrue(client.get('/api/auth/session').data['authenticated'])
        self.assertEqual(client.patch('/api/cases/aics/1/step', {}, format='json').status_code, 403)
        self.assertEqual(client.post('/api/auth/logout', HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value).status_code, 200)
        self.assertEqual(client.get('/api/cases/aics').status_code, 403)

    def test_secretary_lists_and_details_are_scoped_even_without_queue_filters(self):
        client = self.client_for(self.secretary)
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            own = model.objects.create(barangay_name=' San Juan ')
            other = model.objects.create(barangay_name='Other Barangay')
            response = client.get(f'/api/cases/{module}')
            self.assertEqual([item['id'] for item in response.data['data']], [own.pk])
            self.assertEqual(client.get(f'/api/cases/{module}/{other.pk}').status_code, 404)
            self.assertEqual(client.get(f'/api/cases/{other.tracking_id}?module={module}').status_code, 404)
            self.assertEqual(client.get(f'/api/cases/{module}?barangay=Other').data['data'], [])

    def test_secretary_can_intake_but_cannot_change_barangay_or_perform_staff_actions(self):
        client = self.client_for(self.secretary)
        for module in ('aics', 'women-solo-parent'):
            created = client.post(f'/api/cases/{module}', intake_payload(module), format='json')
            self.assertEqual(created.status_code, 201, created.data)
            case = created.data['data']
            for body in ({'status': 'UNDER_REVIEW'}, {'documents_status': {'id': 'Valid'}}, {'eligibility': 'ELIGIBLE'}, {'barangay': 'Other'}, {'barangay_name': 'Other'}, {'servicePlan': {}}):
                for endpoint in (f'/api/cases/{module}/{case["id"]}/step', f'/api/cases/{module}/{case["id"]}', f'/api/cases/{case["tracking_id"]}/step?module={module}'):
                    self.assertEqual(client.patch(endpoint, body, format='json').status_code, 403)
            denied = client.post(f'/api/cases/{module}', intake_payload(module, barangay='Other'), format='json')
            self.assertEqual(denied.status_code, 403)

    def test_secretary_can_resubmit_corrections_but_not_edit_under_review(self):
        client = self.client_for(self.secretary)
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            case = model.objects.create(barangay_name='San Juan', status='RETURNED_FOR_CORRECTION')
            body = {**intake_payload(module), 'status': 'BARANGAY_ENDORSED'}
            response = client.patch(f'/api/cases/{module}/{case.pk}/step', body, format='json')
            self.assertEqual(response.status_code, 200, response.data)
            model.objects.filter(pk=case.pk).update(status='UNDER_REVIEW')
            self.assertEqual(client.patch(f'/api/cases/{module}/{case.pk}', {'firstName': 'Changed'}, format='json').status_code, 403)

    def test_document_reads_require_same_barangay(self):
        with tempfile.TemporaryDirectory() as directory, override_settings(MEDIA_ROOT=directory):
            case = AicsCase.objects.create(barangay_name='Other')
            doc = CaseDocument(aics_case=case, requirement_id='birth', name='Certificate', original_name='certificate.pdf', content_type='application/pdf')
            doc.file.save('certificate.pdf', SimpleUploadedFile('certificate.pdf', b'%PDF-1.7\nTest'))
            route = f'/api/documents/{doc.pk}/file'
            self.assertEqual(self.client_for(self.secretary).get(route).status_code, 403)
            response = self.client_for(self.staff).get(route)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b''.join(response.streaming_content), b'%PDF-1.7\nTest')

    def test_beneficiary_can_only_read_linked_record(self):
        own = AicsCase.objects.create(tracking_id='own-record')
        other = AicsCase.objects.create()
        client = self.client_for(self.resident)
        self.assertEqual([item['id'] for item in client.get('/api/cases/aics').data['data']], [own.pk])
        self.assertEqual(client.get(f'/api/cases/aics/{other.pk}').status_code, 404)
        self.assertEqual(client.patch(f'/api/cases/aics/{own.pk}', {'firstName': 'Changed'}, format='json').status_code, 403)
        self.assertEqual(client.get('/api/dashboard/stats').status_code, 403)

    def test_case_list_prefetches_documents_without_per_case_queries(self):
        for i in range(12):
            case = AicsCase.objects.create(barangay_name='San Juan')
            CaseDocument.objects.create(aics_case=case, requirement_id=str(i), name='Certificate', file=f'not-opened-{i}.pdf', original_name='certificate.pdf')
        with CaptureQueriesContext(connection) as queries:
            response = self.client_for(self.staff).get('/api/cases/aics')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 12)
        self.assertLess(len(queries), 6)

    def test_profile_payload_shapes_return_validation_errors(self):
        client = self.client_for(self.staff)
        for body in ([], ['invalid'], 'invalid', 42):
            self.assertEqual(client.post('/api/beneficiaries', body, format='json').status_code, 400)

    def test_secretary_dashboard_counts_only_assigned_barangay(self):
        AicsCase.objects.create(barangay_name='San Juan')
        AicsCase.objects.create(barangay_name='Other')
        response = self.client_for(self.secretary).get('/api/dashboard/stats')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['totalBeneficiaries'], 1)
        self.assertEqual(response.data['data']['barangayDistribution'], [{'barangay': 'San Juan', 'count': 1}])

    def test_dashboard_handles_activity_without_optional_id(self):
        AicsCase.objects.create(barangay_name='San Juan', monitoring_logs=[{'note': 'Legacy activity', 'timestamp': 42}])
        response = self.client_for(self.staff).get('/api/dashboard/stats')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['recentActivities'][0]['description'], 'Legacy activity')

    def test_malformed_monitoring_data_is_rejected_without_breaking_health(self):
        client = self.client_for(self.staff)
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            case = model.objects.create(status='RELEASED_COMPLETED')
            for logs in (None, {}, 'invalid', [1], [{'id': []}], [{'timestamp': 42}]):
                response = client.patch(f'/api/cases/{module}/{case.pk}/step', {'monitoring_logs': logs}, format='json')
                self.assertEqual(response.status_code, 400, response.data)
                self.assertEqual(client.get('/api/health').status_code, 200)
