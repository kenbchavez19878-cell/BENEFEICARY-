from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import AicsCase, WomenAndSoloParentCase, ApplicationAccount
from .testing import api_test_client


class DashboardFilterTests(TestCase):
    def setUp(self):
        self.client = api_test_client()
        self.now = datetime(2026, 11, 17, 4, tzinfo=timezone.utc)
        self.start = datetime(2026, 11, 1, tzinfo=ZoneInfo('Asia/Manila'))
        self.women = WomenAndSoloParentCase.objects.create(first_name='Sarah', last_name='Applicant', category='SOLO_PARENT', barangay_name='San Vicente', created_at=self.start)
        self.vawc = WomenAndSoloParentCase.objects.create(first_name='Maria', last_name='Applicant', category='WOMEN_VAWC', barangay_name='Punta Tarawal', created_at=self.now)
        self.aics = AicsCase.objects.create(first_name='Juan', last_name='Applicant', aics_type='MEDICAL', barangay_name=' Brgy. San Vicente ', created_at=self.now)
        AicsCase.objects.create(first_name='Prior Month', last_name='Applicant', barangay_name='Punta Tarawal', created_at=self.start - timedelta(microseconds=1))
        AicsCase.objects.create(first_name='Prior Year', last_name='Applicant', barangay_name='San Vicente', created_at=datetime(2025, 6, 1, tzinfo=timezone.utc))

    def stats(self, **filters):
        with patch('api.views.django_timezone.now', return_value=self.now):
            response = self.client.get('/api/dashboard/stats', filters)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response['Cache-Control'], 'private, no-store')
        return response.data['data']

    def test_periods_use_philippine_registration_boundaries(self):
        self.assertEqual(self.stats()['totalBeneficiaries'], 5)
        month = self.stats(period='month')
        self.assertEqual(month['totalBeneficiaries'], 3)
        self.assertEqual(self.stats(period='year')['totalBeneficiaries'], 4)
        self.assertEqual(month['filters']['timezone'], 'Asia/Manila')
        self.assertEqual(month['filters']['dateBasis'], 'created_at')
        self.assertEqual(month['barangayDistribution'], [{'barangay': 'San Vicente', 'count': 2}, {'barangay': 'Punta Tarawal', 'count': 1}])
        self.assertEqual(self.client.get('/api/dashboard/stats', {'period': 'invalid'}).status_code, 400)

    def test_barangay_filters_every_metric_chart_and_matching_record(self):
        data = self.stats(period='month', barangay='barangay SAN VICENTE')
        self.assertEqual(data['totalBeneficiaries'], 2)
        self.assertEqual(data['activeCases'], 2)
        self.assertEqual(data['matchedRecords'], 2)
        self.assertEqual({row['id'] for row in data['filteredRecords']}, {self.women.case_number, self.aics.case_number})
        self.assertEqual(data['categoryBreakdown'][0]['value'], 1)
        self.assertEqual(data['categoryBreakdown'][1]['value'], 0)
        self.assertEqual(data['aicsBreakdown'][0]['value'], 1)
        self.assertEqual(len(data['barangayDistribution']), 2)
        empty = self.stats(period='month', barangay='Sabang')
        self.assertEqual(empty['totalBeneficiaries'], 0)
        self.assertEqual(empty['filteredRecords'], [])
        self.assertEqual(sum(row['value'] for row in empty['aicsBreakdown']), 0)

    def test_date_and_barangay_filters_never_bypass_program_or_barangay_scope(self):
        for username, role, program, barangay in (
            ('aics-filter-staff', 'Staff', 'aics', ''),
            ('women-filter-staff', 'Staff', 'women-solo-parent', ''),
            ('filter-secretary', 'BarangaySecretary', '', 'San Vicente'),
        ):
            user = get_user_model().objects.create_user(username=username)
            ApplicationAccount.objects.create(user=user, external_id=username, role=role, case_module=program, barangay=barangay)
            client = APIClient()
            client.force_authenticate(user)
            with patch('api.views.django_timezone.now', return_value=self.now):
                response = client.get('/api/dashboard/stats', {'period': 'month', 'barangay': 'Punta Tarawal'})
            self.assertEqual(response.status_code, 200, response.data)
            records = response.data['data']['filteredRecords']
            if program:
                self.assertTrue(all(record['module'] == program for record in records))
            else:
                self.assertEqual(records, [])
        self.assertEqual(APIClient().get('/api/dashboard/stats', {'period': 'month'}).status_code, 403)

    def test_legacy_record_without_registration_date_is_safe_in_drilldown(self):
        legacy = AicsCase.objects.create(first_name='Legacy', last_name='Applicant', barangay_name='Punta Tarawal')
        AicsCase.objects.filter(pk=legacy.pk).update(created_at=None)
        data = self.stats(barangay='Punta Tarawal')
        self.assertEqual(data['filteredRecords'][-1]['id'], legacy.case_number)
        self.assertNotIn(legacy.case_number, {row['id'] for row in self.stats(period='month', barangay='Punta Tarawal')['filteredRecords']})
