from .testing import api_test_client
from unittest.mock import patch

from django.db import DataError, IntegrityError, connection
from django.test import TestCase

from .models import AicsCase, WomenAndSoloParentCase
from .serializers import AicsCaseSerializer, WomenAndSoloParentCaseSerializer


class CaseBackendStabilityTests(TestCase):
    modules = (
        ('aics', AicsCase, AicsCaseSerializer),
        ('women-solo-parent', WomenAndSoloParentCase, WomenAndSoloParentCaseSerializer),
    )

    def case(self, model, **overrides):
        data = {
            'status': 'IN_ASSESSMENT',
            'workflow_data': {'_completed': {'assessment': 'saved'}, 'socialAssessment': {
                'intakeNotes': 'Interview', 'caseStudySummary': 'Assessment', 'assignedSocialWorker': 'Assigned Worker',
            }},
        }
        data.update(overrides)
        return model.objects.create(**data)

    def assert_healthy(self, client):
        health = client.get('/api/health/')
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.data['database'], 'connected')

    def test_bad_json_shapes_return_400_on_all_update_routes(self):
        client = api_test_client()
        for module, model, _ in self.modules:
            case = self.case(model)
            for route in (f'/api/cases/{module}/{case.pk}', f'/api/cases/{module}/{case.pk}/step', f'/api/cases/{case.tracking_id}/step?module={module}'):
                for body in ([], ['invalid'], 'invalid'):
                    with self.subTest(module=module, route=route, body=body):
                        response = client.patch(route, body, format='json')
                        self.assertEqual(response.status_code, 400, response.data)
                        self.assertIn('application/json', response['Content-Type'])
                        self.assert_healthy(client)

    def test_legacy_null_eligibility_section_accepts_all_four_cards(self):
        client = api_test_client()
        for module, model, _ in self.modules:
            case = self.case(model)
            workflow = case.workflow_data
            workflow['eligibilityDetails'] = None
            model.objects.filter(pk=case.pk).update(workflow_data=workflow)
            for choice in ('ELIGIBLE', 'NOT_ELIGIBLE', 'ADDITIONAL_REQUIREMENTS', 'FOR_REFERRAL'):
                response = client.patch(f'/api/cases/{module}/{case.pk}/step', {
                    'eligibility': choice, 'eligibilityDetails': {'notes': ''},
                }, format='json')
                self.assertEqual(response.status_code, 200, response.data)
                self.assert_healthy(client)

    def test_invalid_stored_json_is_reported_without_mutation(self):
        client = api_test_client()
        for module, model, _ in self.modules:
            case = self.case(model)
            for workflow in (['invalid'], {'eligibilityDetails': 'invalid'}, {'_completed': ['invalid']}, {'socialAssessment': 42}):
                model.objects.filter(pk=case.pk).update(workflow_data=workflow)
                response = client.patch(f'/api/cases/{module}/{case.pk}/step', {
                    'eligibility': 'ELIGIBLE', 'eligibilityDetails': {'notes': ''},
                }, format='json')
                self.assertEqual(response.status_code, 400, response.data)
                case.refresh_from_db()
                self.assertEqual(case.workflow_data, workflow)
                self.assertEqual(case.workflow_version, 0)
                self.assert_healthy(client)

    def test_closed_cases_reject_updates_and_amendment_flags_before_save(self):
        client = api_test_client()
        for module, model, serializer in self.modules:
            case = self.case(model, status='CASE_CLOSED', workflow_data={'eligibilityDetails': None})
            detail = f'/api/cases/{module}/{case.pk}'
            for method, route in (('patch', detail), ('put', detail), ('patch', detail + '/step'), ('post', detail + '/step'), ('patch', f'/api/cases/{case.tracking_id}/step?module={module}')):
                with self.subTest(module=module, method=method, route=route), patch.object(serializer, 'update') as update:
                    response = getattr(client, method)(route, {'eligibility': 'ELIGIBLE', 'amendment': True, 'reopen': True}, format='json')
                    self.assertEqual(response.status_code, 400, response.data)
                    self.assertIn('read-only', str(response.data['status']))
                    update.assert_not_called()
                    self.assert_healthy(client)
            self.assertEqual(client.delete(detail).status_code, 400)
            self.assertEqual(client.get(detail).status_code, 200)
            case.refresh_from_db()
            self.assertEqual(case.status, 'CASE_CLOSED')
            self.assertEqual(case.workflow_version, 0)

    def test_constraint_and_data_errors_roll_back_on_module_and_universal_routes(self):
        client = api_test_client()
        for module, model, serializer in self.modules:
            for generic in (False, True):
                for error_type in (IntegrityError, DataError):
                    case = self.case(model)
                    route = f'/api/cases/{case.tracking_id}/step?module={module}' if generic else f'/api/cases/{module}/{case.pk}/step'
                    original = serializer.update

                    def fail_after_save(instance_serializer, instance, data):
                        original(instance_serializer, instance, data)
                        raise error_type('Private SQL details')

                    with self.subTest(module=module, generic=generic, error=error_type.__name__), patch.object(serializer, 'update', fail_after_save):
                        response = client.patch(route, {'eligibility': 'ELIGIBLE', 'eligibilityDetails': {'notes': ''}}, format='json')
                    self.assertEqual(response.status_code, 400, response.data)
                    self.assertNotIn('Private', str(response.data))
                    case.refresh_from_db()
                    self.assertIsNone(case.eligibility)
                    self.assertEqual(case.workflow_version, 0)
                    self.assert_healthy(client)

    def test_real_database_constraint_failure_does_not_leave_connection_broken(self):
        client = api_test_client()
        for module, model, serializer in self.modules:
            case = self.case(model)
            other = self.case(model)
            original = serializer.update

            def violate_unique_constraint(instance_serializer, instance, data):
                original(instance_serializer, instance, data)
                model.objects.filter(pk=instance.pk).update(tracking_id=other.tracking_id)

            with patch.object(serializer, 'update', violate_unique_constraint):
                response = client.patch(f'/api/cases/{module}/{case.pk}/step', {
                    'eligibility': 'ELIGIBLE', 'eligibilityDetails': {'notes': ''},
                }, format='json')
            self.assertEqual(response.status_code, 400)
            case.refresh_from_db()
            self.assertIsNone(case.eligibility)
            self.assertEqual(case.workflow_version, 0)
            self.assertNotEqual(case.tracking_id, other.tracking_id)
            self.assertFalse(connection.needs_rollback)
            successful = client.patch(f'/api/cases/{module}/{case.pk}/step', {
                'eligibility': 'FOR_REFERRAL', 'eligibilityDetails': {'notes': ''},
            }, format='json')
            self.assertEqual(successful.status_code, 200, successful.data)
            self.assert_healthy(client)
