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
from .models import Event
from .api.serializers import EventSerializer
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
def sample_event():
    now = timezone.now()
    return Event.objects.create(
        name="Test Event",
        start_datetime=now + timedelta(days=1),
        end_datetime=now + timedelta(days=1, hours=2),
        location="Test Location",
        notes="Test Notes"
    )

@pytest.mark.django_db
class TestEventModel:
    def test_create_event(self):
        now = timezone.now()
        event = Event.objects.create(
            name="Test Event",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2),
            location="Test Location",
            notes="Test Notes"
        )
        assert event.name == "Test Event"
        assert event.start_datetime == now + timedelta(days=1)
        assert event.end_datetime == now + timedelta(days=1, hours=2)
        assert event.location == "Test Location"
        assert event.notes == "Test Notes"

    def test_create_event_minimal_fields(self):
        now = timezone.now()
        event = Event.objects.create(
            name="Minimal Event",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=1)
        )
        assert event.name == "Minimal Event"
        assert event.location == ""
        assert event.notes == ""

    def test_event_str_representation(self, sample_event):
        assert str(sample_event) == f"Name: {sample_event.name}"

    def test_create_event_with_valid_datetime_range(self):
        now = timezone.now()
        event = Event.objects.create(
            name="Valid Event",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        assert event.name == "Valid Event"
        assert event.end_datetime > event.start_datetime

    def test_create_event_with_end_before_start_raises_validation_error(self):
        now = timezone.now()
        with pytest.raises(ValidationError) as exc_info:
            Event.objects.create(
                name="Invalid Event",
                start_datetime=now + timedelta(days=1),
                end_datetime=now + timedelta(days=1, hours=-2)
            )
        assert 'end_datetime' in exc_info.value.error_dict
        assert 'End datetime must be after start datetime.' in str(exc_info.value.error_dict['end_datetime'])

    def test_create_event_with_end_equal_to_start_raises_validation_error(self):
        now = timezone.now()
        start = now + timedelta(days=1)
        with pytest.raises(ValidationError) as exc_info:
            Event.objects.create(
                name="Invalid Event",
                start_datetime=start,
                end_datetime=start
            )
        assert 'end_datetime' in exc_info.value.error_dict
        assert 'End datetime must be after start datetime.' in str(exc_info.value.error_dict['end_datetime'])

@pytest.mark.django_db
class TestEventSerializer:
    def test_serialize_event(self, sample_event):
        serializer = EventSerializer(sample_event)
        data = serializer.data

        assert data['name'] == sample_event.name
        assert data['start_datetime'] is not None
        assert data['end_datetime'] is not None
        assert data['location'] == sample_event.location
        assert data['notes'] == sample_event.notes

    def test_deserialize_event(self):
        now = timezone.now()
        data = {
            'name': 'New Event',
            'start_datetime': (now + timedelta(days=2)).isoformat(),
            'end_datetime': (now + timedelta(days=2, hours=3)).isoformat(),
            'location': 'New Location',
            'notes': 'New Notes'
        }
        serializer = EventSerializer(data=data)
        assert serializer.is_valid()
        event = serializer.save()
        assert event.name == data['name']
        assert event.location == data['location']
        assert event.notes == data['notes']

    def test_serializer_validation_error(self):
        data = {
            'name': '',
            'start_datetime': None,
            'end_datetime': None
        }
        serializer = EventSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors
        assert 'start_datetime' in serializer.errors
        assert 'end_datetime' in serializer.errors

    def test_serializer_optional_fields(self):
        now = timezone.now()
        data = {
            'name': 'Event Without Optional Fields',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=1)).isoformat()
        }
        serializer = EventSerializer(data=data)
        assert serializer.is_valid()
        event = serializer.save()
        assert event.name == data['name']
        assert event.location == ""
        assert event.notes == ""

    def test_serializer_validates_end_datetime_after_start_datetime(self):
        now = timezone.now()
        data = {
            'name': 'Valid Event',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=2)).isoformat()
        }
        serializer = EventSerializer(data=data)
        assert serializer.is_valid()

    def test_serializer_rejects_end_datetime_before_start_datetime(self):
        now = timezone.now()
        data = {
            'name': 'Invalid Event',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=-2)).isoformat()
        }
        serializer = EventSerializer(data=data)
        assert not serializer.is_valid()
        assert 'end_datetime' in serializer.errors
        assert 'End datetime must be after start datetime.' in str(serializer.errors['end_datetime'])

    def test_serializer_rejects_end_datetime_equal_to_start_datetime(self):
        now = timezone.now()
        start = (now + timedelta(days=1)).isoformat()
        data = {
            'name': 'Invalid Event',
            'start_datetime': start,
            'end_datetime': start
        }
        serializer = EventSerializer(data=data)
        assert not serializer.is_valid()
        assert 'end_datetime' in serializer.errors
        assert 'End datetime must be after start datetime.' in str(serializer.errors['end_datetime'])

    def test_serializer_validates_datetime_on_update(self, sample_event):
        now = timezone.now()
        # Try to update with invalid datetime range
        data = {
            'start_datetime': (now + timedelta(days=5)).isoformat(),
            'end_datetime': (now + timedelta(days=5, hours=-1)).isoformat()
        }
        serializer = EventSerializer(sample_event, data=data, partial=True)
        assert not serializer.is_valid()
        assert 'end_datetime' in serializer.errors

    def test_serializer_validates_datetime_on_partial_update(self, sample_event):
        now = timezone.now()
        # Try to update only end_datetime to be before start_datetime
        data = {
            'end_datetime': (sample_event.start_datetime - timedelta(hours=1)).isoformat()
        }
        serializer = EventSerializer(sample_event, data=data, partial=True)
        assert not serializer.is_valid()
        assert 'end_datetime' in serializer.errors

    def test_serializer_strips_html_from_name(self):
        # Test that HTML tags are stripped from name field
        now = timezone.now()
        data = {
            'name': '<script>alert("XSS")</script>Safe Event Name',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=2)).isoformat()
        }
        serializer = EventSerializer(data=data)
        assert serializer.is_valid()
        event = serializer.save()
        # Bleach removes HTML tags but preserves text content
        assert '<script>' not in event.name
        assert '</script>' not in event.name
        assert 'Safe Event Name' in event.name

    def test_serializer_strips_html_from_location(self):
        # Test that HTML tags are stripped from location field
        now = timezone.now()
        data = {
            'name': 'Test Event',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=2)).isoformat(),
            'location': '<img src="x" onerror="alert(1)">Safe location'
        }
        serializer = EventSerializer(data=data)
        assert serializer.is_valid()
        event = serializer.save()
        assert '<img' not in event.location
        assert 'onerror' not in event.location
        assert 'Safe location' in event.location

    def test_serializer_strips_html_from_notes(self):
        # Test that HTML tags are stripped from notes field
        now = timezone.now()
        data = {
            'name': 'Test Event',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=2)).isoformat(),
            'notes': '<div>Safe notes</div>'
        }
        serializer = EventSerializer(data=data)
        assert serializer.is_valid()
        event = serializer.save()
        assert '<div>' not in event.notes
        assert 'Safe notes' in event.notes

