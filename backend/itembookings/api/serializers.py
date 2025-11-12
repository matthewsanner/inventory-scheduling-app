from rest_framework.serializers import ModelSerializer, ValidationError, CharField, DateTimeField
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
    # Make item and event read-only when updating
    if self.instance is not None:
      self.fields['item'].read_only = True
      self.fields['event'].read_only = True

  def validate(self, data):
    # Check for overbooking- do validation directly in serializer
    item = data.get("item") or getattr(self.instance, "item", None)
    event = data.get("event") or getattr(self.instance, "event", None)
    quantity = data.get("quantity") or getattr(self.instance, "quantity", 1)
    
    if item and event:
      exclude_pk = self.instance.pk if self.instance else None
      
      # Perform overbooking validation directly
      from django.db.models import Sum
      overlapping_bookings = ItemBooking.objects.filter(
        item=item,
        event__start_datetime__lt=event.end_datetime,
        event__end_datetime__gt=event.start_datetime,
      )
      
      if exclude_pk:
        overlapping_bookings = overlapping_bookings.exclude(pk=exclude_pk)
      
      total_booked = overlapping_bookings.aggregate(
        total=Sum('quantity')
      )['total'] or 0
      
      available = item.quantity - total_booked
      if quantity > available:
        # Raise DRF ValidationError directly with string
        raise ValidationError({
          'quantity': f'Cannot book {quantity} items. Only {available} available for this time period.'
        })
    
    return data