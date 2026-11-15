from copy import deepcopy
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework import serializers
from .workflow_rules import ensure_case_open, validate_workflow, workflow_snapshot


NAME_FIELDS = ('first_name', 'middle_name', 'last_name', 'extension_name')
GENDERS = ('FEMALE', 'MALE', 'OTHER')
CIVIL_STATUSES = ('SINGLE', 'SINGLE_PARENT', 'MARRIED', 'WIDOWED', 'SEPARATED', 'ANNULLED', 'COMMON_LAW')


def code(value):
    return str(value or '').strip().upper().replace(' / ', '_').replace(' ', '_')


class CaseIntakeMixin:
    def get_correction_notes(self, obj):
        workflow = obj.workflow_data if isinstance(obj.workflow_data, dict) else {}
        notes = workflow.get('correctionNotes')
        if isinstance(notes, str) and notes.strip():
            return notes.strip()
        logs = obj.monitoring_logs if isinstance(obj.monitoring_logs, list) else []
        for log in reversed(logs):
            if isinstance(log, dict) and log.get('action') == 'RETURNED_FOR_CORRECTION' and isinstance(log.get('note'), str):
                return log['note'].strip()
        return ''

    def to_internal_value(self, data):
        ensure_case_open(self.instance)
        data = data.copy()
        plan = data.get('servicePlan')
        plan_fields = ({'approvedFinancialAmount': 'approved_amount'}
                      if self.Meta.model.__name__ == 'AicsCase' else {
                          'emergencyCashAidAmount': 'financial_aid_amount',
                          'spicNumber': 'spic_number',
                          'purchaseBookletNumber': 'booklet_number',
                          'referrals': 'referrals',
                      })
        if plan is not None:
            if not isinstance(plan, dict):
                raise serializers.ValidationError({'servicePlan': 'Expected an object.'})
            for nested, field in plan_fields.items():
                if nested in plan and field not in data:
                    data[field] = plan[nested]
        for field in ('gender', 'civil_status', 'civilStatus', 'category', 'aics_type', 'crisisType', 'release_method', 'eligibility'):
            if data.get(field):
                value = code(data[field])
                aliases = {
                    'MEDICAL_ASSISTANCE': 'MEDICAL', 'BURIAL_ASSISTANCE': 'BURIAL',
                    'ADDITIONAL_REQUIREMENTS_NEEDED': 'ADDITIONAL_REQUIREMENTS',
                    'CASH_PAYOUT': 'CASH', 'GUARANTEE_LETTER_GL': 'GUARANTEE_LETTER',
                }
                data[field] = aliases.get(value, value)
        result = super().to_internal_value(data)
        if isinstance(plan, dict):
            for nested, field in plan_fields.items():
                if nested not in plan or field not in result:
                    continue
                nested_value = plan[nested]
                if nested_value == '' and field in ('spic_number', 'booklet_number'):
                    nested_value = None
                raw = self.fields[field].run_validation(nested_value)
                if raw != result[field]:
                    raise serializers.ValidationError({field: 'Service plan and database field values must match.'})
        workflow = workflow_snapshot(self.instance)
        changed = False
        for field in ('intakeInterview', 'socialAssessment', 'eligibilityDetails', 'servicePlan', 'serviceRelease'):
            if field in data:
                if not isinstance(data[field], dict):
                    raise serializers.ValidationError({field: 'Expected an object.'})
                workflow[field] = {**workflow.get(field, {}), **data[field]}
                changed = True
        if 'closureNotes' in data:
            if not isinstance(data['closureNotes'], str):
                raise serializers.ValidationError({'closureNotes': 'Expected text.'})
            workflow['closureNotes'] = data['closureNotes'].strip()
            changed = True
        if 'correctionNotes' in data:
            if not isinstance(data['correctionNotes'], str):
                raise serializers.ValidationError({'correctionNotes': 'Expected text.'})
            if len(data['correctionNotes'].strip()) > 4000:
                raise serializers.ValidationError({'correctionNotes': 'Use 4000 characters or fewer.'})
            workflow['correctionNotes'] = data['correctionNotes'].strip()
            changed = True
        if changed:
            result['workflow_data'] = workflow
        result['_workflow_sections'] = {field for field in ('intakeInterview', 'socialAssessment', 'eligibilityDetails', 'servicePlan', 'serviceRelease', 'closureNotes', 'correctionNotes') if field in data}
        result['_expected_version'] = data.get('expected_version')
        return result

    def validate(self, attrs):
        attrs = super().validate(attrs)
        sections = attrs.pop('_workflow_sections', set())
        expected = attrs.pop('_expected_version', None)
        if expected is not None and (isinstance(expected, bool) or not isinstance(expected, int) or self.instance is None or expected != self.instance.workflow_version):
            raise serializers.ValidationError({'expected_version': 'Stale or invalid workflow version; reload the case.'})
        errors = {}
        is_new = self.instance is None
        def value(field):
            return attrs.get(field, getattr(self.instance, field, None))
        def require(field, message='This field is required.'):
            if value(field) is None or not str(value(field)).strip():
                errors[field] = message

        for field in NAME_FIELDS:
            if field in attrs:
                attrs[field] = (attrs[field] or '').strip()
        if is_new:
            attrs['intake_notes'] = attrs.get('assessment_notes') or ''
            for field in ('first_name', 'last_name', 'birth_date', 'gender', 'civil_status', 'barangay_name'):
                require(field)
            if self.Meta.model.__name__ == 'AicsCase':
                for field in ('aics_type', 'income_status', 'crisis_summary', 'approved_amount'):
                    require(field)
                amount = value('approved_amount')
                if amount is not None and not Decimal('500') <= amount <= Decimal('100000'):
                    errors['approved_amount'] = 'Requested assistance must be between 500 and 100000.'
            else:
                require('category')
                require('indigency_level')
                if value('category') == 'SOLO_PARENT':
                    require('solo_parent_reason')
                    if not 1 <= (value('dependent_children') or 0) <= 15:
                        errors['dependent_children'] = 'Enter between 1 and 15 dependent children.'
        for field in ('first_name', 'last_name'):
            if field in attrs and not attrs[field]:
                errors[field] = 'This field cannot be blank.'
        if 'gender' in attrs and attrs['gender'] not in GENDERS:
            errors['gender'] = 'Select Female, Male, or Other.'
        if 'civil_status' in attrs and attrs['civil_status'] not in CIVIL_STATUSES:
            errors['civil_status'] = 'Select a valid civil status.'
        if value('birth_date') and value('birth_date') > timezone.localdate(timezone=ZoneInfo('Asia/Manila')):
            errors['birth_date'] = 'Date of birth cannot be in the future.'
        if any(field in attrs for field in NAME_FIELDS) or (value('first_name') and value('last_name')):
            require('first_name')
            require('last_name')
            attrs['beneficiary_name'] = ' '.join(str(value(field) or '').strip() for field in NAME_FIELDS if value(field))
        if 'documents_status' in attrs:
            statuses = attrs['documents_status']
            if not isinstance(statuses, dict) or any(status not in ('Valid', 'Incomplete', 'Invalid') for status in statuses.values()):
                errors['documents_status'] = 'Use Valid, Incomplete, or Invalid for document decisions.'
        if 'monitoring_logs' in attrs:
            logs = attrs['monitoring_logs']
            text_fields = ('id', 'timestamp', 'date', 'author', 'title', 'description', 'type', 'action', 'note', 'performed_by')
            if not isinstance(logs, list) or any(
                not isinstance(item, dict) or any(key in item and not isinstance(item[key], str) for key in text_fields)
                for item in logs
            ):
                errors['monitoring_logs'] = 'Case history must be a list of objects with text fields.'

        workflow = attrs.get('workflow_data', workflow_snapshot(self.instance))
        assessment = workflow.get('socialAssessment', {})
        for field in ('intakeNotes', 'caseStudySummary', 'assignedSocialWorker', 'vulnerabilityNotes'):
            if field in assessment and not isinstance(assessment[field], str):
                errors['socialAssessment'] = 'Assessment fields must contain text.'
        if 'vulnerabilityLevel' in assessment and assessment['vulnerabilityLevel'] not in ('High', 'Moderate', 'Low'):
            errors['socialAssessment'] = 'Select a valid vulnerability level.'
        if 'socialAssessment' in workflow and 'workflow_data' in attrs:
            for field in ('intakeNotes', 'caseStudySummary', 'assignedSocialWorker'):
                if not str(assessment.get(field) or '').strip():
                    errors['socialAssessment'] = 'Intake notes, case study summary, and assigned social worker are required.'
        if errors:
            raise serializers.ValidationError(errors)
        workflow = deepcopy(workflow)
        validate_workflow(self.instance, attrs, workflow, sections, self.Meta.model.__name__ == 'AicsCase')
        return attrs
