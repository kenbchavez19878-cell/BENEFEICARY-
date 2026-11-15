from pathlib import Path

from django.core import serializers
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from api.models import AicsCase, Beneficiary, CaseDocument, WomenAndSoloParentCase


class Command(BaseCommand):
    help = 'Back up and empty beneficiary/case tables, preserving accounts and media files.'

    def add_arguments(self, parser):
        parser.add_argument('--confirm-delete', action='store_true')
        parser.add_argument('--backup', required=True, help='New JSON backup file; existing files are never overwritten.')

    def handle(self, *args, **options):
        if not options['confirm_delete']:
            raise CommandError('Explicit --confirm-delete is required. This empties all beneficiary and case tables.')
        models = (Beneficiary, WomenAndSoloParentCase, AicsCase, CaseDocument)
        backup = Path(options['backup']).resolve()
        try:
            with transaction.atomic():
                if connection.vendor == 'postgresql':
                    tables = ', '.join(connection.ops.quote_name(model._meta.db_table) for model in models)
                    with connection.cursor() as cursor:
                        cursor.execute(f'LOCK TABLE {tables} IN EXCLUSIVE MODE')
                records = [record for model in models for record in model.objects.all()]
                with backup.open('x', encoding='utf-8') as output:
                    serializers.serialize('json', records, stream=output, indent=2)
                before = {model.__name__: model.objects.count() for model in models}
                WomenAndSoloParentCase.objects.all().delete()
                AicsCase.objects.all().delete()
                Beneficiary.objects.all().delete()
                if any(model.objects.exists() for model in models):
                    raise CommandError('Cleanup incomplete; database changes rolled back.')
        except OSError as error:
            raise CommandError(f'Backup failed; no records deleted: {error}') from error
        self.stdout.write(f'Backup: {backup}')
        self.stdout.write(f'Deleted records: {before}. Accounts and media files retained.')
