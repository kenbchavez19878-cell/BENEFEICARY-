from uuid import uuid4

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


def api_test_client():
    client = APIClient()
    user = get_user_model().objects.create_user(username=f'test-{uuid4().hex}', is_staff=True)
    client.force_authenticate(user=user)
    return client
