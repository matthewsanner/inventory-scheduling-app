from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemBookingViewSet

itembooking_router = DefaultRouter()
itembooking_router.register(r'', ItemBookingViewSet)

urlpatterns = [
    path('', include(itembooking_router.urls)),
]

