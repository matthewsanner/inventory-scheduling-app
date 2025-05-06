from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Item
from .serializers import ItemSerializer

class ItemViewSet(ModelViewSet):
  queryset = Item.objects.all()
  serializer_class = ItemSerializer

class CategoryChoicesView(APIView):
    def get(self, request, *args, **kwargs):
        categories = [{"value": c[0], "label": c[1]} for c in Item.CATEGORY_CHOICES]
        return Response(categories, status=status.HTTP_200_OK)
