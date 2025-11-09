from rest_framework.serializers import ModelSerializer, ValidationError, CharField, DateTimeField
from django.core.exceptions import ValidationError as DjangoValidationError
from ..models import ItemBooking

class ItemBookingSerializer(ModelSerializer):
  item_name = CharField(source='item.name', read_only=True)
  event_name = CharField(source='event.name', read_only=True)
  event_start_datetime = DateTimeField(source='event.start_datetime', read_only=True)
  event_end_datetime = DateTimeField(source='event.end_datetime', read_only=True)

  class Meta:
    model = ItemBooking
    fields = '__all__'

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    # Make item and event read-only when updating (instance exists)
    if self.instance is not None:
      self.fields['item'].read_only = True
      self.fields['event'].read_only = True

  def validate(self, data):
    # Check for overbooking
    item = data.get("item") or getattr(self.instance, "item", None)
    event = data.get("event") or getattr(self.instance, "event", None)
    quantity = data.get("quantity") or getattr(self.instance, "quantity", 1)
    
    if item and event:
      exclude_pk = self.instance.pk if self.instance else None
      try:
        ItemBooking.validate_overbooking(item, event, quantity, exclude_pk)
      except DjangoValidationError as e:
        # Convert Django ValidationError to DRF ValidationError
        raise ValidationError(e.error_dict)

    return data