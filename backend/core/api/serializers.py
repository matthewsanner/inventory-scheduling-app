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

