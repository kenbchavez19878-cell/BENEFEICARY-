from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from .models import Beneficiary, WomenAndSoloParentCase, AicsCase
from .documents import CaseDocumentsMixin


CAMEL_TO_SNAKE_MAP = {
    'fullName': 'beneficiary_name',
    'barangay': 'barangay_name',
    'contactNumber': 'contact_number',
    'civilStatus': 'civil_status',
    'birthDate': 'birth_date',
    'payoutDate': 'payout_date',
    'indigencyLevel': 'indigency_level',
    'dependentChildren': 'dependent_children',
    'soloParentReason': 'solo_parent_reason',
    'financialAidAmount': 'financial_aid_amount',
    'approvedFinancialAmount': 'approved_amount',
    'requestedAmount': 'approved_amount',
    'crisisType': 'aics_type',
    'crisisSummary': 'crisis_summary',
    'serviceProvider': 'service_provider',
    'notes': 'assessment_notes',
    'spicNumber': 'spic_number',
    'purchaseBookletNumber': 'booklet_number',
    'guaranteeLetterNumber': 'guarantee_letter_number',
    'trackingId': 'tracking_id',
    'trackingNumber': 'tracking_id',
    'beneficiaryId': 'tracking_id',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
}


class CleanEmptyStringMixin:
    """
    Sanitizes form inputs from frontend React clients:
    1. Remaps camelCase form attributes to backend snake_case fields.
    2. Converts empty strings ("") to None for dates, numbers, and identifiers.
    3. Guarantees created_at defaults to timezone.now() if received null or blank.
    """
    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            clean_data = data.copy()
        elif isinstance(data, dict):
            clean_data = dict(data)
        else:
            return super().to_internal_value(data)

        # 1. Map camelCase frontend fields to backend model fields
        for camel_k, snake_k in CAMEL_TO_SNAKE_MAP.items():
            if camel_k in clean_data and snake_k not in clean_data:
                clean_data[snake_k] = clean_data.pop(camel_k)

        # 2. Sync tracking_id and case_number if one is supplied and the other is not
        if clean_data.get('tracking_id') and not clean_data.get('case_number'):
            clean_data['case_number'] = clean_data['tracking_id']
        elif clean_data.get('case_number') and not clean_data.get('tracking_id'):
            clean_data['tracking_id'] = clean_data['case_number']

        # 3. Ensure created_at / updated_at default to now if submitted as null or empty string
        if 'created_at' in clean_data and (clean_data['created_at'] is None or clean_data['created_at'] == ''):
            clean_data['created_at'] = timezone.now()
        if 'updated_at' in clean_data and (clean_data['updated_at'] is None or clean_data['updated_at'] == ''):
            clean_data['updated_at'] = timezone.now()

        # 4. Fields where empty strings "" must convert to None to prevent validation crashes
        fields_to_nullify = [
            'case_number',
            'tracking_id',
            'spic_number',
            'booklet_number',
            'guarantee_letter_number',
            'birth_date',
            'payout_date',
            'financial_aid_amount',
            'approved_amount',
            'dependent_children',
            'release_method',
            'eligibility',
            'vulnerability_level',
            'category',
            'aics_type',
            'status',
            'contact_number',
            'civil_status',
            'income_status',
            'service_provider',
            'crisis_summary',
            'solo_parent_reason',
        ]

        for field in fields_to_nullify:
            if field in clean_data and clean_data[field] == '':
                clean_data[field] = None

        return super().to_internal_value(clean_data)


