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

    def test_secretary_selected_barangay_is_saved_and_remains_accessible(self):
        from .models import AicsCase, WomenAndSoloParentCase
        secretary = self.client_for('barangaysecretary')
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            for multipart in (False, True):
                data = intake_payload(module, barangay='Punta Tarawal')
                response = secretary.post(f'/api/cases/{module}', {'payload': json.dumps(data)} if multipart else data,
                                          format='multipart' if multipart else 'json')
                self.assertEqual(response.status_code, 201, response.data)
                record = model.objects.get(pk=response.data['data']['id'])
                self.assertEqual(record.barangay_name, 'Punta Tarawal')
                self.assertEqual(record.submitted_by.username, 'barangaysecretary')
                queue = secretary.get(f'/api/cases/{module}', {'queue': 'secretary', 'barangay': 'San Vicente'})
                self.assertIn(record.pk, [row['id'] for row in queue.data['data']])
                detail = secretary.get(f'/api/cases/{record.tracking_id}')
                self.assertEqual(detail.status_code, 200, detail.data)
                changed = secretary.patch(f'/api/cases/{module}/{record.pk}/step', {'barangay': 'Quipayo'}, format='json')
                self.assertEqual(changed.status_code, 200, changed.data)
                record.refresh_from_db()
                self.assertEqual(record.barangay_name, 'Quipayo')
            other = model.objects.create(first_name='Other', last_name='Applicant', barangay_name='Punta Tarawal')
            self.assertEqual(secretary.get(f'/api/cases/{other.tracking_id}').status_code, 404)

    def test_new_intake_defaults_to_1000_and_preserves_explicit_amounts(self):
        from .testing import api_test_client
        client = api_test_client()
        for module, field, alias in (
            ('aics', 'approved_amount', 'requestedAmount'),
            ('women-solo-parent', 'financial_aid_amount', 'financialAidAmount'),
        ):
            for amount in (None, 3000):
                payload = intake_payload(module)
                payload.pop(alias, None)
                if amount is not None:
                    payload[alias] = amount
                created = client.post(f'/api/cases/{module}', payload, format='json')
                self.assertEqual(created.status_code, 201, created.data)
                record = created.data['data']
                expected = 1000 if amount is None else amount
                self.assertEqual(float(record[field]), expected)
                saved = client.patch(f'/api/cases/{module}/{record["id"]}', {'firstName': 'Updated'}, format='json')
                self.assertEqual(saved.status_code, 200, saved.data)
                self.assertEqual(float(saved.data.get('data', saved.data)[field]), expected)

    def test_default_does_not_replace_existing_zero_amount(self):
        from .models import AicsCase, WomenAndSoloParentCase
        from .testing import api_test_client
        client = api_test_client()
        for module, model, field in (
            ('aics', AicsCase, 'approved_amount'),
            ('women-solo-parent', WomenAndSoloParentCase, 'financial_aid_amount'),
        ):
            case = model.objects.create(first_name='Existing', last_name='Applicant', **{field: 0})
            response = client.patch(f'/api/cases/{module}/{case.pk}', {'firstName': 'Updated'}, format='json')
            self.assertEqual(response.status_code, 200, response.data)
            case.refresh_from_db()
            self.assertEqual(getattr(case, field), 0)
