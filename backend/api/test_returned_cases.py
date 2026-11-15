from .testing import api_test_client
from django.test import TestCase

from .models import AicsCase, WomenAndSoloParentCase


class ReturnedCaseWorkflowTests(TestCase):
    modules = (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase))

    def test_returned_cases_in_default_and_scoped_secretary_queues(self):
        client = api_test_client()
        for module, model in self.modules:
            returned = model.objects.create(status='RETURNED_FOR_CORRECTION', barangay_name='San Juan')
            other = model.objects.create(status='RETURNED_FOR_CORRECTION', barangay_name='San Juan Sur')
            closed = model.objects.create(status='CASE_CLOSED', barangay_name='San Juan')
            response = client.get(f'/api/cases/{module}')
            self.assertIn(returned.pk, [row['id'] for row in response.data['data']])
            response = client.get(f'/api/cases/{module}', {'queue': 'secretary', 'barangay': 'Brgy. San Juan'})
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual([row['id'] for row in response.data['data']], [returned.pk])
            response = client.get(f'/api/cases/{module}', {'status': 'Returned for Correction', 'barangay': 'San Juan'})
            self.assertEqual(response.status_code, 200)
            self.assertIn(returned.pk, [row['id'] for row in response.data['data']])
            self.assertEqual(client.get(f'/api/cases/{module}', {'queue': 'secretary'}).status_code, 400)

    def test_return_edit_resubmit_and_reassessment_without_skipping(self):
        client = api_test_client()
        for module, model in self.modules:
            case = model.objects.create(first_name='Original', last_name='Applicant', barangay_name='San Juan', status='UNDER_REVIEW', eligibility='ELIGIBLE', workflow_data={'_completed': {'assessment': 'old', 'approval': 'old'}})
            route = f'/api/cases/{module}/{case.pk}/step'
            response = client.patch(route, {'status': 'RETURNED_FOR_CORRECTION', 'action_note': 'Please correct applicant name.', 'correctionNotes': 'Please correct applicant name.'}, format='json')
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data['data']['workflow_data']['_completed'], {})
            version = response.data['data']['workflow_version']
            response = client.patch(route, {'status': 'BARANGAY_ENDORSED', 'firstName': 'Corrected', 'lastName': 'Applicant', 'expected_version': version}, format='json')
            self.assertEqual(response.status_code, 200, response.data)
            case.refresh_from_db()
            self.assertEqual(case.first_name, 'Corrected')
            self.assertEqual(case.status, 'BARANGAY_ENDORSED')
            self.assertIsNone(case.eligibility)
            self.assertEqual(case.workflow_data['_completed'], {})
            queued = client.get(f'/api/cases/{module}', {'queue': 'secretary', 'barangay': 'Brgy. San Juan'})
            self.assertEqual(queued.status_code, 200)
            self.assertIn(case.pk, [row['id'] for row in queued.data['data']])
            rejected = client.patch(route, {'status': 'APPROVED_FOR_RELEASE'}, format='json')
            self.assertEqual(rejected.status_code, 400)
            response = client.patch(route, {'status': 'UNDER_REVIEW'}, format='json')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(client.get('/api/health/').data['database'], 'connected')

    def test_returned_cases_count_as_active_dashboard_tasks(self):
        for _, model in self.modules:
            model.objects.create(status='RETURNED_FOR_CORRECTION')
        response = api_test_client().get('/api/dashboard/stats')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['activeCases'], 2)

    def test_whitespace_and_prefix_do_not_hide_resubmitted_cases(self):
        client = api_test_client()
        for module, model in self.modules:
            for barangay in (' San Juan ', ' Brgy. San Juan ', 'Barangay San Juan'):
                case = model.objects.create(status='BARANGAY_ENDORSED', barangay_name=barangay)
                response = client.get(f'/api/cases/{module}', {'queue': 'secretary', 'barangay': 'San Juan'})
                self.assertEqual(response.status_code, 200)
                self.assertIn(case.pk, [row['id'] for row in response.data['data']])
