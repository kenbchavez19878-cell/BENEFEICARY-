from django.urls import re_path
from .views import (
    BeneficiaryViewSet,
    WomenAndSoloParentCaseViewSet,
    AicsCaseViewSet,
    UniversalCaseDetailView,
    UniversalCaseStepView,
    DashboardStatsView,
    HealthCheckView,
)

urlpatterns = [
    # System health check
    re_path(r'^health/?$', HealthCheckView.as_view(), name='api-health'),

    # Live dashboard metrics
    re_path(r'^dashboard/stats/?$', DashboardStatsView.as_view(), name='dashboard-stats'),

    # Women & Solo Parent Case Module Endpoints
    re_path(
        r'^cases/women-solo-parent/?$',
        WomenAndSoloParentCaseViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='women-solo-parent-list'
    ),
    re_path(
        r'^cases/women-solo-parent/(?P<pk>[^/]+)/step/?$',
        WomenAndSoloParentCaseViewSet.as_view({'patch': 'update_step', 'post': 'update_step'}),
        name='women-solo-parent-step'
    ),
    re_path(
        r'^cases/women-solo-parent/(?P<pk>[^/]+)/?$',
        WomenAndSoloParentCaseViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name='women-solo-parent-detail'
    ),

    # AICS Crisis Case Module Endpoints
    re_path(
        r'^cases/aics/?$',
        AicsCaseViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='aics-list'
    ),
    re_path(
        r'^cases/aics/(?P<pk>[^/]+)/step/?$',
        AicsCaseViewSet.as_view({'patch': 'update_step', 'post': 'update_step'}),
        name='aics-step'
    ),
    re_path(
        r'^cases/aics/(?P<pk>[^/]+)/?$',
        AicsCaseViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name='aics-detail'
    ),

    # Beneficiary Profiling Endpoints
    re_path(
        r'^beneficiaries/?$',
        BeneficiaryViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='beneficiary-list'
    ),
    re_path(
        r'^beneficiaries/(?P<pk>[^/]+)/?$',
        BeneficiaryViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name='beneficiary-detail'
    ),

    # Cross-module generic step update: PATCH /api/cases/<id_or_tracking>/step
    re_path(r'^cases/(?P<lookup_value>[^/]+)/step/?$', UniversalCaseStepView.as_view(), name='case-step-update'),

    # Cross-module generic case detail lookup: GET /api/cases/<id_or_tracking>
    re_path(r'^cases/(?P<lookup_value>[^/]+)/?$', UniversalCaseDetailView.as_view(), name='universal-case-detail'),
]
