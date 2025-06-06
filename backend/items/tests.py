from django.test import TestCase
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Item
from .api.serializers import ItemSerializer
from django.conf import settings

@pytest.fixture
def api_client():
    return APIClient()

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
        assert not item.checked_out
        assert not item.in_repair

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
        assert data['checked_out'] == sample_item.checked_out
        assert data['in_repair'] == sample_item.in_repair

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

@pytest.mark.django_db
class TestItemAPI:
    def test_list_items(self, api_client, sample_item):
        url = reverse('item-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == sample_item.name

    def test_create_item(self, api_client):
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
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Item.objects.count() == 1
        item = Item.objects.first()
        assert item.name == data['name']
        assert item.checked_out is False
        assert item.in_repair is False

    def test_retrieve_item(self, api_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == sample_item.name

    def test_retrieve_nonexistent_item(self, api_client):
        url = reverse('item-detail', kwargs={'pk': 999})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_item(self, api_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        data = {'name': 'Updated Name'}
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_item.refresh_from_db()
        assert sample_item.name == 'Updated Name'

    def test_update_nonexistent_item(self, api_client):
        url = reverse('item-detail', kwargs={'pk': 999})
        response = api_client.patch(url, {'name': 'Does Not Exist'}, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_item(self, api_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Item.objects.count() == 0

    def test_filter_items(self, api_client, sample_item):
        url = reverse('item-list')
        response = api_client.get(url, {'name': 'Test'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == sample_item.name

    def test_filter_no_results(self, api_client):
        url = reverse('item-list')
        response = api_client.get(url, {'name': 'NothingHere'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_category_choices(self, api_client):
        url = reverse('category-choices')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == len(Item.CATEGORY_CHOICES)
        for choice in Item.CATEGORY_CHOICES:
            assert {'value': choice[0], 'label': choice[1]} in response.data

    @pytest.mark.parametrize("invalid_payload", [
        {},
        {'name': '', 'quantity': 0},
        {'name': 'Test', 'quantity': -10},
    ])
    def test_create_item_invalid_data(self, api_client, invalid_payload):
        url = reverse('item-list')
        response = api_client.post(url, invalid_payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_pagination_metadata(self, api_client):
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
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'count' in response.data
        assert 'results' in response.data
        assert response.data['count'] == 15

        assert len(response.data['results']) == settings.REST_FRAMEWORK['PAGE_SIZE']

