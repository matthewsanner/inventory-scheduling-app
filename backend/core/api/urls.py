from rest_framework.routers import DefaultRouter
from items.api.urls import item_router
from django.urls import path, include

router = DefaultRouter()
# extend router for each app
router.registry.extend(item_router.registry)

urlpatterns = [
  path('', include(router.urls))
]