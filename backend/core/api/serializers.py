from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    is_manager = serializers.SerializerMethodField()
    is_staff = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'groups', 'is_manager', 'is_staff']
        read_only_fields = ['id', 'username', 'email', 'is_superuser', 'groups', 'is_manager', 'is_staff']
    
    def get_groups(self, obj):
        return [group.name for group in obj.groups.all()]
    
    def get_is_manager(self, obj):
        return obj.groups.filter(name='Manager').exists()
    
    def get_is_staff(self, obj):
        return obj.groups.filter(name='Staff').exists()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'username': {'required': True},
            'password': {'required': True},
            'email': {'required': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        # Create user with only 'active' permission, no groups, no staff, no superuser
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )
        # Ensure no groups are assigned
        user.groups.clear()
        return user

