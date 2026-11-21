"""Ordered case invariants shared by detail PATCH and all workflow endpoints."""
from decimal import Decimal, InvalidOperation
from copy import deepcopy
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.exceptions import ValidationError

EDGES = {
    'BARANGAY_ENDORSED': {'UNDER_REVIEW'},
    'UNDER_REVIEW': {'IN_ASSESSMENT', 'RETURNED_FOR_CORRECTION'},
    'RETURNED_FOR_CORRECTION': {'BARANGAY_ENDORSED'},
    'IN_ASSESSMENT': {'ELIGIBILITY_EVALUATED', 'RETURNED_FOR_CORRECTION'},
    'ELIGIBILITY_EVALUATED': {'APPROVED_FOR_RELEASE', 'RETURNED_FOR_CORRECTION', 'CASE_CLOSED'},
    'APPROVED_FOR_RELEASE': {'RELEASED_COMPLETED', 'RETURNED_FOR_CORRECTION'},
    'RELEASED_COMPLETED': {'CASE_CLOSED'},
    'CASE_CLOSED': set(),
}
NON_FINANCIAL = {'DIRECT_SERVICE', 'REFERRAL'}


def ensure_case_open(instance):
    if instance is not None and instance.status == 'CASE_CLOSED':
        raise ValidationError({'status': 'This case is completed/closed and read-only. Changes require a separately authorized amendment.'}, code='case_closed')


def workflow_snapshot(instance):
    raw = getattr(instance, 'workflow_data', None)
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ValidationError({'workflow': 'Stored workflow data must be an object. An authorized data repair is required.'})
    result = deepcopy(raw)
    for section in ('_completed', 'intakeInterview', 'socialAssessment', 'eligibilityDetails', 'servicePlan', 'serviceRelease'):
        if section not in result:
            continue
        if result[section] is None:
            result.pop(section)
        elif not isinstance(result[section], dict):
            raise ValidationError({'workflow': f'Stored {section} must be an object. An authorized data repair is required.'})
    return result


def text(value):
    return isinstance(value, str) and bool(value.strip())


def amount(value):
    try:
        result = Decimal(str(value))
        if not result.is_finite() or result < 0:
            raise ValueError
        return result
    except (ValueError, InvalidOperation, TypeError):
        raise ValidationError({'amount': 'Enter a finite, non-negative amount.'})


def fulfillment(plan, award, decision=None):
    if award > 0:
        return 'MONETARY'
    if decision == 'FOR_REFERRAL' and text(plan.get('nonMonetarySupport')):
        return 'REFERRAL'
    if isinstance(plan.get('referrals'), list) and any(text(item) for item in plan['referrals']):
        return 'REFERRAL'
    if text(plan.get('nonMonetarySupport')):
        return 'DIRECT_SERVICE'
    raise ValidationError({'servicePlan': 'A zero-amount plan must identify a direct service or referral.'})


def officer(release):
    name = release.get('payoutOfficer', '')
    identity = release.get('payoutOfficerId')
    user = None
    if identity is not None:
        if isinstance(identity, bool) or not isinstance(identity, int):
            raise ValidationError({'payoutOfficerId': 'Supply an active staff user ID.'})
        user = get_user_model().objects.filter(pk=identity, is_active=True, is_staff=True).first()
        if user is None:
            raise ValidationError({'payoutOfficerId': 'The accountable staff user is unavailable.'})
        official_name = user.get_full_name().strip() or user.get_username()
        if name and (not isinstance(name, str) or name.strip().casefold() != official_name.casefold()):
            raise ValidationError({'payoutOfficer': 'Officer name does not match the selected staff identity.'})
        name = official_name
    if not isinstance(name, str):
        raise ValidationError({'payoutOfficer': 'Enter an accountable officer name, not an object or number.'})
    name = ' '.join(name.split())
    if not 2 <= len(name) <= 150 or not any(c.isalpha() for c in name) or name.casefold() in {
        'n/a', 'na', 'none', 'null', 'unknown', 'tbd', 'officer', 'mswd staff', 'staff', 'test',
    } or any(ord(c) < 32 for c in name):
        raise ValidationError({'payoutOfficer': 'Enter the accountable officer\'s name (2–150 characters).'} )
    return name, user


