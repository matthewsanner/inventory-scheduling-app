from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework import status
from rest_framework.response import Response
from django_filters import rest_framework as filters
from ..models import ItemBooking
from .serializers import ItemBookingSerializer
from core.permissions import IsManagerOrStaffReadOnly

class ItemBookingFilter(filters.FilterSet):
  item = filters.NumberFilter(field_name='item', lookup_expr='exact')
  event = filters.NumberFilter(field_name='event', lookup_expr='exact')

  class Meta:
    model = ItemBooking
    fields = ['item', 'event']

class ItemBookingViewSet(ModelViewSet):
  queryset = ItemBooking.objects.all()
  serializer_class = ItemBookingSerializer
  filterset_class = ItemBookingFilter
  permission_classes = [IsManagerOrStaffReadOnly]

  def create(self, request, *args, **kwargs):
    try:
      return super().create(request, *args, **kwargs)
    except DRFValidationError as e:
      # DRF converts IntegrityError to ValidationError with default message
      # Check if this is the default unique constraint error message
      if isinstance(e.detail, dict):
        for messages in e.detail.values():
          msg_list = messages if isinstance(messages, list) else [messages]
          if any(getattr(msg, 'code', None) == 'unique_item_event' for msg in msg_list):
            return Response({
              'event': ['This item is already booked for this event.']
            }, status=status.HTTP_400_BAD_REQUEST)
      # Re-raise if it's a different ValidationError
      raise

