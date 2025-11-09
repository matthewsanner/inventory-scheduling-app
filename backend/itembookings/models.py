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
    total_booked = overlapping_bookings.aggregate(
      total=models.Sum('quantity')
    )['total'] or 0

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

