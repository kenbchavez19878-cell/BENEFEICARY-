from pathlib import Path
import warnings
from zoneinfo import ZoneInfo
from PIL import Image, UnidentifiedImageError
from django.db import transaction
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .documents import DOCUMENT_TYPES, MAX_DOCUMENT_SIZE, DocumentStorageUnavailable, cleanup_uploads
from .models import AicsCase, PayoutProof
from .permissions import CaseAccess, MUNICIPAL, role
from .workflow_rules import ensure_case_open, workflow_snapshot


def approval_checkpoint(case):
    value = workflow_snapshot(case).get('_completed', {}).get('approval', '')
    if not isinstance(value, str):
        raise ValidationError({'workflow': 'The stored approval checkpoint needs an authorized review.'})
    return value


def available(proof):
    try:
        return bool(proof.file and proof.file.storage.exists(proof.file.name))
    except OSError:
        return False


def proof_data(proof):
    return {
        'id': proof.pk, 'proof_type': proof.proof_type, 'fileRef': proof.original_name, 'content_type': proof.content_type,
        'fileUrl': f'/api/payout-proofs/{proof.pk}/file', 'available': available(proof),
        'receipt_number': proof.receipt_number, 'received_by': proof.received_by,
        'amount': str(proof.amount), 'released_on': proof.released_on.isoformat(),
        'approval_checkpoint': proof.approval_checkpoint, 'notes': proof.notes,
        'verified_by_id': proof.verified_by_id, 'verified_by_name': proof.verified_by_name,
        'verified_at': proof.verified_at.isoformat(),
    }


def payout_history_event(proof):
    return {
        'id': f'payout-proof-{proof.pk}', 'timestamp': proof.verified_at.isoformat(),
        'action': 'PAYOUT_PROOF_VERIFIED', 'title': 'Payout proof verified', 'type': 'proof',
        'performed_by': proof.verified_by_name,
        'note': f'{proof.get_proof_type_display()} verified: {proof.original_name}; recipient: {proof.received_by}; amount: PHP {proof.amount}; payout date: {proof.released_on}; OR: {proof.receipt_number or "not applicable"}.' + (f' Notes: {proof.notes}' if proof.notes else ''),
        'proof_id': proof.pk, 'verified_by_id': proof.verified_by_id, 'received_by': proof.received_by,
        'amount': str(proof.amount), 'receipt_number': proof.receipt_number,
    }


def require_payout_proof(case, award, payout_date):
    for proof in case.payout_proofs.all():
        if proof.receipt_number.strip() and proof.amount == award and proof.released_on == payout_date and proof.approval_checkpoint == approval_checkpoint(case):
            try:
                if proof.file and proof.file.storage.exists(proof.file.name):
                    return
            except OSError:
                raise DocumentStorageUnavailable() from None
    raise ValidationError({'payout_proof': 'In Step 8, upload and verify an Official Receipt or payout photo with an OR number for the approved amount and payout date before closing financial assistance.'})


class PayoutProofInput(serializers.Serializer):
    file = serializers.FileField()
    proof_type = serializers.ChoiceField(choices=['OFFICIAL_RECEIPT', 'PAYOUT_PHOTO'])
    receipt_number = serializers.CharField(max_length=120)
    received_by = serializers.CharField(min_length=2, max_length=150)
    released_on = serializers.DateField()
    notes = serializers.CharField(max_length=2000, allow_blank=True, required=False, default='')
    confirmed_received = serializers.BooleanField()
    expected_version = serializers.IntegerField(min_value=0)

    def validate(self, attrs):
        if not attrs['confirmed_received']:
            raise ValidationError({'confirmed_received': 'Confirm that the named recipient received the assistance.'})
        if not any(character.isalpha() for character in attrs['received_by']):
            raise ValidationError({'received_by': 'Enter the beneficiary, parent, or authorized recipient name.'})
        if attrs['released_on'] > timezone.localdate(timezone=ZoneInfo('Asia/Manila')):
            raise ValidationError({'released_on': 'Payout proof cannot confirm a future payout date.'})
        file = attrs['file']
        if file.size > MAX_DOCUMENT_SIZE:
            raise ValidationError({'file': 'Payout proof must be 10 MB or smaller.'})
        suffix = Path(file.name).suffix.lower()
        file_type = DOCUMENT_TYPES.get(suffix)
        header = file.read(16)
        file.seek(0)
        if not file_type or not file_type[1](header):
            raise ValidationError({'file': 'Upload a PDF, JPG, or PNG file.'})
        if attrs['proof_type'] == 'PAYOUT_PHOTO' and suffix == '.pdf':
            raise ValidationError({'file': 'Payout photos must be JPG or PNG images.'})
        if suffix != '.pdf':
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter('error', Image.DecompressionBombWarning)
                    with Image.open(file) as image:
                        if image.format != ('PNG' if suffix == '.png' else 'JPEG'):
                            raise ValueError('Image format does not match its extension.')
                        image.verify()
                    file.seek(0)
                    with Image.open(file) as image:
                        image.load()
            except (UnidentifiedImageError, OSError, ValueError, SyntaxError,
                    Image.DecompressionBombError, Image.DecompressionBombWarning):
                raise ValidationError({'file': 'This image is damaged or cannot be safely displayed. Upload a valid JPG or PNG image.'}) from None
            finally:
                file.seek(0)
        return attrs


