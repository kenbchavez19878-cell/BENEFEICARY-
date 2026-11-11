import secrets
from decimal import Decimal
from django.db import models
from django.utils import timezone


def generate_unique_identifier(model_class, field_name: str, prefix: str, date_format: str = '%Y%m%d', digits: int = 4) -> str:
    """
    Generates a collision-resistant unique identifier formatted with a timestamp
    and a random numeric sequence. Example: GL-20261110-4821 or SPIC-2026-8392.
    """
    for _ in range(20):
        ts = timezone.now().strftime(date_format)
        rand_part = f"{secrets.randbelow(10**digits):0{digits}d}"
        code = f"{prefix}-{ts}-{rand_part}"
        if not model_class.objects.filter(**{field_name: code}).exists():
            return code
    # Safe epoch fallback if collision retry limit reached
    return f"{prefix}-{int(timezone.now().timestamp())}-{secrets.randbelow(1000):03d}"


class CaseStatus(models.TextChoices):
    BARANGAY_ENDORSED = 'BARANGAY_ENDORSED', 'Barangay Endorsed'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    RETURNED_FOR_CORRECTION = 'RETURNED_FOR_CORRECTION', 'Returned For Correction'
    IN_ASSESSMENT = 'IN_ASSESSMENT', 'In Assessment'
    ELIGIBILITY_EVALUATED = 'ELIGIBILITY_EVALUATED', 'Eligibility Evaluated'
    APPROVED_FOR_RELEASE = 'APPROVED_FOR_RELEASE', 'Approved For Release'
    RELEASED_COMPLETED = 'RELEASED_COMPLETED', 'Released / Completed'
    CASE_CLOSED = 'CASE_CLOSED', 'Case Closed'


class EligibilityStatus(models.TextChoices):
    ELIGIBLE = 'ELIGIBLE', 'Eligible'
    NOT_ELIGIBLE = 'NOT_ELIGIBLE', 'Not Eligible'
    ADDITIONAL_REQUIREMENTS = 'ADDITIONAL_REQUIREMENTS', 'Additional Requirements'
    FOR_REFERRAL = 'FOR_REFERRAL', 'For Referral'


class ReleaseMethod(models.TextChoices):
    CASH = 'CASH', 'Cash'
    CHECK = 'CHECK', 'Check'
    GUARANTEE_LETTER = 'GUARANTEE_LETTER', 'Guarantee Letter'


class WomenCategory(models.TextChoices):
    SOLO_PARENT = 'SOLO_PARENT', 'Solo Parent'
    WOMEN_VAWC = 'WOMEN_VAWC', 'Women in Difficult Circumstances / VAWC'


class VulnerabilityLevel(models.TextChoices):
    HIGH = 'HIGH', 'High'
    MODERATE = 'MODERATE', 'Moderate'
    LOW = 'LOW', 'Low'


class AicsType(models.TextChoices):
    MEDICAL = 'MEDICAL', 'Medical Assistance'
    BURIAL = 'BURIAL', 'Burial Assistance'
    TRANSPORTATION = 'TRANSPORTATION', 'Transportation Assistance'
    ECONOMIC_RELIEF = 'ECONOMIC_RELIEF', 'Economic Relief'
    BALIK_PROBINSYA = 'BALIK_PROBINSYA', 'Balik Probinsya'


