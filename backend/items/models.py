from django.db import models

class Item(models.Model):
  CATEGORY_CHOICES = [
    ('ACC', 'Accessories'),
    ('APP', 'Apparatus'),
    ('APA', 'Apparatus Accessories'),
    ('BAC', 'Backpacks'),
    ('BEL', 'Belts'),
    ('BOD', 'Bodysuits'),
    ('BOO', 'Bootyshorts'),
    ('BUS', 'Bustles'),
    ('CAP', 'Capes'),
    ('COR', 'Corset'),
    ('COS', 'Costumes'),
    ('CRO', 'Crowns'),
    ('CUM', 'Cumberbunds'),
    ('DEC', 'Decor'),
    ('DRE', 'Dresses'),
    ('ELE', 'Electronics'),
    ('GAR', 'Garden'),
    ('GLO', 'Gloves'),
    ('HAI', 'Hair Accessories'),
    ('HAL', 'Halloween Accessories'),
    ('HAT', 'Hats'),
    ('HEA', 'Headdresses'),
    ('JAC', 'Jackets'),
    ('JEW', 'Jewelry'),
    ('LED', 'LED'),
    ('LEG', 'Leggings'),
    ('MAS', 'Masks'),
    ('MIR', 'Mirror'),
    ('NEC', 'Necklaces'),
    ('PAD', 'Padding'),
    ('PAN', 'Pants'),
    ('PAS', 'Pantsuits'),
    ('PRO', 'Props'),
    ('RUF', 'Ruffles'),
    ('SHI', 'Shirts'),
    ('SHO', 'Shoes'),
    ('SHT', 'Shorts'),
    ('SHR', 'Shrugs'),
    ('SIG', 'Signage'),
    ('SKA', 'Skate Covers'),
    ('SKI', 'Skirts'),
    ('STE', 'Steampunk Accessories'),
    ('STI', 'Stilts'),
    ('STO', 'Stoles'),
    ('TAB', 'Table Skirts'),
    ('TIA', 'Tiaras'),
    ('TIE', 'Ties'),
    ('TIG', 'Tights'),
    ('TRA', 'Tracksuits'),
    ('TRY', 'Trays'),
    ('TUT', 'Tutus'),
    ('TWE', 'Twenties'),
    ('UNS', 'Undershirts'),
    ('UNT', 'Undertard'),
    ('UNI', 'Unitard'),
    ('VES', 'Vests'),
    ('WIG', 'Wigs'),
    ('MIS', 'Miscellaneous')
  ]

  name = models.CharField(max_length=200)
  description = models.CharField(max_length=2000, blank=True)
  quantity = models.PositiveSmallIntegerField(default=1)
  image = models.CharField(blank=True, null=True, default="/box.png") # may want to change this later
  category = models.CharField(max_length=4, choices=CATEGORY_CHOICES, blank=True)
  color = models.CharField(max_length=50, blank=True)
  location = models.CharField(max_length=200, blank=True)

  def __str__(self):
    return f"Name: {self.name}"

  class Meta:
    ordering = ['id']