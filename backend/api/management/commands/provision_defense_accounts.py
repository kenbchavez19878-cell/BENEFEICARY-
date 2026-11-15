import json
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import ApplicationAccount


class Command(BaseCommand):
    help = 'Provision existing demo identities with the configured demo passwords, written only to a local file.'

    def add_arguments(self, parser):
        parser.add_argument('--credentials-file', required=True)

    def handle(self, *args, **options):
        target = Path(options['credentials_file']).resolve()
        if target.exists():
            raise CommandError('Credentials file already exists; refusing password rotation.')
        definitions = json.loads((Path(__file__).resolve().parents[2] / 'demo_accounts.json').read_text())
        credentials = []
        with transaction.atomic():
            for item in definitions:
                if get_user_model().objects.filter(username=item['username']).exists():
                    raise CommandError('An account already exists; use Django password administration to rotate it.')
                password = item['password']
                user = get_user_model().objects.create_user(username=item['username'], password=password, first_name=item['name'], is_active=item['active'], is_staff=item['role'] in ('Staff', 'HeadAccount', 'Administrator'))
                ApplicationAccount.objects.create(user=user, external_id=item['external_id'], role=item['role'], barangay=item['barangay'], beneficiary_tracking_id=item['tracking_id'], case_module=item.get('case_module', ''))
                credentials.append({'username': item['username'], 'role': item['role'], 'password': password})
            with target.open('x', encoding='utf-8') as output:
                json.dump(credentials, output, indent=2)
        self.stdout.write(f'Provisioned {len(credentials)} accounts. Demo credentials saved to {target}; no beneficiary cases were created.')
