from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet

event_router = DefaultRouter()
event_router.register(r'', EventViewSet)

urlpatterns = [
    path('', include(event_router.urls)),
]

