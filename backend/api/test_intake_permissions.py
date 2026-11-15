import json
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .tests import intake_payload


class InitialIntakePermissionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('sync_demo_accounts', stdout=StringIO())

    def client_for(self, username):
        client = APIClient()
        client.force_authenticate(get_user_model().objects.get(username=username))
        return client

    def test_secretary_json_and_multipart_initial_notes_and_default_barangay(self):
        client = self.client_for('barangaysecretary')
        for module in ('aics', 'women-solo-parent'):
            for multipart in (False, True):
                payload = intake_payload(module, assessment_notes='Secretary intake notes.')
                payload.pop('barangay')
                response = client.post(f'/api/cases/{module}', {'payload': json.dumps(payload)} if multipart else payload,
                                       format='multipart' if multipart else 'json')
                self.assertEqual(response.status_code, 201, response.data)
                self.assertEqual(response.data['data']['barangay_name'], 'San Vicente')
                self.assertEqual(response.data['data']['intake_notes'], 'Secretary intake notes.')
                self.assertEqual(response.data['data']['status'], 'BARANGAY_ENDORSED')

    def test_profile_registration_defaults_to_assigned_barangay(self):
        response = self.client_for('barangaysecretary').post('/api/beneficiaries', {'firstName': 'Test', 'lastName': 'Intake'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['data']['barangay_name'], 'San Vicente')

    def test_invalid_intake_status_is_field_validation_and_specialists_stay_scoped(self):
        secretary = self.client_for('barangaysecretary')
        for module, username, other in (('aics', 'staff_aics', 'staff_women_solo'), ('women-solo-parent', 'staff_women_solo', 'staff_aics')):
            payload = intake_payload(module, barangay='San Vicente')
            invalid = secretary.post(f'/api/cases/{module}', {**payload, 'status': 'UNDER_REVIEW'}, format='json')
            self.assertEqual(invalid.status_code, 400, invalid.data)
            self.assertIn('status', invalid.data)
            own = self.client_for(username).post(f'/api/cases/{module}', payload, format='json')
            self.assertEqual(own.status_code, 201, own.data)
            self.assertEqual(self.client_for(other).post(f'/api/cases/{module}', payload, format='json').status_code, 403)
