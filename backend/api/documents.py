import json
import logging
from collections.abc import Mapping
from pathlib import Path

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import APIException

from .models import CaseDocument, AicsCase
from .workflow_rules import ensure_case_open


MAX_DOCUMENT_SIZE = 10 * 1024 * 1024
logger = logging.getLogger(__name__)


class DocumentStorageUnavailable(APIException):
    status_code = 503
    default_detail = 'Document storage is temporarily unavailable. Please retry or contact the administrator.'
    default_code = 'document_storage_unavailable'


def cleanup_uploads(files):
    for file in files:
        try:
            file.delete(save=False)
        except OSError:
            logger.error('Could not remove a failed document upload; storage needs administrator attention.')


DOCUMENT_TYPES = {
    '.pdf': ('application/pdf', lambda data: data.startswith(b'%PDF-')),
    '.png': ('image/png', lambda data: data.startswith(b'\x89PNG\r\n\x1a\n')),
    '.jpg': ('image/jpeg', lambda data: data.startswith(b'\xff\xd8\xff')),
    '.jpeg': ('image/jpeg', lambda data: data.startswith(b'\xff\xd8\xff')),
}


class UploadMetadataSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=80)
    name = serializers.CharField(max_length=255)


class CaseDocumentsMixin(serializers.Serializer):
    documents = serializers.SerializerMethodField()
    correction_notes = serializers.SerializerMethodField()
    uploaded_files = serializers.ListField(child=serializers.FileField(), write_only=True, required=False, max_length=20)
    document_metadata = UploadMetadataSerializer(many=True, write_only=True, required=False)

    def to_internal_value(self, data):
        ensure_case_open(self.instance)
        if not isinstance(data, Mapping):
            raise serializers.ValidationError({'payload': 'Expected a JSON object.'})
        if 'payload' in data:
            try:
                payload = json.loads(data['payload'])
            except (ValueError, TypeError):
                raise serializers.ValidationError({'payload': 'Invalid JSON payload.'})
            if not isinstance(payload, dict):
                raise serializers.ValidationError({'payload': 'Expected an object.'})
            payload['uploaded_files'] = data.getlist('uploaded_files') if hasattr(data, 'getlist') else data.get('uploaded_files', [])
            data = payload
        return super().to_internal_value(data)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        files = attrs.get('uploaded_files', [])
        metadata = attrs.get('document_metadata', [])
        if self.instance is not None and (files or metadata) and self.instance.status != 'RETURNED_FOR_CORRECTION':
            raise serializers.ValidationError({'uploaded_files': 'Document corrections are allowed only on returned cases.'})
        if len(files) != len(metadata) or len({item['id'] for item in metadata}) != len(metadata):
            raise serializers.ValidationError({'uploaded_files': 'Each file requires a unique requirement ID and name.'})
        for file in files:
            file_type = DOCUMENT_TYPES.get(Path(file.name).suffix.lower())
            header = file.read(16)
            file.seek(0)
            if not file_type or not file_type[1](header):
                raise serializers.ValidationError({'uploaded_files': 'Only PDF, JPEG, PNG and WebP documents are accepted.'})
            if file.size > MAX_DOCUMENT_SIZE:
                raise serializers.ValidationError({'uploaded_files': 'Each document must be 10 MB or smaller.'})
        if self.instance is not None and self.instance.status == 'RETURNED_FOR_CORRECTION':
            statuses = self.instance.documents_status or {}
            if not isinstance(statuses, dict):
                raise serializers.ValidationError({'documents_status': 'Stored document decisions must be an object.'})
            if attrs.get('status') == 'BARANGAY_ENDORSED':
                supplied = {item['id'] for item in metadata}
                rejected = [doc.name for doc in self.instance.attachments.all()
                            if statuses.get(doc.requirement_id) in ('Invalid', 'Incomplete') and doc.requirement_id not in supplied]
                if rejected:
                    raise serializers.ValidationError({'uploaded_files': 'Replace the rejected/incomplete documents before resubmitting: ' + ', '.join(rejected)})
            if files:
                attrs['documents_status'] = {key: value for key, value in statuses.items() if key not in {item['id'] for item in metadata}}
        return attrs

    def update(self, instance, validated_data):
        files = validated_data.pop('uploaded_files', [])
        metadata = validated_data.pop('document_metadata', [])
        stored = []
        try:
            with transaction.atomic():
                workflow = validated_data.get('workflow_data', {})
                target = validated_data.get('status', instance.status)
                if target != instance.status and (target == 'RETURNED_FOR_CORRECTION' or (instance.status == 'RETURNED_FOR_CORRECTION' and target == 'BARANGAY_ENDORSED')):
                    logs = validated_data.get('monitoring_logs', instance.monitoring_logs) or []
                    if not isinstance(logs, list):
                        raise serializers.ValidationError({'monitoring_logs': 'Case history must be a list.'})
                    logs = list(logs)
                    latest = logs[-1] if logs and isinstance(logs[-1], dict) else {}
                    if latest.get('action') != target:
                        request = self.context.get('request')
                        user = getattr(request, 'user', None)
                        logs.append({
                            'id': f'correction-{timezone.now().timestamp()}',
                            'timestamp': timezone.now().isoformat(),
                            'action': target,
                            'note': workflow.get('correctionNotes', '') if target == 'RETURNED_FOR_CORRECTION' else 'Barangay resubmitted corrected details and documents for MSWD review.',
                            'performed_by': str(user) if user is not None and user.is_authenticated else 'Case Reviewer',
                        })
                    validated_data['monitoring_logs'] = logs
                history = workflow.get('documentReplacements') or []
                if not isinstance(history, list):
                    raise serializers.ValidationError({'workflow': 'Stored document replacement history must be a list.'})
                history = list(history)
                for file, item in zip(files, metadata):
                    document = instance.attachments.filter(requirement_id=item['id']).first()
                    if document is not None:
                        history.append({'requirementId': item['id'], 'previousFile': document.file.name, 'previousName': document.original_name, 'replacedAt': timezone.now().isoformat()})
                    else:
                        relation = {'aics_case': instance} if isinstance(instance, AicsCase) else {'women_case': instance}
                        document = CaseDocument(**relation, requirement_id=item['id'])
                    document.name = item['name']
                    document.original_name = file.name
                    document.content_type = DOCUMENT_TYPES[Path(file.name).suffix.lower()][0]
                    document.uploaded_at = timezone.now()
                    document.file.save(file.name, file, save=False)
                    stored.append(document.file)
                    document.save()
                if files:
                    workflow['documentReplacements'] = history
                    validated_data['workflow_data'] = workflow
                case = super().update(instance, validated_data)
                if hasattr(case, '_prefetched_objects_cache'):
                    case._prefetched_objects_cache = {}
                return case
        except Exception as error:
            cleanup_uploads(stored)
            if isinstance(error, OSError):
                raise DocumentStorageUnavailable() from None
            raise

    def create(self, validated_data):
        files = validated_data.pop('uploaded_files', [])
        metadata = validated_data.pop('document_metadata', [])
        stored = []
        try:
            with transaction.atomic():
                case = super().create(validated_data)
                relation = {'aics_case': case} if isinstance(case, AicsCase) else {'women_case': case}
                for file, item in zip(files, metadata):
                    document = CaseDocument(
                        **relation, requirement_id=item['id'], name=item['name'],
                        original_name=file.name,
                        content_type=DOCUMENT_TYPES[Path(file.name).suffix.lower()][0],
                    )
                    document.file.save(file.name, file, save=False)
                    stored.append(document.file)
                    document.save()
                return case
        except Exception as error:
            cleanup_uploads(stored)
            if isinstance(error, OSError):
                raise DocumentStorageUnavailable() from None
            raise

    def get_documents(self, obj):
        statuses = obj.documents_status or {}
        return [
            {
                'id': doc.requirement_id,
                'name': doc.name,
                'fileRef': doc.original_name,
                'fileUrl': f'/api/documents/{doc.pk}/file',
                'status': statuses.get(doc.requirement_id, 'Incomplete'),
                'reviewed': doc.requirement_id in statuses,
            }
            for doc in obj.attachments.all()
        ]