def validate_workflow(instance, attrs, workflow, sections, is_aics):
    source = instance.status if instance else None
    target = attrs.get('status', source or 'BARANGAY_ENDORSED')
    if instance is None:
        if target != 'BARANGAY_ENDORSED':
            raise ValidationError({'status': 'Intake must start at BARANGAY_ENDORSED.'})
        if sections or attrs.get('eligibility') is not None or attrs.get('documents_status'):
            raise ValidationError({'workflow': 'Municipal decisions must be recorded after endorsement review.'})
        if any(attrs.get(field) for field in ('release_method', 'payout_date', 'guarantee_letter_number')):
            raise ValidationError({'serviceRelease': 'Release details cannot be supplied during intake.'})
        return
    if target not in EDGES:
        raise ValidationError({'status': 'Select a valid workflow state.'})
    ensure_case_open(instance)
    if source not in EDGES or (target != source and target not in EDGES[source]):
        raise ValidationError({'status': f'Transition {source} -> {target} is not permitted.'})
    old = workflow_snapshot(instance)
    prior = old.get('_completed', {})
    completed = dict(prior)
    stamp = timezone.now().isoformat()

    def require(checkpoint):
        if not prior.get(checkpoint) or completed.get(checkpoint) != prior[checkpoint]:
            raise ValidationError({'workflow': f'Complete and save {checkpoint} before advancing.'})

    def phase(section, permitted):
        if section in sections and source not in permitted:
            raise ValidationError({section: f'This activity cannot be edited in {source}.'})

    if 'serviceRelease' in sections and 'payoutOfficer' in workflow['serviceRelease'] and not isinstance(workflow['serviceRelease']['payoutOfficer'], str):
        raise ValidationError({'payoutOfficer': 'Officer name must be text.'})
    phase('intakeInterview', {'IN_ASSESSMENT'})
    phase('socialAssessment', {'IN_ASSESSMENT'})
    phase('eligibilityDetails', {'IN_ASSESSMENT', 'ELIGIBILITY_EVALUATED'})
    phase('servicePlan', {'ELIGIBILITY_EVALUATED'})
    phase('serviceRelease', {'APPROVED_FOR_RELEASE'})
    phase('requiredDocumentReplacements', {'UNDER_REVIEW', 'IN_ASSESSMENT', 'ELIGIBILITY_EVALUATED', 'APPROVED_FOR_RELEASE'})
    phase('correctionNotes', {'UNDER_REVIEW', 'IN_ASSESSMENT', 'ELIGIBILITY_EVALUATED', 'APPROVED_FOR_RELEASE'})
    for field in ('release_method', 'payout_date', 'guarantee_letter_number'):
        if field in attrs and attrs[field] != getattr(instance, field, None) and source != 'APPROVED_FOR_RELEASE':
            raise ValidationError({field: 'Release details can only be recorded after approval.'})
    if 'documents_status' in attrs and source != 'UNDER_REVIEW':
        raise ValidationError({'documents_status': 'Document decisions require UNDER_REVIEW.'})
    if 'eligibility' in attrs and source not in {'IN_ASSESSMENT', 'ELIGIBILITY_EVALUATED'}:
        raise ValidationError({'eligibility': 'Record eligibility after assessment and before approval.'})
    if 'intakeInterview' in sections:
        if not is_aics:
            raise ValidationError({'intakeInterview': 'AICS interview is a separate AICS activity.'})
        require('documentsVerified')
        interview = workflow['intakeInterview']
        if not all(text(interview.get(key)) for key in ('notes', 'interviewer')):
            raise ValidationError({'intakeInterview': 'Interview notes and interviewer are required.'})
        completed['intakeInterview'] = stamp
        if interview != old.get('intakeInterview'):
            completed.pop('assessment', None)
    if 'socialAssessment' in sections:
        require('documentsVerified')
        if is_aics:
            require('intakeInterview')
        assessment = workflow['socialAssessment']
        if not all(text(assessment.get(key)) for key in ('intakeNotes', 'caseStudySummary', 'assignedSocialWorker')):
            raise ValidationError({'socialAssessment': 'Complete the interview notes, assessment and assigned worker.'})
        completed['assessment'] = stamp
    if 'eligibilityDetails' in sections or 'eligibility' in attrs:
        require('assessment')
        details = workflow.get('eligibilityDetails', {})
        if 'notes' in details and not isinstance(details['notes'], str):
            raise ValidationError({'eligibilityDetails': 'Evaluation notes must contain text.'})
        if attrs.get('eligibility', instance.eligibility) != instance.eligibility or details != old.get('eligibilityDetails', {}):
            completed.pop('eligibility', None)

    if 'status' in attrs and target == 'ELIGIBILITY_EVALUATED':
        require('assessment')
        if attrs.get('eligibility', instance.eligibility) not in {'ELIGIBLE', 'NOT_ELIGIBLE', 'ADDITIONAL_REQUIREMENTS', 'FOR_REFERRAL'} or not text(workflow.get('eligibilityDetails', {}).get('notes')):
            raise ValidationError({'eligibility': 'Record a supported determination and rationale.'})
        completed['eligibility'] = stamp

    award_field = 'approved_amount' if is_aics else 'financial_aid_amount'
    award = amount(attrs.get(award_field, getattr(instance, award_field)))
    for field in (award_field, 'aics_type' if is_aics else 'category'):
        if field in attrs and attrs[field] != getattr(instance, field) and source not in {'ELIGIBILITY_EVALUATED', 'RETURNED_FOR_CORRECTION'}:
            raise ValidationError({field: 'Material award/category changes require a new planning decision.'})
    plan = workflow.get('servicePlan', {})
    decision = attrs.get('eligibility', instance.eligibility)

    if target != source:
        if target == 'BARANGAY_ENDORSED':
            completed = {}
            attrs['eligibility'] = None
        elif target == 'UNDER_REVIEW':
            completed = {'endorsementReviewed': stamp}
        elif target == 'RETURNED_FOR_CORRECTION':
            if 'requiredDocumentReplacements' not in sections:
                decisions = attrs.get('documents_status', instance.documents_status) or {}
                workflow['requiredDocumentReplacements'] = [key for key, decision in decisions.items() if decision == 'Invalid']
            if 'correctionNotes' not in sections or not text(workflow.get('correctionNotes')):
                raise ValidationError({'correctionNotes': 'Explain the specific corrections or missing requirements before returning this case.'})
            completed = {}
        elif target == 'IN_ASSESSMENT':
            require('endorsementReviewed')
            docs = list(instance.attachments.all())
            decisions = attrs.get('documents_status', instance.documents_status) or {}
            if not docs or any(decisions.get(doc.requirement_id) != 'Valid' for doc in docs):
                raise ValidationError({'documents_status': 'Review all attached documents before assessment.'})
            completed['documentsVerified'] = stamp
        elif target == 'APPROVED_FOR_RELEASE':
            require('eligibility')
            if decision == 'FOR_REFERRAL' and award > 0:
                raise ValidationError({award_field: 'For Referral requires a zero cash amount and a referral service. Choose Eligible in Step 4 to approve financial assistance.'})
            kind = fulfillment(plan, award, decision)
            if decision != 'ELIGIBLE' and not (decision == 'FOR_REFERRAL' and kind == 'REFERRAL'):
                raise ValidationError({'eligibility': 'This determination does not authorize the proposed service.'})
            if not plan:
                raise ValidationError({'servicePlan': 'Save the planned intervention.'})
            workflow['fulfillmentKind'] = kind
            completed['approval'] = stamp
        elif target == 'RELEASED_COMPLETED':
            for checkpoint in ('endorsementReviewed', 'documentsVerified', 'assessment', 'eligibility', 'approval'):
                require(checkpoint)
            if is_aics:
                require('intakeInterview')
            kind = old.get('fulfillmentKind')
            release = workflow.get('serviceRelease', {})
            name, user = officer(release)
            method = attrs.get('release_method', instance.release_method)
            if kind == 'MONETARY':
                if method not in {'CASH', 'CHECK', 'GUARANTEE_LETTER'} or award <= 0:
                    raise ValidationError({'release_method': 'Select a monetary method for the approved award.'})
            elif kind in NON_FINANCIAL:
                if method != kind or fulfillment(plan, award, decision) != kind:
                    raise ValidationError({'release_method': 'Use direct service/referral for the approved nonfinancial plan.'})
            else:
                raise ValidationError({'servicePlan': 'The case requires a recorded planning approval.'})
            if not attrs.get('payout_date', instance.payout_date):
                raise ValidationError({'payout_date': 'Record the release/service date.'})
            if 'approvedAmount' in release and amount(release['approvedAmount']) != award:
                raise ValidationError({'serviceRelease': 'Release amount must match the approved amount.'})
            if method == 'GUARANTEE_LETTER' and not text(release.get('guaranteeLetterNumber')):
                raise ValidationError({'serviceRelease': 'Record the guarantee letter number.'})
            release['payoutOfficer'] = name
            attrs['payout_officer_name'] = name
            attrs['payout_officer_user'] = user
            completed['release'] = stamp
        elif target == 'CASE_CLOSED':
            if source == 'ELIGIBILITY_EVALUATED' and decision == 'NOT_ELIGIBLE':
                require('eligibility')
            else:
                require('release')
                require('monitoring')
                if award > 0 and old.get('fulfillmentKind') not in NON_FINANCIAL:
                    from .payout_proofs import require_payout_proof
                    require_payout_proof(instance, award, instance.payout_date)
            if not text(workflow.get('closureNotes')):
                raise ValidationError({'closureNotes': 'Record the final outcome.'})
            completed['closure'] = stamp

    if 'monitoring_logs' in attrs and source == 'RELEASED_COMPLETED' and target == source:
        old_ids = {item.get('id') for item in (instance.monitoring_logs or []) if isinstance(item, dict) and isinstance(item.get('id'), str)}
        if any(item.get('id') not in old_ids and item.get('type') in {'visit', 'update', 'note'}
               and text(item.get('title')) and text(item.get('description')) for item in attrs['monitoring_logs']):
            completed['monitoring'] = stamp
    workflow['_completed'] = completed
    attrs['workflow_data'] = workflow
    attrs['workflow_version'] = instance.workflow_version + 1