@pytest.mark.django_db
class TestEventAPI:
    def test_list_events(self, authenticated_staff_client, sample_event):
        url = reverse('event-list')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == sample_event.name

    def test_create_event(self, authenticated_manager_client):
        now = timezone.now()
        url = reverse('event-list')
        data = {
            'name': 'New API Event',
            'start_datetime': (now + timedelta(days=3)).isoformat(),
            'end_datetime': (now + timedelta(days=3, hours=2)).isoformat(),
            'location': 'API Location',
            'notes': 'Created via API'
        }
        assert Event.objects.count() == 0
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Event.objects.count() == 1
        event = Event.objects.first()
        assert event.name == data['name']
        assert event.location == data['location']
        assert event.notes == data['notes']

    def test_create_event_minimal_fields(self, authenticated_manager_client):
        now = timezone.now()
        url = reverse('event-list')
        data = {
            'name': 'Minimal API Event',
            'start_datetime': (now + timedelta(days=4)).isoformat(),
            'end_datetime': (now + timedelta(days=4, hours=1)).isoformat()
        }
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        event = Event.objects.first()
        assert event.name == data['name']
        assert event.location == ""
        assert event.notes == ""

    def test_retrieve_event(self, authenticated_staff_client, sample_event):
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == sample_event.name
        assert response.data['location'] == sample_event.location
        assert response.data['notes'] == sample_event.notes

    def test_retrieve_nonexistent_event(self, authenticated_staff_client):
        url = reverse('event-detail', kwargs={'pk': 999})
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_event(self, authenticated_manager_client, sample_event):
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        data = {'name': 'Updated Event Name'}
        response = authenticated_manager_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_event.refresh_from_db()
        assert sample_event.name == 'Updated Event Name'

    def test_update_event_full(self, authenticated_manager_client, sample_event):
        now = timezone.now()
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        data = {
            'name': 'Fully Updated Event',
            'start_datetime': (now + timedelta(days=5)).isoformat(),
            'end_datetime': (now + timedelta(days=5, hours=4)).isoformat(),
            'location': 'Updated Location',
            'notes': 'Updated Notes'
        }
        response = authenticated_manager_client.put(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_event.refresh_from_db()
        assert sample_event.name == data['name']
        assert sample_event.location == data['location']
        assert sample_event.notes == data['notes']

    def test_update_nonexistent_event(self, authenticated_manager_client):
        url = reverse('event-detail', kwargs={'pk': 999})
        response = authenticated_manager_client.patch(url, {'name': 'Does Not Exist'}, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_event(self, authenticated_manager_client, sample_event):
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        response = authenticated_manager_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Event.objects.count() == 0

    def test_filter_events(self, authenticated_staff_client, sample_event):
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'name': 'Test'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == sample_event.name

    def test_filter_no_results(self, authenticated_staff_client):
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'name': 'NothingHere'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_filter_by_location(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2),
            location="Main Hall"
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2),
            location="Side Room"
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'location': 'Main'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['location'] == "Main Hall"

    def test_filter_by_notes(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2),
            notes="Important meeting"
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2),
            notes="Regular check-in"
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'notes': 'Important'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['notes'] == "Important meeting"

    def test_filter_by_start_datetime_after(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Past Event",
            start_datetime=now - timedelta(days=2),
            end_datetime=now - timedelta(days=2) + timedelta(hours=2)
        )
        Event.objects.create(
            name="Future Event",
            start_datetime=now + timedelta(days=5),
            end_datetime=now + timedelta(days=5, hours=2)
        )
        url = reverse('event-list')
        filter_date = (now + timedelta(days=1)).isoformat()
        response = authenticated_staff_client.get(url, {'start_datetime_after': filter_date})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == "Future Event"

    def test_filter_by_start_datetime_before(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Past Event",
            start_datetime=now - timedelta(days=2),
            end_datetime=now - timedelta(days=2) + timedelta(hours=2)
        )
        Event.objects.create(
            name="Future Event",
            start_datetime=now + timedelta(days=5),
            end_datetime=now + timedelta(days=5, hours=2)
        )
        url = reverse('event-list')
        filter_date = (now + timedelta(days=1)).isoformat()
        response = authenticated_staff_client.get(url, {'start_datetime_before': filter_date})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == "Past Event"

    def test_filter_by_end_datetime_after(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=1)
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=3)
        )
        url = reverse('event-list')
        filter_date = (now + timedelta(days=2, hours=2)).isoformat()
        response = authenticated_staff_client.get(url, {'end_datetime_after': filter_date})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == "Event 2"

    def test_filter_by_end_datetime_before(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=1)
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=3)
        )
        url = reverse('event-list')
        filter_date = (now + timedelta(days=2, hours=2)).isoformat()
        response = authenticated_staff_client.get(url, {'end_datetime_before': filter_date})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == "Event 1"

    def test_filter_combined_filters(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Conference Event",
            start_datetime=now + timedelta(days=5),
            end_datetime=now + timedelta(days=5, hours=8),
            location="Main Hall",
            notes="Tech conference"
        )
        Event.objects.create(
            name="Workshop Event",
            start_datetime=now + timedelta(days=5),
            end_datetime=now + timedelta(days=5, hours=3),
            location="Side Room",
            notes="Training workshop"
        )
        Event.objects.create(
            name="Other Event",
            start_datetime=now + timedelta(days=10),
            end_datetime=now + timedelta(days=10, hours=2),
            location="Main Hall",
            notes="Other event"
        )
        url = reverse('event-list')
        filter_date = (now + timedelta(days=6)).isoformat()
        response = authenticated_staff_client.get(url, {
            'location': 'Main',
            'start_datetime_before': filter_date
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == "Conference Event"

    def test_search_events_by_name(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Python Workshop",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        Event.objects.create(
            name="JavaScript Conference",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=3)
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'search': 'Python'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert 'Python' in response.data['results'][0]['name']

    def test_search_events_by_location(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2),
            location="Conference Center"
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2),
            location="Training Room"
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'search': 'Conference'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['location'] == "Conference Center"

    def test_search_events_by_notes(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2),
            notes="Quarterly review meeting"
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2),
            notes="Team building activity"
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'search': 'review'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert 'review' in response.data['results'][0]['notes'].lower()

    def test_search_events_no_results(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'search': 'NonexistentTerm'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 0
        assert response.data['results'] == []

    def test_order_events_by_name(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Zebra Event",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        Event.objects.create(
            name="Alpha Event",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2)
        )
        Event.objects.create(
            name="Beta Event",
            start_datetime=now + timedelta(days=3),
            end_datetime=now + timedelta(days=3, hours=2)
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'ordering': 'name'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['name'] == "Alpha Event"
        assert response.data['results'][1]['name'] == "Beta Event"
        assert response.data['results'][2]['name'] == "Zebra Event"

    def test_order_events_by_start_datetime(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 3",
            start_datetime=now + timedelta(days=3),
            end_datetime=now + timedelta(days=3, hours=2)
        )
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2)
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'ordering': 'start_datetime'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['name'] == "Event 1"
        assert response.data['results'][1]['name'] == "Event 2"
        assert response.data['results'][2]['name'] == "Event 3"

    def test_order_events_by_start_datetime_descending(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        Event.objects.create(
            name="Event 3",
            start_datetime=now + timedelta(days=3),
            end_datetime=now + timedelta(days=3, hours=2)
        )
        Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2)
        )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url, {'ordering': '-start_datetime'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['name'] == "Event 3"
        assert response.data['results'][1]['name'] == "Event 2"
        assert response.data['results'][2]['name'] == "Event 1"

    @pytest.mark.parametrize("invalid_payload", [
        {},
        {'name': '', 'start_datetime': '2024-01-01T10:00:00Z'},
        {'name': 'Test', 'start_datetime': None, 'end_datetime': None},
        {'name': 'Test', 'start_datetime': '2024-01-01T10:00:00Z'},
    ])
    def test_create_event_invalid_data(self, authenticated_manager_client, invalid_payload):
        url = reverse('event-list')
        response = authenticated_manager_client.post(url, invalid_payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_event_with_invalid_datetime_range_via_api(self, authenticated_manager_client):
        now = timezone.now()
        url = reverse('event-list')
        data = {
            'name': 'Invalid Event',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=-2)).isoformat()
        }
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'end_datetime' in response.data
        assert 'End datetime must be after start datetime.' in str(response.data['end_datetime'])

    def test_create_event_with_equal_datetimes_via_api(self, authenticated_manager_client):
        now = timezone.now()
        start = (now + timedelta(days=1)).isoformat()
        url = reverse('event-list')
        data = {
            'name': 'Invalid Event',
            'start_datetime': start,
            'end_datetime': start
        }
        response = authenticated_manager_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'end_datetime' in response.data

    def test_update_event_with_invalid_datetime_range_via_api(self, authenticated_manager_client, sample_event):
        now = timezone.now()
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        data = {
            'start_datetime': (now + timedelta(days=5)).isoformat(),
            'end_datetime': (now + timedelta(days=5, hours=-1)).isoformat()
        }
        response = authenticated_manager_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'end_datetime' in response.data

    def test_update_event_end_datetime_before_start_via_api(self, authenticated_manager_client, sample_event):
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        data = {
            'end_datetime': (sample_event.start_datetime - timedelta(hours=1)).isoformat()
        }
        response = authenticated_manager_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'end_datetime' in response.data

    def test_pagination_metadata(self, authenticated_staff_client):
        # Create multiple events
        now = timezone.now()
        for i in range(15):
            Event.objects.create(
                name=f"Event {i}",
                start_datetime=now + timedelta(days=i+1),
                end_datetime=now + timedelta(days=i+1, hours=2),
                location="Test Location",
                notes="Test Notes"
            )
        url = reverse('event-list')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'count' in response.data
        assert 'results' in response.data
        assert response.data['count'] == 15

        assert len(response.data['results']) == settings.REST_FRAMEWORK['PAGE_SIZE']

    def test_staff_cannot_create_event(self, authenticated_staff_client):
        now = timezone.now()
        url = reverse('event-list')
        data = {
            'name': 'Unauthorized Event',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=1, hours=2)).isoformat()
        }
        response = authenticated_staff_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_cannot_update_event(self, authenticated_staff_client, sample_event):
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        data = {'name': 'Unauthorized Update'}
        response = authenticated_staff_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_cannot_delete_event(self, authenticated_staff_client, sample_event):
        url = reverse('event-detail', kwargs={'pk': sample_event.pk})
        response = authenticated_staff_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access_events(self, api_client):
        url = reverse('event-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_current_future_events_endpoint_returns_only_future_events(self, authenticated_staff_client):
        now = timezone.now()
        # Create past event
        past_event = Event.objects.create(
            name="Past Event",
            start_datetime=now - timedelta(days=2),
            end_datetime=now - timedelta(days=2) + timedelta(hours=2)
        )
        # Create current event (ends in future)
        current_event = Event.objects.create(
            name="Current Event",
            start_datetime=now - timedelta(hours=1),
            end_datetime=now + timedelta(hours=1)
        )
        # Create future event
        future_event = Event.objects.create(
            name="Future Event",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        url = reverse('current-future-events')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        event_names = [event['name'] for event in response.data]
        assert 'Past Event' not in event_names
        assert 'Current Event' in event_names
        assert 'Future Event' in event_names

    def test_current_future_events_ordered_by_start_datetime(self, authenticated_staff_client):
        now = timezone.now()
        # Create events in reverse order
        event3 = Event.objects.create(
            name="Event 3",
            start_datetime=now + timedelta(days=3),
            end_datetime=now + timedelta(days=3, hours=2)
        )
        event1 = Event.objects.create(
            name="Event 1",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        event2 = Event.objects.create(
            name="Event 2",
            start_datetime=now + timedelta(days=2),
            end_datetime=now + timedelta(days=2, hours=2)
        )
        url = reverse('current-future-events')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        assert response.data[0]['name'] == "Event 1"
        assert response.data[1]['name'] == "Event 2"
        assert response.data[2]['name'] == "Event 3"

    def test_current_future_events_includes_events_ending_now(self, authenticated_staff_client):
        now = timezone.now()
        # Create event that ends at or after now (use small buffer to account for timing between test setup and query)
        event_ending_now = Event.objects.create(
            name="Event Ending Now",
            start_datetime=now - timedelta(hours=2),
            end_datetime=now + timedelta(seconds=1)
        )
        url = reverse('current-future-events')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == "Event Ending Now"

    def test_current_future_events_excludes_events_ending_in_past(self, authenticated_staff_client):
        now = timezone.now()
        # Create event that ended in the past
        past_event = Event.objects.create(
            name="Past Event",
            start_datetime=now - timedelta(days=2),
            end_datetime=now - timedelta(days=1)
        )
        url = reverse('current-future-events')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_current_future_events_requires_authentication(self, api_client):
        url = reverse('current-future-events')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_current_future_events_accessible_by_staff(self, authenticated_staff_client):
        now = timezone.now()
        Event.objects.create(
            name="Future Event",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        url = reverse('current-future-events')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_current_future_events_accessible_by_manager(self, authenticated_manager_client):
        now = timezone.now()
        Event.objects.create(
            name="Future Event",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2)
        )
        url = reverse('current-future-events')
        response = authenticated_manager_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_current_future_events_returns_empty_list_when_no_future_events(self, authenticated_staff_client):
        now = timezone.now()
        # Create only past events
        Event.objects.create(
            name="Past Event 1",
            start_datetime=now - timedelta(days=2),
            end_datetime=now - timedelta(days=1)
        )
        Event.objects.create(
            name="Past Event 2",
            start_datetime=now - timedelta(days=5),
            end_datetime=now - timedelta(days=4)
        )
        url = reverse('current-future-events')
        response = authenticated_staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
        assert response.data == []