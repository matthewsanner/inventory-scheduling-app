import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
from .models import ItemBooking
from .api.serializers import ItemBookingSerializer
from items.models import Item
from events.models import Event
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
        quantity=5,
        category="ACC",
        color="Red",
        location="Shelf A1"
    )

@pytest.fixture
def sample_event():
    now = timezone.now()
    return Event.objects.create(
        name="Test Event",
        start_datetime=now + timedelta(days=1),
        end_datetime=now + timedelta(days=1, hours=2),
        location="Test Location",
        notes="Test Notes"
    )

@pytest.fixture
def sample_item_booking(sample_item, sample_event):
    return ItemBooking.objects.create(
        item=sample_item,
        event=sample_event,
        quantity=2
    )

@pytest.mark.django_db
class TestItemBookingModel:
    def test_create_item_booking(self, sample_item, sample_event):
        booking = ItemBooking.objects.create(
            item=sample_item,
            event=sample_event,
            quantity=2
        )
        assert booking.item == sample_item
        assert booking.event == sample_event
        assert booking.quantity == 2
        assert booking.created_at is not None

    def test_item_booking_str_representation(self, sample_item_booking):
        assert str(sample_item_booking) == f"{sample_item_booking.item.name} - {sample_item_booking.event.name} ({sample_item_booking.quantity})"

    def test_unique_together_constraint(self, sample_item, sample_event):
        # Create first booking
        ItemBooking.objects.create(
            item=sample_item,
            event=sample_event,
            quantity=1
        )
        # Try to create duplicate booking
        with pytest.raises(Exception):  # IntegrityError or ValidationError
            ItemBooking.objects.create(
                item=sample_item,
                event=sample_event,
                quantity=2
            )

    def test_can_create_booking_for_different_items_same_event(self, sample_event):
        item1 = Item.objects.create(name="Item 1", quantity=5)
        item2 = Item.objects.create(name="Item 2", quantity=5)
        
        booking1 = ItemBooking.objects.create(item=item1, event=sample_event, quantity=2)
        booking2 = ItemBooking.objects.create(item=item2, event=sample_event, quantity=3)
        
        assert booking1.item == item1
        assert booking2.item == item2
        assert booking1.event == booking2.event

    def test_can_create_booking_for_same_item_different_events(self, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=3),
            end_datetime=now + timedelta(days=3, hours=2)
        )
        
        booking1 = ItemBooking.objects.create(item=sample_item, event=event1, quantity=2)
        booking2 = ItemBooking.objects.create(item=sample_item, event=event2, quantity=3)
        
        assert booking1.item == booking2.item
        assert booking1.event != booking2.event

    def test_overbooking_validation_prevents_exceeding_quantity(self, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=1, hours=1),  # Overlaps with event1
            end_datetime=now + timedelta(days=1, hours=3)
        )
        
        # Create first booking
        ItemBooking.objects.create(item=sample_item, event=event1, quantity=3)
        
        # Try to create overlapping booking that would exceed quantity
        with pytest.raises(ValidationError) as exc_info:
            booking = ItemBooking(item=sample_item, event=event2, quantity=3)
            booking.full_clean()
            booking.save()
        assert 'quantity' in exc_info.value.error_dict

    def test_overbooking_validation_allows_non_overlapping_bookings(self, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),  # Does not overlap
            end_datetime=now + timedelta(days=2, hours=2)
        )
        
        # Create first booking
        booking1 = ItemBooking.objects.create(item=sample_item, event=event1, quantity=3)
        # Create second booking for non-overlapping event
        booking2 = ItemBooking.objects.create(item=sample_item, event=event2, quantity=3)
        
        assert booking1.quantity == 3
        assert booking2.quantity == 3

    def test_overbooking_validation_handles_partial_overlap(self, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=4)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=1, hours=2),  # Overlaps with event1
            end_datetime=now + timedelta(days=1, hours=6)
        )
        
        # Create first booking
        ItemBooking.objects.create(item=sample_item, event=event1, quantity=3)
        
        # Try to create overlapping booking
        with pytest.raises(ValidationError) as exc_info:
            booking = ItemBooking(item=sample_item, event=event2, quantity=3)
            booking.full_clean()
            booking.save()
        assert 'quantity' in exc_info.value.error_dict

    def test_overbooking_validation_allows_exact_quantity(self, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=1, hours=1),  # Overlaps with event1
            end_datetime=now + timedelta(days=1, hours=3)
        )
        
        # Create first booking
        ItemBooking.objects.create(item=sample_item, event=event1, quantity=3)
        
        # Create second booking that uses remaining quantity
        booking2 = ItemBooking.objects.create(item=sample_item, event=event2, quantity=2)
        assert booking2.quantity == 2

