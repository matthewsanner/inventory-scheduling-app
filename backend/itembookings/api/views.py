from rest_framework.viewsets import ModelViewSet
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

