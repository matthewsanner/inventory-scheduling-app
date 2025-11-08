from django.db import models
from django.core.exceptions import ValidationError
from items.models import Item
from events.models import Event

class ItemBooking(models.Model):
  item = models.ForeignKey(Item, on_delete=models.CASCADE, db_index=True)
  event = models.ForeignKey(Event, on_delete=models.CASCADE, db_index=True)
  quantity = models.PositiveSmallIntegerField(default=1)
  created_at = models.DateTimeField(auto_now_add=True)

  def clean(self):
    super().clean()
    # Check for overbooking
    if self.item and self.event:
      # Get all existing bookings for this item
      existing_bookings = ItemBooking.objects.filter(item=self.item).exclude(pk=self.pk if self.pk else None)
      
      # Check if any existing booking's event overlaps with this event
      total_booked = 0
      for booking in existing_bookings:
        # Check if events overlap
        # Events overlap if new_start < existing_end AND new_end > existing_start
        if (self.event.start_datetime < booking.event.end_datetime and 
            self.event.end_datetime > booking.event.start_datetime):
          total_booked += booking.quantity
      
      # Check if adding this booking would exceed item quantity
      if total_booked + self.quantity > self.item.quantity:
        raise ValidationError({
          'quantity': f'Cannot book {self.quantity} items. Only {self.item.quantity - total_booked} available for this time period.'
        })

  def clean(self):
    super().clean()

    # Ensure both item and event exist before validation
    if not self.item or not self.event:
      return

    # Find all bookings for this same item
    overlapping_bookings = ItemBooking.objects.filter(
      item=self.item,
      event__start_datetime__lt=self.event.end_datetime,
      event__end_datetime__gt=self.event.start_datetime,
    )

    # Exclude this instance if updating
    if self.pk:
      overlapping_bookings = overlapping_bookings.exclude(pk=self.pk)

    # Total quantity already booked in overlapping events
    total_booked = sum(b.quantity for b in overlapping_bookings)

    # Check available quantity
    available = self.item.quantity - total_booked
    if self.quantity > available:
      raise ValidationError({
        'quantity': f'Cannot book {self.quantity} items. Only {available} available for this time period.'
      })

  def save(self, *args, **kwargs):
    self.full_clean()
    super().save(*args, **kwargs)

  def __str__(self):
    return f"{self.item.name} - {self.event.name} ({self.quantity})"

  class Meta:
    constraints = [
      models.UniqueConstraint(
          fields=["item", "event"],
          name="unique_item_event"
      )
    ]
    ordering = ["-created_at"]