@pytest.mark.django_db
class TestItemBookingSerializer:
    def test_serialize_item_booking(self, sample_item_booking):
        serializer = ItemBookingSerializer(sample_item_booking)
        data = serializer.data

        assert data['item'] == sample_item_booking.item.pk
        assert data['event'] == sample_item_booking.event.pk
        assert data['quantity'] == sample_item_booking.quantity
        assert data['item_name'] == sample_item_booking.item.name
        assert data['event_name'] == sample_item_booking.event.name
        assert data['event_start_datetime'] is not None
        assert data['event_end_datetime'] is not None

    def test_deserialize_item_booking(self, sample_item, sample_event):
        data = {
            'item': sample_item.pk,
            'event': sample_event.pk,
            'quantity': 3
        }
        serializer = ItemBookingSerializer(data=data)
        assert serializer.is_valid()
        booking = serializer.save()
        assert booking.item == sample_item
        assert booking.event == sample_event
        assert booking.quantity == 3

    def test_serializer_validation_error_missing_fields(self):
        data = {
            'quantity': 1
        }
        serializer = ItemBookingSerializer(data=data)
        assert not serializer.is_valid()
        assert 'item' in serializer.errors
        assert 'event' in serializer.errors

    def test_serializer_read_only_fields(self, sample_item_booking):
        serializer = ItemBookingSerializer(sample_item_booking)
        data = serializer.data
        
        # Read-only fields should be present
        assert 'item_name' in data
        assert 'event_name' in data
        assert 'event_start_datetime' in data
        assert 'event_end_datetime' in data

    def test_serializer_overbooking_validation(self, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=1, hours=1),  # Overlaps
            end_datetime=now + timedelta(days=1, hours=3)
        )
        
        # Create first booking
        ItemBooking.objects.create(item=sample_item, event=event1, quantity=3)
        
        # Try to create overlapping booking via serializer
        data = {
            'item': sample_item.pk,
            'event': event2.pk,
            'quantity': 3
        }
        serializer = ItemBookingSerializer(data=data)
        assert not serializer.is_valid()
        assert 'quantity' in serializer.errors

