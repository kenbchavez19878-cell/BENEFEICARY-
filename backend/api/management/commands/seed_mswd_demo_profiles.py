import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from api.models import AicsCase, WomenAndSoloParentCase
from api.serializers import AicsCaseSerializer, WomenAndSoloParentCaseSerializer
from api.barangays import CALABANGA_BARANGAYS


class Command(BaseCommand):
    help = 'Create four MSWD demonstration cases once, without overwriting existing cases or accounts.'

    def add_arguments(self, parser):
        parser.add_argument('--sync-locations', action='store_true', help='Synchronize locations only on untouched cases owned by this demo seed.')

    @transaction.atomic
    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute('SELECT pg_advisory_xact_lock(%s)', [88051116])
        profiles = json.loads((Path(__file__).resolve().parents[2] / 'data' / 'mswd_demo_profiles.json').read_text())
        for profile in profiles:
            if profile['barangay_name'] not in CALABANGA_BARANGAYS:
                raise CommandError('Demo profile contains a location outside the Calabanga catalog.')
            payload = dict(profile)
            module = payload.pop('module')
            monthly_income = payload.pop('monthly_income')
            support = payload.pop('support_request', '')
            model, serializer_class = (AicsCase, AicsCaseSerializer) if module == 'aics' else (WomenAndSoloParentCase, WomenAndSoloParentCaseSerializer)
            existing = model.objects.select_for_update().filter(tracking_id=payload['tracking_id']).first()
            if existing:
                metadata = existing.workflow_data if isinstance(existing.workflow_data, dict) else {}
                if options['sync_locations'] and metadata.get('demoProfile', {}).get('seed') == 'mswd-defense-v1' and existing.status == 'BARANGAY_ENDORSED' and existing.workflow_version == 0:
                    existing.barangay_name = payload['barangay_name']
                    existing.save(update_fields=['barangay_name'])
                self.stdout.write(f'Kept existing {existing.tracking_id}: {existing.beneficiary_name}')
                continue
            payload.update(status='BARANGAY_ENDORSED', release_method=None)
            if module != 'aics':
                payload['financial_aid_amount'] = '0.00'
            notes = f"Demonstration profile. Monthly income: PHP {monthly_income:,.2f}. {support or payload.get('crisis_summary', '')}"
            payload['assessment_notes'] = notes
            serializer = serializer_class(data=payload)
            serializer.is_valid(raise_exception=True)
            case = serializer.save()
            case.workflow_data = {**case.workflow_data, 'demoProfile': {
                'seed': 'mswd-defense-v1', 'monthlyIncome': monthly_income,
                'supportRequest': support or payload.get('crisis_summary', ''),
            }}
            case.save(update_fields=['workflow_data'])
            self.stdout.write(f'Created {case.tracking_id}: {case.beneficiary_name} ({case.barangay_name})')
        self.stdout.write(self.style.SUCCESS('Demo profiles ready. No accounts or existing workflows were modified.'))
