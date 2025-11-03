from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django_filters import rest_framework as filters
from ..models import Item
from .serializers import ItemSerializer
from core.permissions import IsManagerOrStaffReadOnly
from rest_framework.permissions import IsAuthenticated

class ItemFilter(filters.FilterSet):
    name = filters.CharFilter(lookup_expr='icontains')
    category = filters.CharFilter()
    color = filters.CharFilter(lookup_expr='icontains')
    location = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Item
        fields = ['name', 'category', 'color', 'location']

class ItemViewSet(ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    filterset_class = ItemFilter
    search_fields = ['name', 'description', 'color', 'location']
    ordering_fields = ['name', 'category', 'quantity', 'color', 'location']
    permission_classes = [IsManagerOrStaffReadOnly]

class CategoryChoicesView(APIView):
    permission_classes = [IsManagerOrStaffReadOnly]
    
    def get(self, request, *args, **kwargs):
        categories = [{"value": c[0], "label": c[1]} for c in Item.CATEGORY_CHOICES]
        return Response(categories, status=status.HTTP_200_OK)
