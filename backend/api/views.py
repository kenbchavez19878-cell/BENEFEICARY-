from datetime import datetime, timezone
from decimal import Decimal
from django.db.models import Q
from django.http import Http404
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Beneficiary,
    WomenAndSoloParentCase,
    AicsCase,
    CaseStatus,
    WomenCategory,
    AicsType,
)
from .serializers import (
    BeneficiarySerializer,
    WomenAndSoloParentCaseSerializer,
    AicsCaseSerializer,
)


class BeneficiaryViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet providing full CRUD operations for Beneficiary records.
    Supports lookup by ID or tracking_id.
    """
    queryset = Beneficiary.objects.all()
    serializer_class = BeneficiarySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tracking_id', 'first_name', 'last_name', 'contact_number', 'barangay_name']
    ordering_fields = ['created_at', 'last_name', 'barangay_name']
    ordering = ['-created_at']

    def get_object(self):
        lookup_val = self.kwargs[self.lookup_url_kwarg or self.lookup_field]
        queryset = self.filter_queryset(self.get_queryset())
        if str(lookup_val).isdigit():
            obj = queryset.filter(Q(pk=lookup_val) | Q(tracking_id=lookup_val)).first()
        else:
            obj = queryset.filter(tracking_id=lookup_val).first()

        if obj is None:
            raise Http404(f"Beneficiary '{lookup_val}' not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        queryset = super().get_queryset()
        barangay = self.request.query_params.get('barangay')
        is_active = self.request.query_params.get('is_active')

        if barangay and barangay.upper() != 'ALL':
            queryset = queryset.filter(barangay_name__icontains=barangay)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ('true', '1'))
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'count': len(serializer.data),
            'data': serializer.data,
            'results': serializer.data,
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Beneficiary profile registered successfully',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class WomenAndSoloParentCaseViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ModelViewSet for Women & Solo Parent cases.
    Dual-supports ID, case_number, and tracking_id lookups.
    """
    queryset = WomenAndSoloParentCase.objects.all()
    serializer_class = WomenAndSoloParentCaseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['case_number', 'tracking_id', 'beneficiary_name', 'barangay_name', 'spic_number', 'booklet_number']
    ordering_fields = ['created_at', 'id', 'financial_aid_amount', 'status']
    ordering = ['-created_at']

    def get_object(self):
        lookup_val = self.kwargs[self.lookup_url_kwarg or self.lookup_field]
        queryset = self.filter_queryset(self.get_queryset())
        if str(lookup_val).isdigit():
            obj = queryset.filter(Q(pk=lookup_val) | Q(case_number=lookup_val) | Q(tracking_id=lookup_val)).first()
        else:
            obj = queryset.filter(Q(case_number=lookup_val) | Q(tracking_id=lookup_val)).first()

        if obj is None:
            raise Http404(f"Women & Solo Parent case '{lookup_val}' not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        category_param = self.request.query_params.get('category')
        barangay_param = self.request.query_params.get('barangay')
        search_param = self.request.query_params.get('search')

        if status_param and status_param.upper() != 'ALL':
            queryset = queryset.filter(status=status_param.upper())
        if category_param and category_param.upper() != 'ALL':
            queryset = queryset.filter(category=category_param.upper())
        if barangay_param and barangay_param.upper() != 'ALL':
            queryset = queryset.filter(barangay_name__icontains=barangay_param)
        if search_param and search_param.strip():
            s = search_param.strip()
            queryset = queryset.filter(
                Q(beneficiary_name__icontains=s) |
                Q(case_number__icontains=s) |
                Q(tracking_id__icontains=s) |
                Q(barangay_name__icontains=s) |
                Q(spic_number__icontains=s)
            )
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'module': 'women-solo-parent',
            'count': len(serializer.data),
            'data': serializer.data,
            'results': serializer.data,
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Beneficiary profile registered successfully',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'module': 'women-solo-parent',
            'data': serializer.data,
            'audit_logs': instance.monitoring_logs or [],
        })

    @action(detail=True, methods=['patch', 'post'], url_path='step')
    def update_step(self, request, pk=None):
        instance = self.get_object()
        data = request.data.copy()

        action_note = data.pop('action_note', None) or data.get('assessment_notes')
        current_logs = list(instance.monitoring_logs or [])
        if action_note or 'status' in data:
            current_logs.append({
                'id': f"tl-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'action': data.get('status', instance.status),
                'note': action_note or f"Updated status to {data.get('status', instance.status)}",
                'performed_by': str(request.user if request.user.is_authenticated else 'MSWD Case Worker'),
            })
            data['monitoring_logs'] = current_logs

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'success': True,
            'message': 'Case step updated successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class AicsCaseViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ModelViewSet for AICS Crisis cases.
    Dual-supports ID, case_number, and tracking_id lookups.
    """
    queryset = AicsCase.objects.all()
    serializer_class = AicsCaseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['case_number', 'tracking_id', 'beneficiary_name', 'barangay_name', 'guarantee_letter_number', 'service_provider']
    ordering_fields = ['created_at', 'id', 'approved_amount', 'status']
    ordering = ['-created_at']

    def get_object(self):
        lookup_val = self.kwargs[self.lookup_url_kwarg or self.lookup_field]
        queryset = self.filter_queryset(self.get_queryset())
        if str(lookup_val).isdigit():
            obj = queryset.filter(Q(pk=lookup_val) | Q(case_number=lookup_val) | Q(tracking_id=lookup_val)).first()
        else:
            obj = queryset.filter(Q(case_number=lookup_val) | Q(tracking_id=lookup_val)).first()

        if obj is None:
            raise Http404(f"AICS case '{lookup_val}' not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        type_param = (
            self.request.query_params.get('aics_type')
            or self.request.query_params.get('category')
            or self.request.query_params.get('type')
        )
        barangay_param = self.request.query_params.get('barangay')
        search_param = self.request.query_params.get('search')

        if status_param and status_param.upper() != 'ALL':
            queryset = queryset.filter(status=status_param.upper())
        if type_param and type_param.upper() != 'ALL':
            queryset = queryset.filter(aics_type=type_param.upper())
        if barangay_param and barangay_param.upper() != 'ALL':
            queryset = queryset.filter(barangay_name__icontains=barangay_param)
        if search_param and search_param.strip():
            s = search_param.strip()
            queryset = queryset.filter(
                Q(beneficiary_name__icontains=s) |
                Q(case_number__icontains=s) |
                Q(tracking_id__icontains=s) |
                Q(barangay_name__icontains=s) |
                Q(guarantee_letter_number__icontains=s)
            )
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'module': 'aics',
            'count': len(serializer.data),
            'data': serializer.data,
            'results': serializer.data,
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'AICS crisis intake registered successfully',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'module': 'aics',
            'data': serializer.data,
            'audit_logs': instance.monitoring_logs or [],
        })

    @action(detail=True, methods=['patch', 'post'], url_path='step')
    def update_step(self, request, pk=None):
        instance = self.get_object()
        data = request.data.copy()

        action_note = data.pop('action_note', None) or data.get('assessment_notes')
        current_logs = list(instance.monitoring_logs or [])
        if action_note or 'status' in data:
            current_logs.append({
                'id': f"tl-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'action': data.get('status', instance.status),
                'note': action_note or f"Updated status to {data.get('status', instance.status)}",
                'performed_by': str(request.user if request.user.is_authenticated else 'MSWD Case Worker'),
            })
            data['monitoring_logs'] = current_logs

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'success': True,
            'message': 'AICS case step updated successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class UniversalCaseDetailView(APIView):
    """
    Direct endpoint for frontend:
    GET /api/cases/<id_or_case_number>
    PATCH /api/cases/<id_or_case_number>
    """
    def find_case(self, lookup_val, module_hint=None):
        is_num = str(lookup_val).isdigit()

        # Check Women & Solo Parent first if requested or not specified
        if module_hint in ('women-solo-parent', 'solo-parent', 'women-vawc') or not module_hint:
            q = Q(pk=lookup_val) if is_num else Q(case_number=lookup_val) | Q(tracking_id=lookup_val)
            wsp = WomenAndSoloParentCase.objects.filter(q).first()
            if wsp:
                return wsp, 'women-solo-parent', WomenAndSoloParentCaseSerializer

        # Check AICS
        if module_hint == 'aics' or not module_hint:
            q = Q(pk=lookup_val) if is_num else Q(case_number=lookup_val) | Q(tracking_id=lookup_val)
            aics = AicsCase.objects.filter(q).first()
            if aics:
                return aics, 'aics', AicsCaseSerializer

        # Last attempt on remaining module
        q = Q(pk=lookup_val) if is_num else Q(case_number=lookup_val) | Q(tracking_id=lookup_val)
        wsp = WomenAndSoloParentCase.objects.filter(q).first()
        if wsp:
            return wsp, 'women-solo-parent', WomenAndSoloParentCaseSerializer

        return None, None, None

    def get(self, request, lookup_value, format=None):
        module_hint = request.query_params.get('module')
        instance, mod_name, ser_class = self.find_case(lookup_value, module_hint)
        if not instance:
            return Response({
                'success': False,
                'error': f"Case '{lookup_value}' not found."
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = ser_class(instance)
        return Response({
            'success': True,
            'module': mod_name,
            'data': serializer.data,
            'audit_logs': instance.monitoring_logs or [],
        })


class UniversalCaseStepView(APIView):
    """
    Direct endpoint for frontend:
    PATCH /api/cases/<id_or_case_number>/step
    """
    def patch(self, request, lookup_value, format=None):
        view = UniversalCaseDetailView()
        instance, mod_name, ser_class = view.find_case(lookup_value, request.query_params.get('module'))
        if not instance:
            return Response({
                'success': False,
                'error': f"Case '{lookup_value}' not found for step update."
            }, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        action_note = data.pop('action_note', None) or data.get('assessment_notes')
        current_logs = list(instance.monitoring_logs or [])
        if action_note or 'status' in data:
            current_logs.append({
                'id': f"tl-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'action': data.get('status', instance.status),
                'note': action_note or f"Updated status to {data.get('status', instance.status)}",
                'performed_by': str(request.user if request.user.is_authenticated else 'MSWD Case Worker'),
            })
            data['monitoring_logs'] = current_logs

        serializer = ser_class(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'success': True,
            'message': 'Case step data updated successfully',
            'data': serializer.data,
        }, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    """
    Live aggregated MSWD dashboard statistics:
    GET /api/dashboard/stats/
    """
    def get(self, request, format=None):
        women_cases = list(WomenAndSoloParentCase.objects.all())
        aics_cases = list(AicsCase.objects.all())
        all_cases = women_cases + aics_cases

        total_beneficiaries = len(all_cases)

        active_statuses = [
            CaseStatus.BARANGAY_ENDORSED,
            CaseStatus.UNDER_REVIEW,
            CaseStatus.IN_ASSESSMENT,
        ]
        active_cases = sum(1 for c in all_cases if c.status in active_statuses)

        released_statuses = [
            CaseStatus.APPROVED_FOR_RELEASE,
            CaseStatus.RELEASED_COMPLETED,
            CaseStatus.CASE_CLOSED,
        ]
        approved_released_cases = sum(1 for c in all_cases if c.status in released_statuses)

        total_disbursed = Decimal('0.00')
        for c in women_cases:
            if c.status in [CaseStatus.RELEASED_COMPLETED, CaseStatus.CASE_CLOSED] and c.financial_aid_amount:
                total_disbursed += c.financial_aid_amount
        for c in aics_cases:
            if c.status in [CaseStatus.RELEASED_COMPLETED, CaseStatus.CASE_CLOSED] and c.approved_amount:
                total_disbursed += c.approved_amount

        # Category Breakdown
        solo_parent_count = sum(1 for c in women_cases if c.category == WomenCategory.SOLO_PARENT)
        women_vawc_count = sum(1 for c in women_cases if c.category == WomenCategory.WOMEN_VAWC)

        aics_counts = {t.value: 0 for t in AicsType}
        for c in aics_cases:
            if c.aics_type in aics_counts:
                aics_counts[c.aics_type] += 1
            else:
                aics_counts['MEDICAL'] += 1

        # Barangay Distribution
        brgy_counts = {}
        for c in all_cases:
            b = c.barangay_name or 'Poblacion'
            brgy_counts[b] = brgy_counts.get(b, 0) + 1
        barangay_distribution = [
            {'barangay': b, 'count': cnt}
            for b, cnt in sorted(brgy_counts.items(), key=lambda item: item[1], reverse=True)
        ]

        # Recent Activities Feed
        recent_activities = []
        for c in all_cases:
            is_women = hasattr(c, 'category')
            prog_name = (
                'Solo Parent Assistance' if (is_women and c.category == WomenCategory.SOLO_PARENT)
                else 'Women VAWC Protection' if is_women
                else f"AICS ({c.get_aics_type_display() if hasattr(c, 'get_aics_type_display') else 'Crisis'})"
            )
            logs = c.monitoring_logs if isinstance(c.monitoring_logs, list) else []
            for log in logs:
                if isinstance(log, dict):
                    recent_activities.append({
                        'id': log.get('id') or f"act-{secrets.randbelow(100000)}",
                        'clientName': c.beneficiary_name,
                        'clientId': c.case_number or c.tracking_id,
                        'program': prog_name,
                        'barangay': c.barangay_name,
                        'date': log.get('timestamp', '')[:10] if log.get('timestamp') else 'Recent',
                        'time': '',
                        'title': log.get('action') or 'Case Activity',
                        'description': log.get('note') or '',
                        'status': c.status,
                        'statusLabel': c.get_status_display() if hasattr(c, 'get_status_display') else c.status,
                        'author': log.get('performed_by') or 'MSWD Officer',
                        'timestamp': log.get('timestamp') or (c.created_at.isoformat() if c.created_at else ''),
                    })

        recent_activities.sort(key=lambda a: a.get('timestamp') or '', reverse=True)
        capped_activities = recent_activities[:10]

        return Response({
            'success': True,
            'data': {
                'totalBeneficiaries': total_beneficiaries,
                'activeCases': active_cases,
                'approvedReleasedCases': approved_released_cases,
                'totalDisbursed': float(total_disbursed),
                'categoryBreakdown': [
                    {'name': 'Solo Parent', 'value': solo_parent_count, 'color': '#10b981'},
                    {'name': 'Women / VAWC', 'value': women_vawc_count, 'color': '#a855f7'},
                    {'name': 'AICS Medical', 'value': aics_counts.get('MEDICAL', 0), 'color': '#3b82f6'},
                    {'name': 'AICS Burial', 'value': aics_counts.get('BURIAL', 0), 'color': '#f97316'},
                    {'name': 'AICS Other', 'value': aics_counts.get('TRANSPORTATION', 0) + aics_counts.get('ECONOMIC_RELIEF', 0) + aics_counts.get('BALIK_PROBINSYA', 0), 'color': '#06b6d4'},
                ],
                'aicsBreakdown': [
                    {'name': 'Medical', 'value': aics_counts.get('MEDICAL', 0), 'color': '#3b82f6'},
                    {'name': 'Burial', 'value': aics_counts.get('BURIAL', 0), 'color': '#f97316'},
                    {'name': 'Transportation', 'value': aics_counts.get('TRANSPORTATION', 0), 'color': '#eab308'},
                    {'name': 'Economic Relief', 'value': aics_counts.get('ECONOMIC_RELIEF', 0), 'color': '#10b981'},
                    {'name': 'Balik Probinsya', 'value': aics_counts.get('BALIK_PROBINSYA', 0), 'color': '#8b5cf6'},
                ],
                'barangayDistribution': barangay_distribution,
                'recentActivities': capped_activities,
            }
        }, status=status.HTTP_200_OK)


class HealthCheckView(APIView):
    """
    Health check endpoint:
    GET /api/health/
    """
    def get(self, request, format=None):
        return Response({
            'status': 'ok',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, status=status.HTTP_200_OK)
