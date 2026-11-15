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
        for item in definitions:
            user, created = get_user_model().objects.get_or_create(username=item['username'], defaults={
                'first_name': item['name'], 'is_active': item['active'],
                'is_staff': item['role'] in ('Staff', 'HeadAccount', 'Administrator'),
            })
            profile, _ = ApplicationAccount.objects.get_or_create(user=user, defaults={
                'external_id': item['external_id'], 'role': item['role'],
                'barangay': item['barangay'], 'beneficiary_tracking_id': item['tracking_id'],
            })
            if (profile.external_id, profile.role, profile.barangay, profile.beneficiary_tracking_id) != (
                item['external_id'], item['role'], item['barangay'], item['tracking_id']
            ):
                raise CommandError(f"Account mapping differs for {item['username']}; no changes committed.")
            if not user.check_password(item['password']):
                user.set_password(item['password'])
                user.save(update_fields=['password'])
            self.stdout.write(f"Verified {item['username']}: {profile.role}, account ID {user.pk}")