class Beneficiary(models.Model):
    """
    Citizen/Beneficiary Master Profile for Calabanga MSWD.
    All non-essential fields are blank=True, null=True with safe defaults.
    """
    tracking_id = models.CharField(max_length=60, unique=True, db_index=True, blank=True, null=True)
    first_name = models.CharField(max_length=120, default='Resident', blank=True, null=True)
    last_name = models.CharField(max_length=120, default='Client', blank=True, null=True)
    contact_number = models.CharField(max_length=50, blank=True, null=True, default='')
    barangay_name = models.CharField(max_length=100, db_index=True, blank=True, null=True, default='Poblacion')
    civil_status = models.CharField(max_length=50, blank=True, null=True, default='SINGLE')
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True, null=True, default='FEMALE')
    indigency_level = models.CharField(max_length=50, blank=True, null=True, default='INDIGENT')
    address = models.TextField(blank=True, null=True, default='')
    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, blank=True, null=True)
    updated_at = models.DateTimeField(default=timezone.now, blank=True, null=True)

    class Meta:
        db_table = 'beneficiaries'
        ordering = ['-created_at']
        verbose_name = 'Beneficiary'
        verbose_name_plural = 'Beneficiaries'
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['barangay_name']),
        ]

    def save(self, *args, **kwargs):
        # 1. Auto-generate tracking_id if missing or blank (BEN-YYYY-XXXX)
        if not self.tracking_id or not str(self.tracking_id).strip():
            self.tracking_id = generate_unique_identifier(
                Beneficiary, 'tracking_id', 'BEN', '%Y', 4
            )
        else:
            self.tracking_id = str(self.tracking_id).strip().upper()

        # 2. Guarantee fallback defaults for required DB strings
        if not self.first_name or not str(self.first_name).strip():
            self.first_name = 'Resident'
        if not self.last_name or not str(self.last_name).strip():
            self.last_name = 'Client'
        if not self.barangay_name or not str(self.barangay_name).strip():
            self.barangay_name = 'Poblacion'

        # 3. Ensure timestamps are never null
        if not self.created_at:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.barangay_name})"


