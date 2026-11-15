from .testing import api_test_client
from unittest.mock import patch

from django.db import IntegrityError, OperationalError
from django.test import TestCase

from .models import AicsCase, WomenAndSoloParentCase
from .serializers import WomenAndSoloParentCaseSerializer


class EligibilitySelectionTests(TestCase):
    choices = ('ELIGIBLE', 'NOT_ELIGIBLE', 'ADDITIONAL_REQUIREMENTS', 'FOR_REFERRAL')

    def case(self, model=WomenAndSoloParentCase, status='IN_ASSESSMENT'):
        return model.objects.create(status=status, workflow_data={
            '_completed': {'endorsementReviewed': 'saved', 'documentsVerified': 'saved', 'assessment': 'saved', 'intakeInterview': 'saved'},
            'socialAssessment': {'intakeNotes': 'Interview', 'caseStudySummary': 'Assessment', 'assignedSocialWorker': 'Assigned Worker'},
        })

    def test_all_four_cards_save_without_notes_in_both_modules_and_routes(self):
        client = api_test_client()
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            for generic in (False, True):
                case = self.case(model)
                route = f'/api/cases/{case.tracking_id}/step?module={module}' if generic else f'/api/cases/{module}/{case.pk}/step'
                for choice in self.choices:
                    with self.subTest(module=module, generic=generic, choice=choice):
                        response = client.patch(route, {
                            'eligibility': choice, 'eligibilityDetails': {'status': choice, 'notes': ''},
                            'expected_version': case.workflow_version,
                        }, format='json')
                        self.assertEqual(response.status_code, 200, response.data)
                        case.refresh_from_db()
                        self.assertEqual(case.eligibility, choice)
                        self.assertEqual(case.status, 'IN_ASSESSMENT')
                        self.assertNotIn('eligibility', case.workflow_data['_completed'])
                        self.assertEqual(client.get('/api/health/').data['database'], 'connected')

    def test_notes_required_for_confirmation_and_changed_choices_require_reconfirmation(self):
        client = api_test_client()
        case = self.case()
        route = f'/api/cases/women-solo-parent/{case.pk}/step'
        for choice in self.choices:
            selected = client.patch(route, {'eligibility': choice, 'eligibilityDetails': {'notes': ''}}, format='json')
            self.assertEqual(selected.status_code, 200, selected.data)
            rejected = client.patch(route, {'status': 'ELIGIBILITY_EVALUATED'}, format='json')
            self.assertEqual(rejected.status_code, 400)
            confirmed = client.patch(route, {'status': 'ELIGIBILITY_EVALUATED', 'eligibilityDetails': {'notes': 'Supported evaluation'}}, format='json')
            self.assertEqual(confirmed.status_code, 200, confirmed.data)
            case.refresh_from_db()
            self.assertIn('eligibility', case.workflow_data['_completed'])
        client.patch(route, {'eligibilityDetails': {'notes': 'Amended rationale'}}, format='json')
        rejected = client.patch(route, {'status': 'APPROVED_FOR_RELEASE', 'servicePlan': {'nonMonetarySupport': 'Referral'}, 'financial_aid_amount': 0}, format='json')
        self.assertEqual(rejected.status_code, 400)

    def test_invalid_enum_json_and_notes_return_json_400_and_health_stays_connected(self):
        client = api_test_client()
        case = self.case()
        route = f'/api/cases/women-solo-parent/{case.pk}/step'
        for data in ({'eligibility': 'INVALID'}, {'eligibilityDetails': []}, {'eligibilityDetails': {'notes': {'invalid': True}}}):
            response = client.patch(route, data, format='json')
            self.assertEqual(response.status_code, 400)
            self.assertIn('application/json', response['Content-Type'])
            self.assertEqual(client.get('/api/health/').data['database'], 'connected')

    def test_constraint_error_rolls_back_write_and_returns_json_400(self):
        client = api_test_client()
        case = self.case()
        original = WomenAndSoloParentCaseSerializer.update

        def fail_after_write(serializer, instance, data):
            original(serializer, instance, data)
            raise IntegrityError('Private database constraint details')

        with patch.object(WomenAndSoloParentCaseSerializer, 'update', fail_after_write):
            response = client.patch(f'/api/cases/women-solo-parent/{case.pk}/step', {
                'eligibility': 'ELIGIBLE', 'eligibilityDetails': {'notes': ''},
            }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertNotIn('Private', str(response.data))
        case.refresh_from_db()
        self.assertIsNone(case.eligibility)
        self.assertEqual(case.workflow_version, 0)
        self.assertEqual(client.get('/api/health/').data['database'], 'connected')

    def test_infrastructure_error_returns_json_503(self):
        client = api_test_client()
        case = self.case()
        with patch.object(WomenAndSoloParentCaseSerializer, 'update', side_effect=OperationalError('Private connection details')):
            response = client.patch(f'/api/cases/women-solo-parent/{case.pk}/step', {'eligibility': 'ELIGIBLE'}, format='json')
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('Private', str(response.data))
        self.assertEqual(client.get('/api/health/').data['database'], 'connected')
