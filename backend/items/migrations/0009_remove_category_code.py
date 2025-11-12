# Generated manually to remove code field from Category

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('items', '0008_convert_item_category_to_foreignkey'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='category',
            name='code',
        ),
        migrations.AlterField(
            model_name='category',
            name='name',
            field=models.CharField(max_length=200, unique=True),
        ),
    ]