class WomenAndSoloParentCase(models.Model):
    """
    Case workflow for Women and Solo Parent assistance programs in Calabanga MSWD.
    Auto-generates missing case_number, tracking_id, spic_number, and booklet_number.
    """
    case_number = models.CharField(max_length=60, unique=True, db_index=True, blank=True, null=True)
    tracking_id = models.CharField(max_length=60, unique=True, db_index=True, blank=True, null=True)
    beneficiary_name = models.CharField(max_length=255, db_index=True, blank=True, null=True, default='Beneficiary Client')
    barangay_name = models.CharField(max_length=100, db_index=True, blank=True, null=True, default='Poblacion')
    category = models.CharField(
        max_length=50,
        choices=WomenCategory.choices,
        default=WomenCategory.SOLO_PARENT,
        db_index=True,
        blank=True,
        null=True
    )
    status = models.CharField(
        max_length=50,
        choices=CaseStatus.choices,
        default=CaseStatus.BARANGAY_ENDORSED,
        db_index=True,
        blank=True,
        null=True
    )
    eligibility = models.CharField(
        max_length=50,
        choices=EligibilityStatus.choices,
        blank=True,
        null=True,
        default=EligibilityStatus.ELIGIBLE
    )
    documents_status = models.JSONField(default=dict, blank=True, null=True)
    assessment_notes = models.TextField(blank=True, null=True, default='')
    vulnerability_level = models.CharField(
        max_length=20,
        choices=VulnerabilityLevel.choices,
        blank=True,
        null=True,
        default=VulnerabilityLevel.MODERATE
    )
    spic_number = models.CharField(max_length=60, blank=True, null=True, db_index=True)
    booklet_number = models.CharField(max_length=60, blank=True, null=True)
    financial_aid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=Decimal('3000.00')
    )
    referrals = models.JSONField(default=list, blank=True, null=True)
    release_method = models.CharField(
        max_length=50,
        choices=ReleaseMethod.choices,
        blank=True,
        null=True,
        default=ReleaseMethod.CASH
    )
    payout_date = models.DateField(null=True, blank=True)
    monitoring_logs = models.JSONField(default=list, blank=True, null=True)
    contact_number = models.CharField(max_length=50, blank=True, null=True, default='')
    civil_status = models.CharField(max_length=50, blank=True, null=True, default='Single Parent')
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True, null=True, default='Female')
    indigency_level = models.CharField(max_length=50, blank=True, null=True, default='Low Income / Indigent')
    dependent_children = models.IntegerField(default=0, blank=True, null=True)
    solo_parent_reason = models.CharField(max_length=255, blank=True, null=True, default='')
    created_at = models.DateTimeField(default=timezone.now, blank=True, null=True)
    updated_at = models.DateTimeField(default=timezone.now, blank=True, null=True)

    class Meta:
        db_table = 'women_and_solo_parent_cases'
        ordering = ['-created_at']
        verbose_name = 'Women & Solo Parent Case'
        verbose_name_plural = 'Women & Solo Parent Cases'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['barangay_name']),
            models.Index(fields=['beneficiary_name']),
        ]

    def save(self, *args, **kwargs):
        # 1. Auto-generate case_number if missing or empty string (WSP-YYYYMMDD-XXXX)
        if not self.case_number or not str(self.case_number).strip():
            self.case_number = generate_unique_identifier(
                WomenAndSoloParentCase, 'case_number', 'WSP', '%Y%m%d', 4
            )
        else:
            self.case_number = str(self.case_number).strip().upper()

        # 2. Sync tracking_id with case_number or auto-generate
        if not self.tracking_id or not str(self.tracking_id).strip():
            self.tracking_id = self.case_number
        else:
            self.tracking_id = str(self.tracking_id).strip().upper()

        # 3. Auto-generate SPIC number if missing or blank (SPIC-YYYY-XXXX)
        if not self.spic_number or not str(self.spic_number).strip():
            self.spic_number = generate_unique_identifier(
                WomenAndSoloParentCase, 'spic_number', 'SPIC', '%Y', 4
            )
        else:
            self.spic_number = str(self.spic_number).strip().upper()

        # 4. Auto-generate booklet_number if missing or blank (BK-YYYY-XXXX)
        if not self.booklet_number or not str(self.booklet_number).strip():
            self.booklet_number = generate_unique_identifier(
                WomenAndSoloParentCase, 'booklet_number', 'BK', '%Y', 4
            )
        else:
            self.booklet_number = str(self.booklet_number).strip().upper()

        # 5. Fallback defaults for required database text fields
        if not self.barangay_name or not str(self.barangay_name).strip():
            self.barangay_name = 'Poblacion'
        if not self.beneficiary_name or not str(self.beneficiary_name).strip():
            self.beneficiary_name = 'Beneficiary Client'

        # 6. Ensure timestamps are never null
        if not self.created_at:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()

        # 7. Initialize intake audit trail if empty
        if not self.monitoring_logs:
            self.monitoring_logs = [
                {
                    'id': f"tl-{int(timezone.now().timestamp() * 1000)}",
                    'timestamp': timezone.now().isoformat(),
                    'action': self.status or 'BARANGAY_ENDORSED',
                    'note': f"New Women/Solo Parent intake registered for {self.beneficiary_name}.",
                    'performed_by': 'MSWD Intake Officer',
                }
            ]

        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.case_number}] {self.beneficiary_name} - {self.get_category_display()} ({self.get_status_display()})"


