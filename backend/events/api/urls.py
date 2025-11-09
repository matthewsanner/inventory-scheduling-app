from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, CurrentFutureEventsView

event_router = DefaultRouter()
event_router.register(r'', EventViewSet)

urlpatterns = [
    path('current-future/', CurrentFutureEventsView.as_view(), name='current-future-events'),
    path('', include(event_router.urls)),
]

