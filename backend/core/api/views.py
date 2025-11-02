from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    # Custom login view that returns JWT tokens along with user information
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            try:
                # Get the user from the token
                username = request.data.get('username')
                user = User.objects.get(username=username)
                
                # Add user information to the response
                user_serializer = UserSerializer(user)
                response.data['user'] = user_serializer.data
            except User.DoesNotExist:
                # If user doesn't exist, return response without user data
                pass
        
        return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    # Get current authenticated user information
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    # Logout endpoint
    # Since JWT tokens are stateless, logout is handled client-side by discarding tokens
    # This endpoint provides a way for the client to confirm logout
    # If blacklisting was implemented, this endpoint would revoke the refresh token
    return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)

