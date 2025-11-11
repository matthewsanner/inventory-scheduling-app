from rest_framework.serializers import ModelSerializer, CharField
from ..models import Item, Category

class CategorySerializer(ModelSerializer):
  class Meta:
    model = Category
    fields = ['id', 'name']

class ItemSerializer(ModelSerializer):
  category_long = CharField(source='category.name', read_only=True)

  class Meta:
    model = Item
    fields = '__all__'
  
  def to_internal_value(self, data):
    # Handle category input - ensure empty strings become None
    if 'category' in data:
      category_value = data['category']
      if not category_value:
        data = data.copy()  # Make a mutable copy
        data['category'] = None
    return super().to_internal_value(data)