class AicsCase(models.Model):
    """
    Case workflow for Assistance to Individuals in Crisis Situations (AICS).
    Auto-generates missing case_number, tracking_id, and guarantee_letter_number.
    """
    case_number = models.CharField(max_length=60, unique=True, db_index=True, blank=True, null=True)
    tracking_id = models.CharField(max_length=60, unique=True, db_index=True, blank=True, null=True)
    beneficiary_name = models.CharField(max_length=255, db_index=True, blank=True, null=True, default='Beneficiary Client')
    barangay_name = models.CharField(max_length=100, db_index=True, blank=True, null=True, default='Poblacion')
    contact_number = models.CharField(max_length=50, blank=True, null=True, default='')
    civil_status = models.CharField(max_length=50, blank=True, null=True, default='Resident Client')
    birth_date = models.DateField(null=True, blank=True)
    income_status = models.CharField(max_length=50, blank=True, null=True, default='Indigent / Crisis')
    aics_type = models.CharField(
        max_length=50,
        choices=AicsType.choices,
        default=AicsType.MEDICAL,
        db_index=True,
        blank=True,
        null=True
    )
    crisis_summary = models.TextField(blank=True, null=True, default='')
    service_provider = models.CharField(max_length=255, blank=True, null=True, default='')
    status = models.CharField(
        max_length=50,
        choices=CaseStatus.choices,
        default=CaseStatus.BARANGAY_ENDORSED,
        db_index=True,
        blank=True,
        null=True
    )
    eligibility = models.CharField(
        max_length=50,
        choices=EligibilityStatus.choices,
        blank=True,
        null=True,
        default=EligibilityStatus.ELIGIBLE
    )
    documents_status = models.JSONField(default=dict, blank=True, null=True)
    assessment_notes = models.TextField(blank=True, null=True, default='')
    approved_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=Decimal('5000.00')
    )
    release_method = models.CharField(
        max_length=50,
        choices=ReleaseMethod.choices,
        blank=True,
        null=True,
        default=ReleaseMethod.GUARANTEE_LETTER
    )
    guarantee_letter_number = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    payout_date = models.DateField(null=True, blank=True)
    monitoring_logs = models.JSONField(default=list, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, blank=True, null=True)
    updated_at = models.DateTimeField(default=timezone.now, blank=True, null=True)

    class Meta:
        db_table = 'aics_cases'
        ordering = ['-created_at']
        verbose_name = 'AICS Crisis Case'
        verbose_name_plural = 'AICS Crisis Cases'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['aics_type']),
            models.Index(fields=['barangay_name']),
            models.Index(fields=['beneficiary_name']),
        ]

    def save(self, *args, **kwargs):
        # 1. Auto-generate case_number if missing or empty string (AICS-YYYYMMDD-XXXX)
        if not self.case_number or not str(self.case_number).strip():
            self.case_number = generate_unique_identifier(
                AicsCase, 'case_number', 'AICS', '%Y%m%d', 4
            )
        else:
            self.case_number = str(self.case_number).strip().upper()

        # 2. Sync tracking_id with case_number or auto-generate
        if not self.tracking_id or not str(self.tracking_id).strip():
            self.tracking_id = self.case_number
        else:
            self.tracking_id = str(self.tracking_id).strip().upper()

        # 3. Auto-generate guarantee_letter_number if missing or blank (GL-YYYYMMDD-XXXX)
        if not self.guarantee_letter_number or not str(self.guarantee_letter_number).strip():
            self.guarantee_letter_number = generate_unique_identifier(
                AicsCase, 'guarantee_letter_number', 'GL', '%Y%m%d', 4
            )
        else:
            self.guarantee_letter_number = str(self.guarantee_letter_number).strip().upper()

        # 4. Fallback defaults for required database text fields
        if not self.barangay_name or not str(self.barangay_name).strip():
            self.barangay_name = 'Poblacion'
        if not self.beneficiary_name or not str(self.beneficiary_name).strip():
            self.beneficiary_name = 'Beneficiary Client'

        # 5. Ensure timestamps are never null
        if not self.created_at:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()

        # 6. Initialize intake audit trail if empty
        if not self.monitoring_logs:
            self.monitoring_logs = [
                {
                    'id': f"tl-{int(timezone.now().timestamp() * 1000)}",
                    'timestamp': timezone.now().isoformat(),
                    'action': self.status or 'BARANGAY_ENDORSED',
                    'note': f"New AICS intake registered for {self.beneficiary_name}.",
                    'performed_by': 'MSWD Intake Officer',
                }
            ]

        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.case_number}] {self.beneficiary_name} - {self.get_aics_type_display()} ({self.get_status_display()})"
