from rest_framework.serializers import ModelSerializer, ValidationError
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
import bleach
import re
from ..models import Item, Category

class CategorySerializer(ModelSerializer):
  class Meta:
    model = Category
    fields = ['id', 'name']
  
  def to_internal_value(self, data):
    data = data.copy()  # Make a mutable copy to avoid mutating original input
    # Sanitize HTML from name field
    if 'name' in data and data['name']:
      # Strip all HTML tags and attributes
      data['name'] = bleach.clean(data['name'], tags=[], strip=True)
    return super().to_internal_value(data)

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
    data = data.copy()  # Make a mutable copy to avoid mutating original input
    # Handle category input- frontend sends integer or null, but handle empty strings defensively
    if 'category' in data and data['category'] == '':
      data['category'] = None
    
    # Sanitize HTML from text fields
    text_fields = ['name', 'description', 'color', 'location']
    for field in text_fields:
      if field in data and data[field]:
        # Strip all HTML tags and attributes
        data[field] = bleach.clean(data[field], tags=[], strip=True)
    
    # Validate and sanitize image URL
    if 'image' in data and data['image']:
      image_url = data['image'].strip()
      if image_url:  # Only validate if not empty
        # Allow relative URLs (starting with /) for local images
        if image_url.startswith('/'):
          # Reject any protocol-like patterns in relative URLs (no colons allowed)
          if ':' in image_url:
            raise ValidationError({
              'image': 'Image URL contains invalid characters.'
            })
          # Basic path validation - reject parent directory traversal
          # Use regex to only reject .. when it appears as a complete path segment
          if re.search(r'(^|/)\.\.($|/)', image_url):
            raise ValidationError({
              'image': 'Image URL contains invalid path characters.'
            })
        # For absolute URLs, only allow http:// and https://
        elif not (image_url.startswith('http://') or image_url.startswith('https://')):
          raise ValidationError({
            'image': 'Image URL must use http://, https:// protocol, or be a relative path starting with /.'
          })
        # Validate absolute URL format if it's not a relative URL
        if not image_url.startswith('/'):
          validator = URLValidator()
          try:
            validator(image_url)
          except DjangoValidationError:
            raise ValidationError({
              'image': 'Please enter a valid URL.'
            })
        data['image'] = image_url
    
    return super().to_internal_value(data)