from rest_framework.serializers import ModelSerializer
from ..models import Item, Category

class CategorySerializer(ModelSerializer):
  class Meta:
    model = Category
    fields = ['id', 'name']

class ItemSerializer(ModelSerializer):
  class Meta:
    model = Item
    fields = '__all__'
  
  def to_representation(self, instance):
    # Override to return nested category object including name instead of just ID
    representation = super().to_representation(instance)
    if instance.category:
      representation['category'] = CategorySerializer(instance.category).data
    else:
      representation['category'] = None
    return representation
  
  def to_internal_value(self, data):
    # Handle category input- frontend sends integer or null, but handle empty strings defensively
    if 'category' in data and data['category'] == '':
      data = data.copy()  # Make a mutable copy
      data['category'] = None
    return super().to_internal_value(data)