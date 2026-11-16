import json
import re

from django.db.models import Q
from django.db.models.functions import Trim
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission

MUNICIPAL = {'Staff', 'HeadAccount', 'Administrator'}
SECRETARIES = {'BarangaySecretary', 'BarangayRegistrar'}


def module_allowed(user, model):
    profile = account(user)
    if role(user) != 'Staff' or not profile or not profile.case_module.strip():
        return True
    module = re.sub(r'[^a-z0-9]', '', profile.case_module.casefold())
    expected = {'aics': 'AicsCase', 'womensoloparent': 'WomenAndSoloParentCase',
                'womenandsoloparent': 'WomenAndSoloParentCase'}.get(module)
    return model.__name__ == expected


def account(user):
    if not user or not user.is_authenticated or not user.is_active:
        return None
    try:
        return user.application_account
    except AttributeError:
        return None


def role(user):
    if not user or not user.is_authenticated or not user.is_active:
        return ''
    profile = account(user)
    if profile:
        key = re.sub(r'[^a-z0-9]', '', profile.role.casefold())
        roles = {re.sub(r'[^a-z0-9]', '', name.casefold()): name for name in MUNICIPAL | SECRETARIES | {'Beneficiary'}}
        roles.update({'mswdstaff': 'Staff', 'brgysec': 'BarangaySecretary'})
        return roles.get(key, '')
    return 'Administrator' if user and user.is_authenticated and user.is_superuser else 'Staff' if user and user.is_authenticated and user.is_staff else ''


def normalize_barangay(value):
    return re.sub(r'^(brgy\.?|barangay)\s+', '', str(value or '').strip(), flags=re.I).strip().casefold()


def assigned_intake_barangay(user):
    profile = account(user)
    return re.sub(r'^(brgy\.?|barangay)\s+', '', profile.barangay.strip(), flags=re.I).strip() if profile else ''


def scope_cases(queryset, user):
    if not module_allowed(user, queryset.model):
        return queryset.none()
    identity = role(user)
    if identity in MUNICIPAL:
        return queryset
    profile = account(user)
    if profile and identity in SECRETARIES and normalize_barangay(profile.barangay):
        barangay = normalize_barangay(profile.barangay)
        own = Q(submitted_by=user) if hasattr(queryset.model, 'submitted_by') else Q(pk__in=[])
        return queryset.annotate(_access_barangay=Trim('barangay_name')).filter(
            own |
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
    message = "Your authenticated account is not permitted to perform this workflow action."
    def has_permission(self, request, view):
        identity = role(request.user)
        if not identity:
            self.message = 'Please sign in with an active account before processing cases.'
            return False
        queryset = getattr(view, 'queryset', None)
        if queryset is not None and not module_allowed(request.user, queryset.model):
            self.message = 'This case is outside your assigned staff program.'
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        if identity in MUNICIPAL:
            return True
        if identity not in SECRETARIES:
            self.message = f'Your signed-in role is {identity}. MSWD Staff is required to process case reviews.'
            return False
        data = payload(request)
        creating = getattr(view, 'action', '') == 'create'
        forbidden = {
            'eligibility', 'eligibilityDetails', 'socialAssessment', 'intakeInterview', 'servicePlan', 'serviceRelease',
            'documents_status', 'monitoring_logs', 'correctionNotes', 'requiredDocumentReplacements', 'payout_officer_user', 'payout_officer_name',
            'release_method', 'releaseMethod', 'payout_date', 'payoutDate', 'guarantee_letter_number', 'guaranteeLetterNumber',
            'vulnerability_level',
            'assessment_notes', 'spic_number', 'spicNumber', 'booklet_number', 'purchaseBookletNumber', 'referrals',
        }
        if creating:
            # Initial notes belong to intake, not to a municipal assessment decision.
            blocked = {key: 'This field is reserved for MSWD processing after endorsement.'
                       for key in forbidden - {'assessment_notes'}
                       if key in data and data[key] not in (None, '', {}, [])}
            if data.get('status', 'BARANGAY_ENDORSED') != 'BARANGAY_ENDORSED':
                blocked['status'] = 'New intake records must start at BARANGAY_ENDORSED.'
            if blocked:
                raise ValidationError(blocked)
            return True
        if any(key in data for key in forbidden) or data.get('status', 'BARANGAY_ENDORSED') != 'BARANGAY_ENDORSED':
            self.message = f'This tab is signed in as {identity}. Sign in as MSWD Staff to acknowledge or process this case.'
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if not module_allowed(request.user, type(obj)):
            self.message = 'This case is outside your assigned staff program.'
            return False
        identity = role(request.user)
        if identity in MUNICIPAL:
            return True
        profile = account(request.user)
        if identity == 'Beneficiary':
            return request.method in ('GET', 'HEAD', 'OPTIONS') and bool(profile.beneficiary_tracking_id) and obj.tracking_id == profile.beneficiary_tracking_id
        owns_intake = getattr(obj, 'submitted_by_id', None) == request.user.pk
        if not profile or (not owns_intake and normalize_barangay(obj.barangay_name) != normalize_barangay(profile.barangay)):
            self.message = f'This case is not accessible to your signed-in role ({identity}). Sign in with the account assigned to review it.'
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.method != 'DELETE' and getattr(obj, 'status', 'BARANGAY_ENDORSED') in ('BARANGAY_ENDORSED', 'RETURNED_FOR_CORRECTION')


class DashboardAccess(BasePermission):
    def has_permission(self, request, view):
        return role(request.user) in MUNICIPAL | SECRETARIES
