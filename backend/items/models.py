from django.db import models

class Category(models.Model):
  name = models.CharField(max_length=200, unique=True)

  def __str__(self):
    return self.name

  class Meta:
    ordering = ['name']
    verbose_name_plural = 'Categories'

class Item(models.Model):
  name = models.CharField(max_length=200)
  description = models.CharField(max_length=2000, blank=True)
  quantity = models.PositiveSmallIntegerField(default=1)
  image = models.CharField(blank=True, null=True, default="/box.png") # may want to change this later
  category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
  color = models.CharField(max_length=50, blank=True)
  location = models.CharField(max_length=200, blank=True)

  def __str__(self):
    return f"Name: {self.name}"

  class Meta:
    ordering = ['id']