from django.db import models

class Event(models.Model):
  name = models.CharField(max_length=200)
  start_datetime = models.DateTimeField()
  end_datetime = models.DateTimeField()
  location = models.CharField(max_length=200, blank=True)
  notes = models.TextField(blank=True)

  def __str__(self):
    return f"Name: {self.name}"

  class Meta:
    ordering = ['id']
