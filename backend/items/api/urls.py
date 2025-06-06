from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, CategoryChoicesView

item_router = DefaultRouter()
item_router.register(r'', ItemViewSet)

urlpatterns = [
    path('categories/', CategoryChoicesView.as_view(), name='category-choices'),
    path('', include(item_router.urls)),
]