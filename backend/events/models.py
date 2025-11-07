from django.db import models
from django.core.exceptions import ValidationError

class Event(models.Model):
  name = models.CharField(max_length=200)
  start_datetime = models.DateTimeField()
  end_datetime = models.DateTimeField()
  location = models.CharField(max_length=200, blank=True, default='')
  notes = models.TextField(blank=True, default='')

  def clean(self):
    super().clean()
    if self.start_datetime and self.end_datetime:
      if self.end_datetime <= self.start_datetime:
        raise ValidationError({
          'end_datetime': 'End datetime must be after start datetime.'
        })

  def save(self, *args, **kwargs):
    self.full_clean()
    super().save(*args, **kwargs)

  def __str__(self):
    return f"Name: {self.name}"

  class Meta:
    ordering = ['start_datetime']
