import json
from pathlib import Path

from django.db import transaction
from rest_framework import serializers

from .models import CaseDocument, AicsCase


MAX_DOCUMENT_SIZE = 10 * 1024 * 1024
DOCUMENT_TYPES = {
    '.pdf': ('application/pdf', lambda data: data.startswith(b'%PDF-')),
    '.png': ('image/png', lambda data: data.startswith(b'\x89PNG\r\n\x1a\n')),
    '.jpg': ('image/jpeg', lambda data: data.startswith(b'\xff\xd8\xff')),
    '.jpeg': ('image/jpeg', lambda data: data.startswith(b'\xff\xd8\xff')),
    '.webp': ('image/webp', lambda data: data.startswith(b'RIFF') and data[8:12] == b'WEBP'),
}


class UploadMetadataSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=80)
    name = serializers.CharField(max_length=255)


class CaseDocumentsMixin(serializers.Serializer):
    documents = serializers.SerializerMethodField()
    uploaded_files = serializers.ListField(child=serializers.FileField(), write_only=True, required=False, max_length=20)
    document_metadata = UploadMetadataSerializer(many=True, write_only=True, required=False)

    def to_internal_value(self, data):
        if 'payload' in data:
            try:
                payload = json.loads(data['payload'])
            except (ValueError, TypeError):
                raise serializers.ValidationError({'payload': 'Invalid JSON payload.'})
            if not isinstance(payload, dict):
                raise serializers.ValidationError({'payload': 'Expected an object.'})
            payload['uploaded_files'] = data.getlist('uploaded_files')
            data = payload
        return super().to_internal_value(data)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        files = attrs.get('uploaded_files', [])
        metadata = attrs.get('document_metadata', [])
        if self.instance is not None and (files or metadata):
            raise serializers.ValidationError('Documents must be submitted with a new intake.')
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
        return attrs

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
        except Exception:
            for file in stored:
                file.delete(save=False)
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
            }
            for doc in obj.attachments.all().order_by('pk')
        ]
