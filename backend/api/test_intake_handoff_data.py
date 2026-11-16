import json
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .tests import intake_payload


class IntakeHandoffDataTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('sync_demo_accounts', stdout=StringIO())

    def client_for(self, username):
        client = APIClient()
        client.force_authenticate(get_user_model().objects.get(username=username))
        return client

    def test_full_saved_intake_survives_handoff_and_acknowledgement(self):
        secretary = self.client_for('barangaysecretary')
        for module, username in (('aics', 'staff_aics'), ('women-solo-parent', 'staff_women_solo')):
            staff = self.client_for(username)
            for multipart in (False, True):
                notes = f'Secretary narrative for {module}, multipart={multipart}'
                data = intake_payload(module, firstName='Maria Elena', middleName='Reyes', lastName='Santos', extensionName='Jr.',
                                      birthDate='1992-04-15', gender='FEMALE', civilStatus='COMMON_LAW', barangay='Punta Tarawal',
                                      contactNumber='09171234567', notes=notes)
                if module == 'aics':
                    data.update(crisisSummary='Hospital admission and medicine expenses.', serviceProvider='Bicol Medical Center',
                                incomeStatus='Seasonal work', requestedAmount=1000)
                else:
                    data.update(dependentChildren=3, soloParentReason='Abandonment', indigencyLevel='Low Income', financialAidAmount=1000)
                response = secretary.post(f'/api/cases/{module}', {'payload': json.dumps(data)} if multipart else data,
                                          format='multipart' if multipart else 'json')
                self.assertEqual(response.status_code, 201, response.data)
                saved = response.data['data']
                fields = ['first_name', 'middle_name', 'last_name', 'extension_name', 'birth_date', 'gender', 'civil_status',
                          'barangay_name', 'contact_number', 'intake_notes', 'documents']
                fields += (['income_status', 'crisis_summary', 'service_provider', 'aics_type', 'approved_amount'] if module == 'aics'
                           else ['category', 'dependent_children', 'solo_parent_reason', 'indigency_level', 'financial_aid_amount'])
                expected = {field: saved[field] for field in fields}
                self.assertEqual(saved['intake_notes'], notes)
                for acknowledged in (False, True):
                    if acknowledged:
                        changed = staff.patch(f'/api/cases/{module}/{saved["id"]}/step', {'status': 'UNDER_REVIEW'}, format='json')
                        self.assertEqual(changed.status_code, 200, changed.data)
                    for route in (f'/api/cases/{module}/{saved["id"]}', f'/api/cases/{saved["tracking_id"]}?module={module}'):
                        detail = staff.get(route)
                        self.assertEqual(detail.status_code, 200, detail.data)
                        self.assertEqual({field: detail.data['data'][field] for field in fields}, expected)
                    queue = staff.get(f'/api/cases/{module}')
                    listed = next(row for row in queue.data['data'] if row['id'] == saved['id'])
                    self.assertEqual({field: listed[field] for field in fields}, expected)
