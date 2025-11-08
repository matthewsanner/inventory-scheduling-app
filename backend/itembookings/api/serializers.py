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
      overlapping_bookings = ItemBooking.objects.filter(
        item=item,
        event__start_datetime__lt=event.end_datetime,
        event__end_datetime__gt=event.start_datetime,
      )
    if self.instance:
        overlapping_bookings = overlapping_bookings.exclude(pk=self.instance.pk)

    total_booked = sum(b.quantity for b in overlapping_bookings)

    if total_booked + quantity > item.quantity:
      raise ValidationError({
          "quantity": f"Cannot book {quantity} items. Only {item.quantity - total_booked} available for this time period."
      })

    return data