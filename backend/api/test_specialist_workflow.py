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
