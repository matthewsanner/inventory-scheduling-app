from django.test import TestCase
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Item, Category
from .api.serializers import ItemSerializer
from django.conf import settings

User = get_user_model()

@pytest.fixture
def category_acc():
    return Category.objects.get_or_create(name='Accessories')[0]

@pytest.fixture
def category_app():
    return Category.objects.get_or_create(name='Apparatus')[0]

@pytest.fixture
def category_hat():
    return Category.objects.get_or_create(name='Hats')[0]

@pytest.fixture
def category_shi():
    return Category.objects.get_or_create(name='Shirts')[0]

@pytest.fixture
def category_zeb():
    return Category.objects.get_or_create(name='Zebra')[0]

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
def sample_item(category_acc):
    return Item.objects.create(
        name="Test Item",
        description="Test Description",
        quantity=1,
        category=category_acc,
        color="Red",
        location="Shelf A1"
    )

@pytest.mark.django_db
class TestItemModel:
    def test_create_item(self, category_acc):
        item = Item.objects.create(
            name="Test Item",
            description="Test Description",
            quantity=1,
            category=category_acc,
            color="Red",
            location="Shelf A1"
        )
        assert item.name == "Test Item"
        assert item.description == "Test Description"
        assert item.quantity == 1
        assert item.category == category_acc
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
        assert item.category is None
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
        assert data['category']['id'] == sample_item.category.id
        assert data['category']['name'] == sample_item.category.name
        assert data['color'] == sample_item.color
        assert data['location'] == sample_item.location

    def test_deserialize_item(self, category_app):
        data = {
            'name': 'New Item',
            'description': 'New Description',
            'quantity': 2,
            'category': category_app.id,
            'color': 'Blue',
            'location': 'Shelf B2'
        }
        serializer = ItemSerializer(data=data)
        assert serializer.is_valid()
        item = serializer.save()
        assert item.name == data['name']
        assert item.description == data['description']
        assert item.quantity == data['quantity']
        assert item.category == category_app
        assert item.color == data['color']
        assert item.location == data['location']

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
        assert item.category is None
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

    def test_create_item(self, authenticated_manager_client, category_acc):
        url = reverse('item-list')
        data = {
            'name': 'New API Item',
            'description': 'Created via API',
            'quantity': 1,
            'category': category_acc.id,
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
        assert item.category == category_acc
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
        assert item.category is None
        assert item.color == ""
        assert item.location == ""

    def test_retrieve_item(self, authenticated_staff_client, sample_item):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == sample_item.name
        assert response.data['description'] == sample_item.description
        assert response.data['category']['id'] == sample_item.category.id
        assert response.data['category']['name'] == sample_item.category.name
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

    def test_update_item_full(self, authenticated_manager_client, sample_item, category_app):
        url = reverse('item-detail', kwargs={'pk': sample_item.pk})
        data = {
            'name': 'Fully Updated Item',
            'description': 'Updated Description',
            'quantity': 5,
            'category': category_app.id,
            'color': 'Blue',
            'location': 'Updated Location'
        }
        response = authenticated_manager_client.put(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_item.refresh_from_db()
        assert sample_item.name == data['name']
        assert sample_item.description == data['description']
        assert sample_item.quantity == data['quantity']
        assert sample_item.category == category_app
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

    def test_filter_by_category(self, authenticated_staff_client, category_acc, category_app):
        Item.objects.create(
            name="Item 1",
            quantity=1,
            category=category_acc
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            category=category_app
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'category': category_acc.id})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['category']['id'] == category_acc.id

    def test_filter_by_color(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 1",
            quantity=1,
            color="Red"
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            color="Blue"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'color': 'Red'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['color'] == "Red"

    def test_filter_by_location(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 1",
            quantity=1,
            location="Shelf A1"
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            location="Shelf B2"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'location': 'Shelf A'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['location'] == "Shelf A1"

    def test_filter_combined_filters(self, authenticated_staff_client, category_hat, category_shi):
        Item.objects.create(
            name="Red Hat",
            quantity=1,
            category=category_hat,
            color="Red",
            location="Shelf A1"
        )
        Item.objects.create(
            name="Blue Hat",
            quantity=1,
            category=category_hat,
            color="Blue",
            location="Shelf A1"
        )
        Item.objects.create(
            name="Red Shirt",
            quantity=1,
            category=category_shi,
            color="Red",
            location="Shelf A1"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {
            'category': category_hat.id,
            'color': 'Red'
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == "Red Hat"

    def test_search_items_by_name(self, authenticated_staff_client):
        Item.objects.create(
            name="Python Book",
            quantity=1
        )
        Item.objects.create(
            name="JavaScript Guide",
            quantity=1
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'search': 'Python'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert 'Python' in response.data['results'][0]['name']

    def test_search_items_by_description(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 1",
            quantity=1,
            description="Technical manual"
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            description="User guide"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'search': 'technical'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert 'technical' in response.data['results'][0]['description'].lower()

    def test_search_items_by_color(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 1",
            quantity=1,
            color="Light Blue"
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            color="Dark Red"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'search': 'Blue'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['color'] == "Light Blue"

    def test_search_items_by_location(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 1",
            quantity=1,
            location="Conference Room A"
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            location="Training Room B"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'search': 'Conference'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['location'] == "Conference Room A"

    def test_search_items_no_results(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 1",
            quantity=1
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'search': 'NonexistentTerm'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_order_items_by_name(self, authenticated_staff_client):
        Item.objects.create(
            name="Zebra Item",
            quantity=1
        )
        Item.objects.create(
            name="Alpha Item",
            quantity=1
        )
        Item.objects.create(
            name="Beta Item",
            quantity=1
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'ordering': 'name'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['name'] == "Alpha Item"
        assert response.data['results'][1]['name'] == "Beta Item"
        assert response.data['results'][2]['name'] == "Zebra Item"

    def test_order_items_by_category(self, authenticated_staff_client, category_acc, category_app, category_zeb):
        Item.objects.create(
            name="Item 3",
            quantity=1,
            category=category_zeb
        )
        Item.objects.create(
            name="Item 1",
            quantity=1,
            category=category_acc
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            category=category_app
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'ordering': 'category'})
        assert response.status_code == status.HTTP_200_OK
        # Categories are ordered by name, so Accessories, Apparatus, Zebra
        assert response.data['results'][0]['category']['id'] == category_acc.id
        assert response.data['results'][1]['category']['id'] == category_app.id
        assert response.data['results'][2]['category']['id'] == category_zeb.id

    def test_order_items_by_quantity(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 3",
            quantity=3
        )
        Item.objects.create(
            name="Item 1",
            quantity=1
        )
        Item.objects.create(
            name="Item 2",
            quantity=2
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'ordering': 'quantity'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['quantity'] == 1
        assert response.data['results'][1]['quantity'] == 2
        assert response.data['results'][2]['quantity'] == 3

    def test_order_items_by_quantity_descending(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 1",
            quantity=1
        )
        Item.objects.create(
            name="Item 3",
            quantity=3
        )
        Item.objects.create(
            name="Item 2",
            quantity=2
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'ordering': '-quantity'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['quantity'] == 3
        assert response.data['results'][1]['quantity'] == 2
        assert response.data['results'][2]['quantity'] == 1

    def test_order_items_by_color(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 3",
            quantity=1,
            color="Zebra"
        )
        Item.objects.create(
            name="Item 1",
            quantity=1,
            color="Alpha"
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            color="Beta"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'ordering': 'color'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['color'] == "Alpha"
        assert response.data['results'][1]['color'] == "Beta"
        assert response.data['results'][2]['color'] == "Zebra"

    def test_order_items_by_location(self, authenticated_staff_client):
        Item.objects.create(
            name="Item 3",
            quantity=1,
            location="Shelf Z"
        )
        Item.objects.create(
            name="Item 1",
            quantity=1,
            location="Shelf A"
        )
        Item.objects.create(
            name="Item 2",
            quantity=1,
            location="Shelf B"
        )
        url = reverse('item-list')
        response = authenticated_staff_client.get(url, {'ordering': 'location'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['location'] == "Shelf A"
        assert response.data['results'][1]['location'] == "Shelf B"
        assert response.data['results'][2]['location'] == "Shelf Z"

    def test_category_choices(self, authenticated_staff_client):
        # Create some categories for the test
        category1 = Category.objects.create(name='Accessories')
        category2 = Category.objects.create(name='Apparatus')
        
        url = reverse('category-choices')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Check that response is a list of dicts with value and label
        assert isinstance(response.data, list)
        assert len(response.data) >= 2  # At least the categories we created
        for item in response.data:
            assert 'value' in item
            assert 'label' in item
            assert isinstance(item['value'], int)  # Should be category ID
            assert isinstance(item['label'], str)  # Should be category name
        
        # Check that our created categories are in the response
        category_values = [item['value'] for item in response.data]
        assert category1.id in category_values
        assert category2.id in category_values

    def test_create_category(self, authenticated_manager_client):
        url = reverse('category-choices')
        data = {'name': 'New Category'}
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert 'value' in response.data
        assert 'label' in response.data
        assert response.data['label'] == 'New Category'
        # Verify category was created in database
        category = Category.objects.get(name='New Category')
        assert category.id == response.data['value']

    def test_create_category_duplicate_name(self, authenticated_manager_client):
        # Create a category first
        Category.objects.create(name='Existing Category')
        url = reverse('category-choices')
        data = {'name': 'Existing Category'}
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data

    def test_create_category_empty_name(self, authenticated_manager_client):
        url = reverse('category-choices')
        data = {'name': ''}
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data

    def test_create_category_missing_name(self, authenticated_manager_client):
        url = reverse('category-choices')
        data = {}
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data

    def test_create_category_long_name(self, authenticated_manager_client):
        url = reverse('category-choices')
        # Create a name longer than 200 characters
        data = {'name': 'A' * 201}
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data

    def test_staff_cannot_create_category(self, authenticated_staff_client):
        url = reverse('category-choices')
        data = {'name': 'Unauthorized Category'}
        response = authenticated_staff_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_create_category(self, api_client):
        url = reverse('category-choices')
        data = {'name': 'Unauthorized Category'}
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.parametrize("invalid_payload", [
        {},
        {'name': '', 'quantity': 0},
        {'name': 'Test', 'quantity': -10},
    ])
    def test_create_item_invalid_data(self, authenticated_manager_client, invalid_payload):
        url = reverse('item-list')
        response = authenticated_manager_client.post(url, invalid_payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_pagination_metadata(self, authenticated_staff_client, category_acc):
        # Create multiple items
        for i in range(15):
            Item.objects.create(
                name=f"Item {i}",
                description="desc",
                quantity=1,
                category=category_acc,
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

    def test_staff_cannot_create_item(self, authenticated_staff_client, category_acc):
        url = reverse('item-list')
        data = {
            'name': 'Unauthorized Item',
            'quantity': 1,
            'category': category_acc.id
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