class BeneficiarySerializer(CleanEmptyStringMixin, serializers.ModelSerializer):
    """
    Serializer for Beneficiary records with clean full name computation.
    """
    full_name = serializers.SerializerMethodField(read_only=True)
    tracking_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='Resident')
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='Client')
    contact_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    barangay_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='Poblacion')
    civil_status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    indigency_level = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)
    updated_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)

    class Meta:
        model = Beneficiary
        fields = [
            'id',
            'tracking_id',
            'first_name',
            'last_name',
            'full_name',
            'contact_number',
            'barangay_name',
            'civil_status',
            'birth_date',
            'gender',
            'indigency_level',
            'address',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id']

    def get_full_name(self, obj) -> str:
        return f"{obj.first_name} {obj.last_name}".strip()


class WomenAndSoloParentCaseSerializer(CaseDocumentsMixin, CleanEmptyStringMixin, serializers.ModelSerializer):
    """
    Serializer for Women & Solo Parent case records.
    Safely accepts partial form inputs and lets the model auto-generate unique identifiers.
    """
    case_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tracking_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    spic_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    booklet_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    beneficiary_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='Beneficiary Client')
    barangay_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='Poblacion')
    financial_aid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    dependent_children = serializers.IntegerField(required=False, allow_null=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    payout_date = serializers.DateField(required=False, allow_null=True)
    documents_status = serializers.JSONField(required=False, allow_null=True)
    referrals = serializers.JSONField(required=False, allow_null=True)
    monitoring_logs = serializers.JSONField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)
    updated_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)

    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    eligibility_display = serializers.CharField(source='get_eligibility_display', read_only=True)
    release_method_display = serializers.CharField(source='get_release_method_display', read_only=True)
    vulnerability_display = serializers.CharField(source='get_vulnerability_level_display', read_only=True)

    class Meta:
        model = WomenAndSoloParentCase
        fields = [
            'id',
            'case_number',
            'tracking_id',
            'beneficiary_name',
            'barangay_name',
            'category',
            'category_display',
            'status',
            'status_display',
            'eligibility',
            'eligibility_display',
            'documents_status',
            'documents',
            'uploaded_files',
            'document_metadata',
            'assessment_notes',
            'vulnerability_level',
            'vulnerability_display',
            'spic_number',
            'booklet_number',
            'financial_aid_amount',
            'referrals',
            'release_method',
            'release_method_display',
            'payout_date',
            'monitoring_logs',
            'contact_number',
            'civil_status',
            'birth_date',
            'gender',
            'indigency_level',
            'dependent_children',
            'solo_parent_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id']

    def validate_financial_aid_amount(self, value):
        if value is not None and value < Decimal('0.00'):
            raise serializers.ValidationError("Financial aid amount cannot be negative.")
        return value

    def validate_dependent_children(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Number of dependent children cannot be negative.")
        return value


class AicsCaseSerializer(CaseDocumentsMixin, CleanEmptyStringMixin, serializers.ModelSerializer):
    """
    Serializer for AICS Crisis cases.
    Safely accepts partial form inputs and lets the model auto-generate unique identifiers.
    """
    case_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tracking_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    guarantee_letter_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    beneficiary_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='Beneficiary Client')
    barangay_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='Poblacion')
    approved_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    payout_date = serializers.DateField(required=False, allow_null=True)
    documents_status = serializers.JSONField(required=False, allow_null=True)
    monitoring_logs = serializers.JSONField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)
    updated_at = serializers.DateTimeField(required=False, allow_null=True, default=timezone.now)

    aics_type_display = serializers.CharField(source='get_aics_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    eligibility_display = serializers.CharField(source='get_eligibility_display', read_only=True)
    release_method_display = serializers.CharField(source='get_release_method_display', read_only=True)

    class Meta:
        model = AicsCase
        fields = [
            'id',
            'case_number',
            'tracking_id',
            'beneficiary_name',
            'barangay_name',
            'contact_number',
            'civil_status',
            'birth_date',
            'income_status',
            'aics_type',
            'aics_type_display',
            'crisis_summary',
            'service_provider',
            'status',
            'status_display',
            'eligibility',
            'eligibility_display',
            'documents_status',
            'documents',
            'uploaded_files',
            'document_metadata',
            'assessment_notes',
            'approved_amount',
            'release_method',
            'release_method_display',
            'guarantee_letter_number',
            'payout_date',
            'monitoring_logs',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id']

    def validate_approved_amount(self, value):
        if value is not None and value < Decimal('0.00'):
            raise serializers.ValidationError("Approved amount cannot be negative.")
        return value
