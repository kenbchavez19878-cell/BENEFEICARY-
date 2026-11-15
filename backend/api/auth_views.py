from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .permissions import account, role


def identity(user):
    profile = account(user)
    return {'role': role(user), 'id': profile.external_id if profile else str(user.pk), 'name': user.get_full_name() or user.username}


class LoginThrottle(AnonRateThrottle):
    rate = '10/min'


@method_decorator(ensure_csrf_cookie, name='dispatch')
class SessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'authenticated': request.user.is_authenticated, 'account': identity(request.user) if request.user.is_authenticated else None}, headers={'Cache-Control': 'no-store'})


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        if not isinstance(request.data, dict):
            return Response({'error': 'Expected a JSON object.'}, status=400)
        username, password = request.data.get('username'), request.data.get('password')
        if not isinstance(username, str) or not isinstance(password, str):
            return Response({'error': 'Username and password are required.'}, status=400)
        user = authenticate(request, username=username.strip(), password=password)
        if not user or not role(user) or role(user) != request.data.get('role'):
            return Response({'error': 'Invalid credentials for the selected role.'}, status=400)
        login(request, user)
        return Response({'account': identity(user)}, headers={'Cache-Control': 'no-store'})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'success': True})
