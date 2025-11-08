from rest_framework.viewsets import ModelViewSet
from ..models import ItemBooking
from .serializers import ItemBookingSerializer
from core.permissions import IsManagerOrStaffReadOnly

class ItemBookingViewSet(ModelViewSet):
  queryset = ItemBooking.objects.all()
  serializer_class = ItemBookingSerializer
  permission_classes = [IsManagerOrStaffReadOnly]