class PayoutProofUploadView(APIView):
    permission_classes = [CaseAccess]

    def post(self, request, lookup_value):
        if role(request.user) not in MUNICIPAL:
            raise PermissionDenied('Only authorized MSWD personnel can verify payout proof.')
        from .views import UniversalCaseDetailView
        stored = []
        try:
            with transaction.atomic():
                case, module, serializer_class = UniversalCaseDetailView().find_case(
                    lookup_value, request.data.get('moduleType'), lock=True, user=request.user)
                if case is None:
                    raise Http404('Case not found in your assigned program.')
                self.check_object_permissions(request, case)
                ensure_case_open(case)
                if case.status != 'RELEASED_COMPLETED':
                    raise ValidationError({'status': 'Payout proof is recorded in Step 8, after release details have been saved and before case closure.'})
                award = case.approved_amount if isinstance(case, AicsCase) else case.financial_aid_amount
                if award is None or not award.is_finite() or award <= 0 or workflow_snapshot(case).get('fulfillmentKind') in {'REFERRAL', 'DIRECT_SERVICE'}:
                    raise ValidationError({'amount': 'Nonfinancial cases do not require payout proof.'})
                serializer = PayoutProofInput(data=request.data)
                serializer.is_valid(raise_exception=True)
                data = serializer.validated_data
                if data['expected_version'] != case.workflow_version:
                    raise ValidationError({'expected_version': 'This case changed. Refresh the record before verifying payout proof.'})
                if case.status == 'RELEASED_COMPLETED' and case.payout_date is not None and data['released_on'] != case.payout_date:
                    raise ValidationError({'released_on': 'Use the recorded payout date for an already released case.'})
                if not isinstance(case.monitoring_logs or [], list):
                    raise ValidationError({'monitoring_logs': 'Stored case history must be a list.'})
                file = data['file']
                relation = {'aics_case': case} if isinstance(case, AicsCase) else {'women_case': case}
                proof = PayoutProof(**relation, proof_type=data['proof_type'], original_name=Path(file.name).name,
                                    content_type=DOCUMENT_TYPES[Path(file.name).suffix.lower()][0],
                                    receipt_number=data['receipt_number'], received_by=data['received_by'], amount=award,
                                    released_on=data['released_on'], approval_checkpoint=approval_checkpoint(case),
                                    notes=data['notes'], verified_by=request.user,
                                    verified_by_name=request.user.get_full_name() or request.user.get_username())
                proof.file.save(file.name, file, save=False)
                stored.append(proof.file)
                proof.save()
                logs = list(case.monitoring_logs or [])
                logs.append(payout_history_event(proof))
                case.monitoring_logs = logs
                case.payout_date = data['released_on']
                case.workflow_version += 1
                case.save(update_fields=['monitoring_logs', 'payout_date', 'workflow_version', 'updated_at'])
                case._prefetched_objects_cache = {}
                response = serializer_class(case, context={'request': request})
                return Response({'success': True, 'data': response.data, 'proof': proof_data(proof)},
                                status=status.HTTP_201_CREATED, headers={'Cache-Control': 'private, no-store'})
        except Exception as error:
            cleanup_uploads(stored)
            if isinstance(error, OSError):
                raise DocumentStorageUnavailable() from None
            raise


class PayoutProofFileView(APIView):
    permission_classes = [CaseAccess]

    def get(self, request, pk):
        proof = get_object_or_404(PayoutProof, pk=pk)
        self.check_object_permissions(request, proof.aics_case or proof.women_case)
        try:
            stream = proof.file.open('rb')
        except FileNotFoundError:
            raise Http404('Payout proof file is unavailable.')
        except OSError:
            raise DocumentStorageUnavailable() from None
        response = FileResponse(stream, content_type=proof.content_type, filename=proof.original_name)
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
