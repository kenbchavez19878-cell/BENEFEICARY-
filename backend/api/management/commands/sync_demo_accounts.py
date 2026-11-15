import json
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import ApplicationAccount


class Command(BaseCommand):
    help = 'Explicitly synchronize UI demo passwords without replacing existing accounts or roles.'

    @transaction.atomic
    def handle(self, *args, **options):
        definitions = json.loads((Path(__file__).resolve().parents[2] / 'demo_accounts.json').read_text())
        legacy = {
            'maria.lourdes': 'brgy-001', 'juan.ramos': 'staff-001',
            'maria.villanueva': 'head-001', 'rafael.mendoza': 'admin-001', 'maria.reyes': 'ben-001',
        }
        for username, external_id in legacy.items():
            if username not in {item['username'] for item in definitions}:
                get_user_model().objects.filter(username=username, application_account__external_id=external_id).update(is_active=False)
        for item in definitions:
            user, created = get_user_model().objects.get_or_create(username=item['username'], defaults={
                'first_name': item['name'], 'is_active': item['active'],
                'is_staff': item['role'] in ('Staff', 'HeadAccount', 'Administrator'),
            })
            profile, _ = ApplicationAccount.objects.get_or_create(user=user, defaults={
                'external_id': item['external_id'], 'role': item['role'],
                'barangay': item['barangay'], 'beneficiary_tracking_id': item['tracking_id'],
                'case_module': item.get('case_module', ''),
            })
            if (profile.external_id, profile.role, profile.barangay, profile.beneficiary_tracking_id) != (
                item['external_id'], item['role'], item['barangay'], item['tracking_id']
            ):
                raise CommandError(f"Account mapping differs for {item['username']}; no changes committed.")
            if profile.case_module != item.get('case_module', ''):
                profile.case_module = item.get('case_module', '')
                profile.save(update_fields=['case_module'])
            if not user.check_password(item['password']):
                user.set_password(item['password'])
                user.save(update_fields=['password'])
            self.stdout.write(f"Verified {item['username']}: {profile.role}, account ID {user.pk}")
