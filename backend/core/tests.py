import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from .api.serializers import UserSerializer
from .permissions import IsManagerOrStaffReadOnly
from rest_framework.permissions import SAFE_METHODS

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def manager_group():
    group, _ = Group.objects.get_or_create(name='Manager')
    return group

@pytest.fixture
def staff_group():
    group, _ = Group.objects.get_or_create(name='Staff')
    return group

@pytest.fixture
def manager_user(manager_group):
    user = User.objects.create_user(username='manager', password='testpass123')
    user.groups.add(manager_group)
    return user

@pytest.fixture
def staff_user(staff_group):
    user = User.objects.create_user(username='staff', password='testpass123')
    user.groups.add(staff_group)
    return user

@pytest.fixture
def regular_user():
    return User.objects.create_user(username='regular', password='testpass123')

@pytest.mark.django_db
class TestUserSerializer:
    def test_serialize_user_with_groups(self, manager_user):
        serializer = UserSerializer(manager_user)
        data = serializer.data

        assert data['id'] == manager_user.id
        assert data['username'] == 'manager'
        assert 'Manager' in data['groups']
        assert data['is_manager'] is True
        assert data['is_staff'] is False

    def test_serialize_staff_user(self, staff_user):
        serializer = UserSerializer(staff_user)
        data = serializer.data

        assert data['username'] == 'staff'
        assert 'Staff' in data['groups']
        assert data['is_manager'] is False
        assert data['is_staff'] is True

    def test_serialize_user_with_multiple_groups(self, manager_group, staff_group):
        user = User.objects.create_user(username='multiuser', password='testpass123')
        user.groups.add(manager_group, staff_group)

        serializer = UserSerializer(user)
        data = serializer.data

        assert 'Manager' in data['groups']
        assert 'Staff' in data['groups']
        assert data['is_manager'] is True
        assert data['is_staff'] is True

    def test_serialize_user_with_no_groups(self, regular_user):
        serializer = UserSerializer(regular_user)
        data = serializer.data

        assert data['groups'] == []
        assert data['is_manager'] is False
        assert data['is_staff'] is False

@pytest.mark.django_db
class TestAuthenticationAPI:
    def test_login_success(self, api_client, regular_user):
        url = reverse('token_obtain_pair')
        response = api_client.post(url, {
            'username': 'regular',
            'password': 'testpass123'
        }, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
        assert response.data['user']['username'] == 'regular'

    def test_login_invalid_credentials(self, api_client):
        url = reverse('token_obtain_pair')
        response = api_client.post(url, {
            'username': 'nonexistent',
            'password': 'wrongpass'
        }, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_credentials(self, api_client):
        url = reverse('token_obtain_pair')
        response = api_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_current_user_authenticated(self, api_client, manager_user):
        token = RefreshToken.for_user(manager_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

        url = reverse('current_user')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'manager'
        assert response.data['id'] == manager_user.id
        assert 'is_manager' in response.data

    def test_get_current_user_unauthenticated(self, api_client):
        url = reverse('current_user')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_authenticated(self, api_client, regular_user):
        token = RefreshToken.for_user(regular_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

        url = reverse('logout')
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'detail' in response.data

    def test_logout_unauthenticated(self, api_client):
        url = reverse('logout')
        response = api_client.post(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_token(self, api_client, regular_user):
        # First login to get tokens
        login_url = reverse('token_obtain_pair')
        login_response = api_client.post(login_url, {
            'username': 'regular',
            'password': 'testpass123'
        }, format='json')

        refresh_token = login_response.data['refresh']

        # Use refresh token to get new access token
        refresh_url = reverse('token_refresh')
        response = api_client.post(refresh_url, {
            'refresh': refresh_token
        }, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

@pytest.mark.django_db
class TestPermissions:
    def test_unauthenticated_user_denied(self):
        permission = IsManagerOrStaffReadOnly()
        request = type('Request', (), {
            'user': None,
            'method': 'GET'
        })()

        assert permission.has_permission(request, None) is False

    def test_superuser_allowed_all_operations(self):
        permission = IsManagerOrStaffReadOnly()
        superuser = User.objects.create_user(username='super', password='testpass123', is_superuser=True)

        for method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            request = type('Request', (), {
                'user': superuser,
                'method': method
            })()
            assert permission.has_permission(request, None) is True

    def test_manager_allowed_all_operations(self, manager_user):
        permission = IsManagerOrStaffReadOnly()

        for method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            request = type('Request', (), {
                'user': manager_user,
                'method': method
            })()
            assert permission.has_permission(request, None) is True

    def test_staff_allowed_read_only(self, staff_user):
        permission = IsManagerOrStaffReadOnly()

        # Safe methods should be allowed
        for method in SAFE_METHODS:
            request = type('Request', (), {
                'user': staff_user,
                'method': method
            })()
            assert permission.has_permission(request, None) is True

        # Unsafe methods should be denied
        for method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            request = type('Request', (), {
                'user': staff_user,
                'method': method
            })()
            assert permission.has_permission(request, None) is False

    def test_user_without_groups_denied(self, regular_user):
        permission = IsManagerOrStaffReadOnly()

        for method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            request = type('Request', (), {
                'user': regular_user,
                'method': method
            })()
            assert permission.has_permission(request, None) is False

    def test_authenticated_user_property(self):
        permission = IsManagerOrStaffReadOnly()
        
        # Use AnonymousUser for unauthenticated users
        from django.contrib.auth.models import AnonymousUser
        unauthenticated_user = AnonymousUser()

        request = type('Request', (), {
            'user': unauthenticated_user,
            'method': 'GET'
        })()

        assert permission.has_permission(request, None) is False

