from rest_framework.serializers import ModelSerializer, CharField
from ..models import Item

class ItemSerializer(ModelSerializer):
  category_long = CharField(source='get_category_display', read_only=True)

  class Meta:
    model = Item
    fields = '__all__'