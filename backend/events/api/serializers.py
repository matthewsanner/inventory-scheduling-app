from rest_framework.serializers import ModelSerializer, ValidationError
from ..models import Event

class EventSerializer(ModelSerializer):
  class Meta:
    model = Event
    fields = '__all__'

  def validate(self, data):
    start_datetime = data.get('start_datetime')
    end_datetime = data.get('end_datetime')
    
    # If updating, use existing values if not provided
    if self.instance:
      start_datetime = start_datetime if 'start_datetime' in data else self.instance.start_datetime
      end_datetime = end_datetime if 'end_datetime' in data else self.instance.end_datetime
    
    if start_datetime and end_datetime:
      if end_datetime <= start_datetime:
        raise ValidationError({
          'end_datetime': 'End datetime must be after start datetime.'
        })
    
    return data

