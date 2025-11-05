from django.test import TestCase
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Item
from .api.serializers import ItemSerializer
from django.conf import settings

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
def authenticated_manager_client(api_client, manager_user):
    token = RefreshToken.for_user(manager_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
    return api_client

@pytest.fixture
def authenticated_staff_client(api_client, staff_user):
    token = RefreshToken.for_user(staff_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
    return api_client

@pytest.fixture
def sample_item():
    return Item.objects.create(
        name="Test Item",
        description="Test Description",
        quantity=1,
        category="ACC",
        color="Red",
        location="Shelf A1"
    )

@pytest.mark.django_db
class TestItemModel:
    def test_create_item(self):
        item = Item.objects.create(
            name="Test Item",
            description="Test Description",
            quantity=1,
            category="ACC",
            color="Red",
            location="Shelf A1"
        )
        assert item.name == "Test Item"
        assert item.description == "Test Description"
        assert item.quantity == 1
        assert item.category == "ACC"
        assert item.color == "Red"
        assert item.location == "Shelf A1"

    def test_create_item_minimal_fields(self):
        item = Item.objects.create(
            name="Minimal Item",
            quantity=1
        )
        assert item.name == "Minimal Item"
        assert item.quantity == 1
        assert item.description == ""
        assert item.category == ""
        assert item.color == ""
        assert item.location == ""

    def test_item_str_representation(self, sample_item):
        assert str(sample_item) == f"Name: {sample_item.name}"

@pytest.mark.django_db
class TestItemSerializer:
    def test_serialize_item(self, sample_item):
        serializer = ItemSerializer(sample_item)
        data = serializer.data

        assert data['name'] == sample_item.name
        assert data['description'] == sample_item.description
        assert data['quantity'] == sample_item.quantity
        assert data['category'] == sample_item.category
        assert data['category_long'] == sample_item.get_category_display()
        assert data['color'] == sample_item.color
        assert data['location'] == sample_item.location

    def test_deserialize_item(self):
        data = {
            'name': 'New Item',
            'description': 'New Description',
            'quantity': 2,
            'category': 'APP',
            'color': 'Blue',
            'location': 'Shelf B2'
        }
        serializer = ItemSerializer(data=data)
        assert serializer.is_valid()
        item = serializer.save()
        for key in data:
            assert getattr(item, key) == data[key]

    def test_serializer_validation_error(self):
        data = {
            'name': '',
            'quantity': -5
        }
        serializer = ItemSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors
        assert 'quantity' in serializer.errors

    def test_serializer_optional_fields(self):
        data = {
            'name': 'Item Without Optional Fields',
            'quantity': 1
        }
        serializer = ItemSerializer(data=data)
        assert serializer.is_valid()
        item = serializer.save()
        assert item.name == data['name']
        assert item.description == ""
        assert item.category == ""
        assert item.color == ""
        assert item.location == ""

@pytest.mark.django_db
class TestItemAPI:
    def test_list_items(self, authenticated_staff_client, sample_item):
        url = reverse('item-list')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == sample_item.name

    def test_create_item(self, authenticated_manager_client):
        url = reverse('item-list')
        data = {
            'name': 'New API Item',
            'description': 'Created via API',
            'quantity': 1,
            'category': 'ACC',
            'color': 'Green',
            'location': 'Shelf C3'
        }
        assert Item.objects.count() == 0
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Item.objects.count() == 1
        item = Item.objects.first()
        assert item.name == data['name']
        assert item.description == data['description']
        assert item.category == data['category']
        assert item.color == data['color']
        assert item.location == data['location']

    def test_create_item_minimal_fields(self, authenticated_manager_client):
        url = reverse('item-list')
        data = {
            'name': 'Minimal API Item',
            'quantity': 1
        }
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        item = Item.objects.first()
        assert item.name == data['name']
        assert item.quantity == data['quantity']
        assert item.description == ""
        assert item.category == ""
        assert item.color == ""
        assert item.location == ""

    def test_retrieve_item(self, authenticated_staff_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == sample_item.name
        assert response.data['description'] == sample_item.description
        assert response.data['category'] == sample_item.category
        assert response.data['color'] == sample_item.color
        assert response.data['location'] == sample_item.location

    def test_retrieve_nonexistent_item(self, authenticated_staff_client):
        url = reverse('item-detail', kwargs={'pk': 999})
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_item(self, authenticated_manager_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        data = {'name': 'Updated Name'}
        response = authenticated_manager_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_item.refresh_from_db()
        assert sample_item.name == 'Updated Name'

    def test_update_item_full(self, authenticated_manager_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        data = {
            'name': 'Fully Updated Item',
            'description': 'Updated Description',
            'quantity': 5,
            'category': 'APP',
            'color': 'Blue',
            'location': 'Updated Location'
        }
        response = authenticated_manager_client.put(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_item.refresh_from_db()
        assert sample_item.name == data['name']
        assert sample_item.description == data['description']
        assert sample_item.quantity == data['quantity']
        assert sample_item.category == data['category']
        assert sample_item.color == data['color']
        assert sample_item.location == data['location']

    def test_update_nonexistent_item(self, authenticated_manager_client):
        url = reverse('item-detail', kwargs={'pk': 999})
        response = authenticated_manager_client.patch(url, {'name': 'Does Not Exist'}, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_item(self, authenticated_manager_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        response = authenticated_manager_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Item.objects.count() == 0

    def test_filter_items(self, authenticated_staff_client, sample_item):
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'name': 'Test'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == sample_item.name

    def test_filter_no_results(self, authenticated_staff_client):
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'name': 'NothingHere'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_category_choices(self, authenticated_staff_client):
        url = reverse('category-choices')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == len(Item.CATEGORY_CHOICES)
        for choice in Item.CATEGORY_CHOICES:
            assert {'value': choice[0], 'label': choice[1]} in response.data

    @pytest.mark.parametrize("invalid_payload", [
        {},
        {'name': '', 'quantity': 0},
        {'name': 'Test', 'quantity': -10},
    ])
    def test_create_item_invalid_data(self, authenticated_manager_client, invalid_payload):
        url = reverse('item-list')
        response = authenticated_manager_client.post(url, invalid_payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_pagination_metadata(self, authenticated_staff_client):
        # Create multiple items
        for i in range(15):
            Item.objects.create(
                name=f"Item {i}",
                description="desc",
                quantity=1,
                category="ACC",
                color="Black",
                location="Shelf Z"
            )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'count' in response.data
        assert 'results' in response.data
        assert response.data['count'] == 15

        assert len(response.data['results']) == settings.REST_FRAMEWORK['PAGE_SIZE']

    def test_staff_cannot_create_item(self, authenticated_staff_client):
        url = reverse('item-list')
        data = {
            'name': 'Unauthorized Item',
            'quantity': 1,
            'category': 'ACC'
        }
        response = authenticated_staff_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_cannot_update_item(self, authenticated_staff_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        data = {'name': 'Unauthorized Update'}
        response = authenticated_staff_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_cannot_delete_item(self, authenticated_staff_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        response = authenticated_staff_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access_items(self, api_client):
        url = reverse('item-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

