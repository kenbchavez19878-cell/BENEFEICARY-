import json
import re

from django.db.models import Q
from django.db.models.functions import Trim
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission

MUNICIPAL = {'Staff', 'HeadAccount', 'Administrator'}
SECRETARIES = {'BarangaySecretary', 'BarangayRegistrar'}


def account(user):
    if not user or not user.is_authenticated:
        return None
    try:
        return user.application_account
    except AttributeError:
        return None


def role(user):
    profile = account(user)
    if profile:
        return profile.role
    return 'Administrator' if user and user.is_authenticated and user.is_superuser else 'Staff' if user and user.is_authenticated and user.is_staff else ''


def normalize_barangay(value):
    return re.sub(r'^(brgy\.?|barangay)\s+', '', str(value or '').strip(), flags=re.I).strip().casefold()


def scope_cases(queryset, user):
    identity = role(user)
    if identity in MUNICIPAL:
        return queryset
    profile = account(user)
    if profile and identity in SECRETARIES and normalize_barangay(profile.barangay):
        barangay = normalize_barangay(profile.barangay)
        return queryset.annotate(_access_barangay=Trim('barangay_name')).filter(
            Q(_access_barangay__iexact=barangay) | Q(_access_barangay__iexact=f'Brgy. {barangay}')
            | Q(_access_barangay__iexact=f'Brgy {barangay}') | Q(_access_barangay__iexact=f'Barangay {barangay}')
        )
    if profile and identity == 'Beneficiary' and profile.beneficiary_tracking_id:
        return queryset.filter(tracking_id=profile.beneficiary_tracking_id)
    return queryset.none()


def payload(request):
    data = request.data
    if not hasattr(data, 'get'):
        raise ValidationError({'payload': 'Expected an object.'})
    if 'payload' in data:
        try:
            data = json.loads(data['payload'])
        except (TypeError, ValueError):
            raise ValidationError({'payload': 'Invalid JSON.'})
        if not isinstance(data, dict):
            raise ValidationError({'payload': 'Expected an object.'})
    return data


class CaseAccess(BasePermission):
    def has_permission(self, request, view):
        identity = role(request.user)
        if not identity:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        if identity in MUNICIPAL:
            return True
        if identity not in SECRETARIES:
            return False
        data = payload(request)
        assigned = normalize_barangay(account(request.user).barangay)
        if not assigned:
            return False
        for field in ('barangay', 'barangay_name'):
            if field in data and normalize_barangay(data[field]) != assigned:
                return False
        forbidden = {
            'eligibility', 'eligibilityDetails', 'socialAssessment', 'intakeInterview', 'servicePlan', 'serviceRelease',
            'documents_status', 'monitoring_logs', 'correctionNotes', 'payout_officer_user', 'payout_officer_name',
            'release_method', 'releaseMethod', 'payout_date', 'payoutDate', 'guarantee_letter_number', 'guaranteeLetterNumber',
            'vulnerability_level',
            'assessment_notes', 'spic_number', 'spicNumber', 'booklet_number', 'purchaseBookletNumber', 'referrals',
        }
        if any(key in data for key in forbidden) or data.get('status', 'BARANGAY_ENDORSED') != 'BARANGAY_ENDORSED':
            return False
        if getattr(view, 'action', '') == 'create':
            return normalize_barangay(data.get('barangay_name', data.get('barangay'))) == normalize_barangay(account(request.user).barangay)
        return True

    def has_object_permission(self, request, view, obj):
        identity = role(request.user)
        if identity in MUNICIPAL:
            return True
        profile = account(request.user)
        if identity == 'Beneficiary':
            return request.method in ('GET', 'HEAD', 'OPTIONS') and bool(profile.beneficiary_tracking_id) and obj.tracking_id == profile.beneficiary_tracking_id
        if not profile or normalize_barangay(obj.barangay_name) != normalize_barangay(profile.barangay):
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.method != 'DELETE' and getattr(obj, 'status', 'BARANGAY_ENDORSED') in ('BARANGAY_ENDORSED', 'RETURNED_FOR_CORRECTION')


class DashboardAccess(BasePermission):
    def has_permission(self, request, view):
        return role(request.user) in MUNICIPAL | SECRETARIES
