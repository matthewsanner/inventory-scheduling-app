# Generated manually for data migration

from django.db import migrations

# Keep this in sync with Item.CATEGORY_CHOICES until migration is complete
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

def populate_categories(apps, schema_editor):
    Category = apps.get_model('items', 'Category')
    for code, name in CATEGORY_CHOICES:
        Category.objects.get_or_create(code=code, defaults={'name': name})

def reverse_populate_categories(apps, schema_editor):
    Category = apps.get_model('items', 'Category')
    Category.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('items', '0006_category'),
    ]

    operations = [
        migrations.RunPython(populate_categories, reverse_populate_categories),
    ]

