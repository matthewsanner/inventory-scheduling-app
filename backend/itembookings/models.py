from django.db import models
from django.core.exceptions import ValidationError
from items.models import Item
from events.models import Event

class ItemBooking(models.Model):
  item = models.ForeignKey(Item, on_delete=models.CASCADE, db_index=True)
  event = models.ForeignKey(Event, on_delete=models.CASCADE, db_index=True)
  quantity = models.PositiveSmallIntegerField(default=1)
  created_at = models.DateTimeField(auto_now_add=True)

  @staticmethod
  def validate_overbooking(item, event, quantity, exclude_pk=None):
    """
    Validates that booking the specified quantity for the given item and event
    does not exceed available quantity when considering overlapping bookings.
    
    Args:
      item: The Item instance to book
      event: The Event instance to book for
      quantity: The quantity to book
      exclude_pk: Optional primary key to exclude from overlap check (for updates)
    
    Raises:
      ValidationError: If the booking would exceed available quantity
    """
    if not item or not event:
      return

    # Find all bookings for this same item with overlapping events
    overlapping_bookings = ItemBooking.objects.filter(
      item=item,
      event__start_datetime__lt=event.end_datetime,
      event__end_datetime__gt=event.start_datetime,
    )

    # Exclude this instance if updating
    if exclude_pk:
      overlapping_bookings = overlapping_bookings.exclude(pk=exclude_pk)

    # Total quantity already booked in overlapping events
    total_booked = overlapping_bookings.aggregate(
      total=models.Sum('quantity')
    )['total'] or 0

    # Check available quantity
    available = item.quantity - total_booked
    if quantity > available:
      raise ValidationError({
        'quantity': f'Cannot book {quantity} items. Only {available} available for this time period.'
      })

  def clean(self):
    super().clean()
    self.validate_overbooking(self.item, self.event, self.quantity, self.pk)

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

