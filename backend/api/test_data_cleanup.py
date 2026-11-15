from .testing import api_test_client
import json
import tempfile
from io import StringIO
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.test import TestCase

from .models import AicsCase, Beneficiary, CaseDocument, WomenAndSoloParentCase


class BeneficiaryCleanupTests(TestCase):
    def test_cleanup_backs_up_records_and_preserves_accounts(self):
        user = get_user_model().objects.create_user(username='cleanup-staff')
        Beneficiary.objects.create(first_name='Demo', last_name='Profile')
        case = WomenAndSoloParentCase.objects.create(first_name='Demo', last_name='Case')
        AicsCase.objects.create(first_name='Demo', last_name='AICS')
        CaseDocument.objects.create(women_case=case, requirement_id='demo', name='Demo', original_name='demo.pdf', content_type='application/pdf', file='retained/demo.pdf')
        with tempfile.TemporaryDirectory() as directory:
            backup = Path(directory) / 'backup.json'
            call_command('clear_beneficiary_data', confirm_delete=True, backup=str(backup), stdout=StringIO())
            self.assertEqual(len(json.loads(backup.read_text())), 4)
        for model in (Beneficiary, WomenAndSoloParentCase, AicsCase, CaseDocument):
            self.assertFalse(model.objects.exists())
        self.assertTrue(get_user_model().objects.filter(pk=user.pk).exists())
        client = api_test_client()
        for endpoint in ('/api/beneficiaries', '/api/cases/women-solo-parent', '/api/cases/aics'):
            response = client.get(endpoint)
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data['data'], [])
        self.assertEqual(client.get('/api/health/').data['database'], 'connected')

    def test_no_deletion_without_confirmation_or_successful_backup(self):
        case = WomenAndSoloParentCase.objects.create(first_name='Retained', last_name='Case')
        with tempfile.TemporaryDirectory() as directory:
            backup = Path(directory) / 'existing.json'
            backup.write_text('keep this backup')
            with self.assertRaises(CommandError):
                call_command('clear_beneficiary_data', backup=str(backup))
            with self.assertRaises(CommandError):
                call_command('clear_beneficiary_data', confirm_delete=True, backup=str(backup))
            self.assertEqual(backup.read_text(), 'keep this backup')
        self.assertTrue(WomenAndSoloParentCase.objects.filter(pk=case.pk).exists())
