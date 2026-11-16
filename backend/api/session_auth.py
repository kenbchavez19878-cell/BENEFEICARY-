from importlib import import_module
from types import SimpleNamespace

from django.conf import settings
from django.contrib.auth import get_user
from django.core import signing
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed

SESSION_SALT = 'benefitrack.tab-session.v1'


def session_store(key=None):
    return import_module(settings.SESSION_ENGINE).SessionStore(session_key=key)


def tab_session_token(request):
    request.session.save()
    return signing.dumps(request.session.session_key, salt=SESSION_SALT)


class TabSessionAuthentication(SessionAuthentication):
    def authenticate(self, request):
        token = request.headers.get('X-Benefitrack-Session')
        if token is None:
            return super().authenticate(request)
        try:
            key = signing.loads(token, salt=SESSION_SALT, max_age=settings.SESSION_COOKIE_AGE)
            if not isinstance(key, str):
                raise signing.BadSignature()
        except signing.BadSignature:
            raise AuthenticationFailed('Your tab session has expired. Please sign in again.') from None
        session = session_store(key)
        user = get_user(SimpleNamespace(session=session))
        if not user.is_authenticated or not user.is_active:
            raise AuthenticationFailed('Your tab session has expired. Please sign in again.')
        self.enforce_csrf(request)
        request._request.session = session
        request._request.user = user
        return user, None
