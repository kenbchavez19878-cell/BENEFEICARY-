import json
from io import StringIO
from pathlib import Path

from django.contrib.auth import authenticate, get_user_model
from django.core.management import call_command
from django.test import TestCase

from .models import ApplicationAccount


class RequiredDemoAccountTests(TestCase):
    def test_sync_creates_exact_demo_set_and_preserves_other_accounts(self):
        legacy = get_user_model().objects.create_user(username='juan.ramos', password='old')
        ApplicationAccount.objects.create(user=legacy, external_id='staff-001', role='Staff')
        unrelated = get_user_model().objects.create_user(username='real.staff', is_staff=True)
        call_command('sync_demo_accounts', stdout=StringIO())
        call_command('sync_demo_accounts', stdout=StringIO())
        definitions = json.loads((Path(__file__).parent / 'demo_accounts.json').read_text())
        self.assertEqual({row['username'] for row in definitions}, {'staff_aics', 'staff_women_solo', 'barangaysecretary'})
        for row in definitions:
            user = authenticate(username=row['username'], password=row['password'])
            self.assertIsNotNone(user)
            self.assertEqual(user.application_account.role, row['role'])
            self.assertEqual(user.application_account.external_id, row['external_id'])
        legacy.refresh_from_db()
        unrelated.refresh_from_db()
        self.assertFalse(legacy.is_active)
        self.assertTrue(unrelated.is_active)
        self.assertEqual(get_user_model().objects.count(), 5)
