from rest_framework.viewsets import ModelViewSet
from django_filters import rest_framework as filters
from ..models import Event
from .serializers import EventSerializer
from core.permissions import IsManagerOrStaffReadOnly

class EventFilter(filters.FilterSet):
    name = filters.CharFilter(lookup_expr='icontains')
    location = filters.CharFilter(lookup_expr='icontains')
    notes = filters.CharFilter(lookup_expr='icontains')
    start_datetime = filters.DateTimeFromToRangeFilter()
    end_datetime = filters.DateTimeFromToRangeFilter()

    class Meta:
        model = Event
        fields = ['name', 'location', 'notes', 'start_datetime', 'end_datetime']

class EventViewSet(ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filterset_class = EventFilter
    search_fields = ['name', 'notes', 'location']
    ordering_fields = ['name', 'start_datetime', 'end_datetime', 'location']
    permission_classes = [IsManagerOrStaffReadOnly]

