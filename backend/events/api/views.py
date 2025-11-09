from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django_filters import rest_framework as filters
from django.utils import timezone
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

class CurrentFutureEventsView(APIView):
    permission_classes = [IsManagerOrStaffReadOnly]
    
    def get(self, request, *args, **kwargs):
        now = timezone.now()
        events = Event.objects.filter(end_datetime__gte=now).order_by('start_datetime')
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