@pytest.mark.django_db
class TestItemBookingAPI:
    def test_list_item_bookings(self, authenticated_staff_client, sample_item_booking):
        url = reverse('itembooking-list')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['item'] == sample_item_booking.item.pk
        assert response.data['results'][0]['event'] == sample_item_booking.event.pk
        assert response.data['results'][0]['quantity'] == sample_item_booking.quantity
        assert response.data['results'][0]['item_name'] == sample_item_booking.item.name
        assert response.data['results'][0]['event_name'] == sample_item_booking.event.name

    def test_create_item_booking(self, authenticated_manager_client, sample_item, sample_event):
        url = reverse('itembooking-list')
        data = {
            'item': sample_item.pk,
            'event': sample_event.pk,
            'quantity': 2
        }
        assert ItemBooking.objects.count() == 0
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert ItemBooking.objects.count() == 1
        booking = ItemBooking.objects.first()
        assert booking.item == sample_item
        assert booking.event == sample_event
        assert booking.quantity == 2

    def test_retrieve_item_booking(self, authenticated_staff_client, sample_item_booking):
        url = reverse('itembooking-detail', kwargs={'pk': sample_item_booking.pk})
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['item'] == sample_item_booking.item.pk
        assert response.data['event'] == sample_item_booking.event.pk
        assert response.data['quantity'] == sample_item_booking.quantity
        assert response.data['item_name'] == sample_item_booking.item.name
        assert response.data['event_name'] == sample_item_booking.event.name

    def test_retrieve_nonexistent_item_booking(self, authenticated_staff_client):
        url = reverse('itembooking-detail', kwargs={'pk': 999})
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_item_booking_quantity(self, authenticated_manager_client, sample_item_booking):
        url = reverse('itembooking-detail', kwargs={'pk': sample_item_booking.pk})
        data = {'quantity': 4}
        response = authenticated_manager_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_item_booking.refresh_from_db()
        assert sample_item_booking.quantity == 4

    def test_update_item_booking_ignores_item_change(self, authenticated_manager_client, sample_item_booking):
        new_item = Item.objects.create(name="New Item", quantity=5)
        url = reverse('itembooking-detail', kwargs={'pk': sample_item_booking.pk})
        data = {'item': new_item.pk}
        response = authenticated_manager_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_item_booking.refresh_from_db()
        # Item should not have changed
        assert sample_item_booking.item != new_item

    def test_update_item_booking_ignores_event_change(self, authenticated_manager_client, sample_item_booking):
        now = timezone.now()
        new_event = Event.objects.create(
            name="New Event",
            start_datetime=now + timedelta(days=5),
            end_datetime=now + timedelta(days=5, hours=2)
        )
        url = reverse('itembooking-detail', kwargs={'pk': sample_item_booking.pk})
        data = {'event': new_event.pk}
        response = authenticated_manager_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_item_booking.refresh_from_db()
        # Event should not have changed
        assert sample_item_booking.event != new_event

    def test_delete_item_booking(self, authenticated_manager_client, sample_item_booking):
        url = reverse('itembooking-detail', kwargs={'pk': sample_item_booking.pk})
        response = authenticated_manager_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert ItemBooking.objects.count() == 0

    def test_create_item_booking_with_overbooking_via_api(self, authenticated_manager_client, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=1, hours=1),  # Overlaps
            end_datetime=now + timedelta(days=1, hours=3)
        )
        
        # Create first booking
        url = reverse('itembooking-list')
        data1 = {
            'item': sample_item.pk,
            'event': event1.pk,
            'quantity': 3
        }
        response1 = authenticated_manager_client.post(url, data1, format='json')
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Try to create overlapping booking
        data2 = {
            'item': sample_item.pk,
            'event': event2.pk,
            'quantity': 3
        }
        response2 = authenticated_manager_client.post(url, data2, format='json')
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'quantity' in response2.data

    def test_update_item_booking_with_overbooking_via_api(self, authenticated_manager_client, sample_item):
        now = timezone.now()
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=1, hours=1),  # Overlaps
            end_datetime=now + timedelta(days=1, hours=3)
        )
        event3 = Event.objects.create(
            name="Event 3",
            start_datetime=now + timedelta(days=2),  # Does not overlap
            end_datetime=now + timedelta(days=2, hours=2)
        )
        
        # Create two bookings
        booking1 = ItemBooking.objects.create(item=sample_item, event=event1, quantity=2)
        booking2 = ItemBooking.objects.create(item=sample_item, event=event3, quantity=2)
        
        # Try to update booking2 quantity to cause overbooking with event1
        url = reverse('itembooking-detail', kwargs={'pk': booking2.pk})
        data = {'quantity': 4}  # This would exceed available quantity when considering event1
        response = authenticated_manager_client.patch(url, data, format='json')
        # This should succeed because event3 doesn't overlap with event1
        assert response.status_code == status.HTTP_200_OK

    def test_pagination_metadata(self, authenticated_staff_client):
        # Create multiple bookings
        item = Item.objects.create(name="Test Item", quantity=10)
        now = timezone.now()
        for i in range(15):
            event = Event.objects.create(
                name=f"Event {i}",
                start_datetime=now + timedelta(days=i+1),
                end_datetime=now + timedelta(days=i+1, hours=2)
            )
            ItemBooking.objects.create(item=item, event=event, quantity=1)
        url = reverse('itembooking-list')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'count' in response.data
        assert 'results' in response.data
        assert response.data['count'] == 15
        assert len(response.data['results']) == settings.REST_FRAMEWORK['PAGE_SIZE']

    def test_staff_cannot_create_item_booking(self, authenticated_staff_client, sample_item, sample_event):
        url = reverse('itembooking-list')
        data = {
            'item': sample_item.pk,
            'event': sample_event.pk,
            'quantity': 1
        }
        response = authenticated_staff_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_cannot_update_item_booking(self, authenticated_staff_client, sample_item_booking):
        url = reverse('itembooking-detail', kwargs={'pk': sample_item_booking.pk})
        data = {'quantity': 5}
        response = authenticated_staff_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_cannot_delete_item_booking(self, authenticated_staff_client, sample_item_booking):
        url = reverse('itembooking-detail', kwargs={'pk': sample_item_booking.pk})
        response = authenticated_staff_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access_item_bookings(self, api_client):
        url = reverse('itembooking-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

