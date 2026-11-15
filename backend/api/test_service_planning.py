from .testing import api_test_client
from django.apps import apps
from django.test import TestCase

from .models import AicsCase, WomenAndSoloParentCase


class ServicePlanningTransitionTests(TestCase):
    def case(self, model, decision='ELIGIBLE'):
        award_field = 'approved_amount' if model is AicsCase else 'financial_aid_amount'
        return model.objects.create(
            status='ELIGIBILITY_EVALUATED', eligibility=decision,
            workflow_data={'_completed': {key: 'saved' for key in (
                'endorsementReviewed', 'documentsVerified', 'intakeInterview', 'assessment', 'eligibility',
            )}}, **{award_field: 3000},
        )

    def test_nested_plans_save_and_approve_on_both_routes_without_sms(self):
        client = api_test_client()
        for module, model in (('aics', AicsCase), ('women-solo-parent', WomenAndSoloParentCase)):
            for generic in (False, True):
                for decision, award in (('ELIGIBLE', 3000), ('ELIGIBLE', 0), ('FOR_REFERRAL', 0)):
                    with self.subTest(module=module, generic=generic, decision=decision, award=award):
                        case = self.case(model, decision)
                        plan = ({'approvedFinancialAmount': award} if model is AicsCase else {
                            'emergencyCashAidAmount': award, 'spicNumber': 'SPIC-PLAN',
                            'purchaseBookletNumber': 'BOOK-PLAN', 'referrals': ['Health referral'] if decision == 'FOR_REFERRAL' else [],
                        })
                        plan['nonMonetarySupport'] = 'Health referral' if decision == 'FOR_REFERRAL' else 'Direct service'
                        route = f'/api/cases/{case.tracking_id}/step?module={module}' if generic else f'/api/cases/{module}/{case.pk}/step'
                        response = client.patch(route, {'status': 'APPROVED_FOR_RELEASE', 'servicePlan': plan, 'expected_version': 0}, format='json')
                        self.assertEqual(response.status_code, 200, response.data)
                        case.refresh_from_db()
                        self.assertEqual(case.status, 'APPROVED_FOR_RELEASE')
                        self.assertEqual(case.workflow_version, 1)
                        self.assertEqual(getattr(case, 'approved_amount' if model is AicsCase else 'financial_aid_amount'), award)
                        self.assertIn('approval', case.workflow_data['_completed'])
                        self.assertEqual(response.data['data']['workflow_data']['servicePlan'], plan)
                        self.assertEqual(client.get('/api/health/').data['database'], 'connected')
        self.assertFalse(any(model.__name__ == 'SmsNotification' for model in apps.get_models()))

    def test_for_referral_cash_conflict_is_explicit_and_does_not_mutate_case(self):
        client = api_test_client()
        case = self.case(WomenAndSoloParentCase, 'FOR_REFERRAL')
        response = client.patch(f'/api/cases/women-solo-parent/{case.pk}/step', {
            'status': 'APPROVED_FOR_RELEASE',
            'servicePlan': {'emergencyCashAidAmount': 3000, 'referrals': ['Health referral']},
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('zero cash amount', str(response.data['financial_aid_amount']))
        case.refresh_from_db()
        self.assertEqual(case.status, 'ELIGIBILITY_EVALUATED')
        self.assertEqual(case.workflow_version, 0)

    def test_conflicting_plan_amounts_are_rejected(self):
        case = self.case(WomenAndSoloParentCase)
        response = api_test_client().patch(f'/api/cases/women-solo-parent/{case.pk}/step', {
            'status': 'APPROVED_FOR_RELEASE', 'financial_aid_amount': 1000,
            'servicePlan': {'emergencyCashAidAmount': 3000},
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('must match', str(response.data['financial_aid_amount']))
        case.refresh_from_db()
        self.assertEqual(case.workflow_version, 0)
