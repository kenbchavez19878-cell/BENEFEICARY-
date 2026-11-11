from django.contrib import admin
from .models import Beneficiary, WomenAndSoloParentCase, AicsCase


@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_display = ('tracking_id', 'first_name', 'last_name', 'barangay_name', 'contact_number', 'is_active', 'created_at')
    list_filter = ('barangay_name', 'is_active', 'civil_status', 'indigency_level')
    search_fields = ('tracking_id', 'first_name', 'last_name', 'contact_number', 'barangay_name')
    ordering = ('-created_at',)


@admin.register(WomenAndSoloParentCase)
class WomenAndSoloParentCaseAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'tracking_id', 'beneficiary_name', 'category', 'barangay_name', 'status', 'financial_aid_amount', 'created_at')
    list_filter = ('category', 'status', 'eligibility', 'barangay_name', 'release_method')
    search_fields = ('case_number', 'tracking_id', 'beneficiary_name', 'barangay_name', 'spic_number', 'booklet_number')
    ordering = ('-created_at',)


@admin.register(AicsCase)
class AicsCaseAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'tracking_id', 'beneficiary_name', 'aics_type', 'barangay_name', 'status', 'approved_amount', 'created_at')
    list_filter = ('aics_type', 'status', 'eligibility', 'barangay_name', 'release_method')
    search_fields = ('case_number', 'tracking_id', 'beneficiary_name', 'barangay_name', 'guarantee_letter_number')
    ordering = ('-created_at',)
