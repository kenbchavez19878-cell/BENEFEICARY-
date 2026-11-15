from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from .models import AicsCase, WomenAndSoloParentCase, CaseDocument
from .testing import api_test_client
from .barangays import CALABANGA_BARANGAYS


class DemoProfileSeedTests(TestCase):
    def test_seed_is_idempotent_preserves_edits_and_appears_in_staff_api(self):
        call_command('seed_mswd_demo_profiles', stdout=StringIO())
        case = AicsCase.objects.get(tracking_id='AICS-DEMO-MEDICAL-001')
        self.assertEqual((case.first_name, case.middle_name, case.last_name), ('Juancho', 'R.', 'Villaruel'))
        self.assertEqual(case.contact_number, '09175432190')
        self.assertEqual(case.workflow_data['demoProfile']['monthlyIncome'], 3500)
        AicsCase.objects.filter(pk=case.pk).update(assessment_notes='Staff edit')
        call_command('seed_mswd_demo_profiles', stdout=StringIO())
        case.refresh_from_db()
        self.assertEqual(case.assessment_notes, 'Staff edit')
        self.assertEqual(AicsCase.objects.count(), 2)
        self.assertEqual(WomenAndSoloParentCase.objects.count(), 2)
        self.assertTrue(all(row.barangay_name in CALABANGA_BARANGAYS for row in list(AicsCase.objects.all()) + list(WomenAndSoloParentCase.objects.all())))
        self.assertEqual(WomenAndSoloParentCase.objects.get(first_name='Sarah Jane').dependent_children, 2)
        self.assertEqual(WomenAndSoloParentCase.objects.get(first_name='Marites').civil_status, 'SINGLE_PARENT')
        self.assertFalse(CaseDocument.objects.exists())
        client = api_test_client()
        for module in ('aics', 'women-solo-parent'):
            response = client.get(f'/api/cases/{module}')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data['count'], 2)
            self.assertTrue(all(row['status'] == 'BARANGAY_ENDORSED' for row in response.data['data']))
