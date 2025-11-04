from rest_framework.routers import DefaultRouter
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, current_user, logout, register

router = DefaultRouter()

urlpatterns = [
  path('items/', include('items.api.urls')),
  path('auth/register/', register, name='register'),
  path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  path('auth/me/', current_user, name='current_user'),
  path('auth/logout/', logout, name='logout'),
]