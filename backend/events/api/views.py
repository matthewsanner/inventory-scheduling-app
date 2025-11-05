from rest_framework.viewsets import ModelViewSet
from ..models import Event
from .serializers import EventSerializer
from core.permissions import IsManagerOrStaffReadOnly

class EventViewSet(ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsManagerOrStaffReadOnly]

