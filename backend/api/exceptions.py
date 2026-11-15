import logging

from django.db import DataError, IntegrityError, InterfaceError, OperationalError
from rest_framework.response import Response
from rest_framework.views import exception_handler, set_rollback

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response
    if isinstance(exc, (IntegrityError, DataError)):
        set_rollback()
        logger.warning('Rejected database write in %s: %s', type(context.get('view')).__name__, type(exc).__name__)
        return Response({
            'success': False,
            'error': 'The submitted data conflicts with database constraints. Check the field values and try again.',
        }, status=400)
    if isinstance(exc, (OperationalError, InterfaceError)):
        set_rollback()
        logger.error('Database unavailable in %s: %s', type(context.get('view')).__name__, type(exc).__name__)
        return Response({
            'success': False,
            'error': 'Database temporarily unavailable. Please try again shortly.',
        }, status=503)
    return None
