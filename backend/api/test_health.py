from .testing import api_test_client
from unittest.mock import patch

from django.db import OperationalError
from django.test import TestCase

from .models import AicsCase, CaseStatus, WomenAndSoloParentCase
from .tests import intake_payload


class DatabaseHealthTests(TestCase):
    def setUp(self):
        self.client = api_test_client()

    def test_health_queries_database_and_disables_caching(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['database'], 'connected')
        self.assertEqual(response['Cache-Control'], 'no-store')

    def test_database_failure_and_recovery(self):
        with patch('api.views.connection.cursor', side_effect=OperationalError('private connection details')):
            response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data['database'], 'disconnected')
        self.assertNotIn('private', str(response.data))
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertEqual(self.client.get('/api/health/').status_code, 200)

    def test_closed_case_remains_readable_and_does_not_affect_health(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            with self.subTest(module=module):
                created = self.client.post(f'/api/cases/{module}', intake_payload(module), format='json')
                self.assertEqual(created.status_code, 201, created.data)
                case = created.data['data']
                model.objects.filter(pk=case['id']).update(status='CASE_CLOSED')
                endpoint = f"/api/cases/{module}/{case['id']}"
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data['data']['status'], 'CASE_CLOSED')
                for route in (endpoint + '/step', f"/api/cases/{case['tracking_id']}/step?module={module}"):
                    rejected = self.client.patch(route, {'status': 'CASE_CLOSED', 'closureNotes': 'Repeat'}, format='json')
                    self.assertEqual(rejected.status_code, 400)
                    self.assertIn('status', rejected.data)
                    self.assertEqual(self.client.get('/api/health/').data['database'], 'connected')

    def test_all_workflow_states_remain_readable_with_independent_health(self):
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            created = self.client.post(f'/api/cases/{module}', intake_payload(module), format='json')
            self.assertEqual(created.status_code, 201, created.data)
            case = created.data['data']
            for state in CaseStatus.values:
                with self.subTest(module=module, state=state):
                    model.objects.filter(pk=case['id']).update(status=state)
                    for route in (f"/api/cases/{module}/{case['id']}", f"/api/cases/{case['tracking_id']}?module={module}"):
                        response = self.client.get(route)
                        self.assertEqual(response.status_code, 200, response.data)
                        self.assertEqual(response.data['data']['status'], state)
                    self.assertEqual(self.client.get('/api/health/').data['database'], 'connected')
