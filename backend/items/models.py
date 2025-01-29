from django.db import models

# Create your models here.
class Item(models.Model):
  name = models.CharField(max_length=200)
  description = models.CharField(max_length=2000)
  quantity = models.IntegerField()

  def __str__(self):
    return f"Name: {self.name}"