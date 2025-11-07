from django.db import models

class Event(models.Model):
  name = models.CharField(max_length=200)
  start_datetime = models.DateTimeField()
  end_datetime = models.DateTimeField()
  location = models.CharField(max_length=200, blank=True, default='')
  notes = models.TextField(blank=True, default='')

  def __str__(self):
    return f"Name: {self.name}"

  class Meta:
    ordering = ['start_datetime']
