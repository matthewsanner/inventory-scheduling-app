from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError as DjangoValidationError
import bleach

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
    
    def to_internal_value(self, data):
        data = data.copy()  # Make a mutable copy to avoid mutating original input
        # Sanitize HTML from text fields
        text_fields = ['first_name', 'last_name']
        for field in text_fields:
            if field in data and data[field]:
                # Strip all HTML tags and attributes
                data[field] = bleach.clean(data[field], tags=[], strip=True)
        
        # Validate email format
        if 'email' in data and data['email']:
            email_validator = EmailValidator()
            try:
                email_validator(data['email'])
            except DjangoValidationError:
                raise serializers.ValidationError({
                    'email': 'Please enter a valid email address.'
                })
        
        return super().to_internal_value(data)
    
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

