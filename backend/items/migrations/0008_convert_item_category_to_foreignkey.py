# Generated manually for data migration

from django.db import migrations, models
import django.db.models.deletion

def convert_category_codes_to_foreignkeys(apps, schema_editor):
    Item = apps.get_model('items', 'Item')
    Category = apps.get_model('items', 'Category')
    
    # Convert each item's category code to a ForeignKey reference
    # At this point, both 'category' (CharField) and 'category_new' (ForeignKey) exist
    for item in Item.objects.all():
        old_category_code = item.category  # This is the old CharField
        if old_category_code:
            try:
                category = Category.objects.get(code=old_category_code)
                # Set the new category_new ForeignKey field
                item.category_new = category
                item.save()
            except Category.DoesNotExist:
                # If category doesn't exist, leave it as NULL
                item.category_new = None
                item.save()

def reverse_convert_category_foreignkeys_to_codes(apps, schema_editor):
    Item = apps.get_model('items', 'Item')
    Category = apps.get_model('items', 'Category')
    
    # Convert ForeignKey back to code string
    # At this point, both 'category' (CharField) and 'category_new' (ForeignKey) exist
    for item in Item.objects.all():
        if item.category_new:  # category_new is the ForeignKey
            try:
                category = Category.objects.get(pk=item.category_new_id)
                # Set the old category CharField
                item.category = category.code
                item.save()
            except Category.DoesNotExist:
                item.category = ''
                item.save()
        else:
            item.category = ''
            item.save()

class Migration(migrations.Migration):

    dependencies = [
        ('items', '0007_populate_categories'),
    ]

    operations = [
        # Step 1: Add new category ForeignKey field (nullable, with temporary name)
        migrations.AddField(
            model_name='item',
            name='category_new',
            field=models.ForeignKey(
                blank=True,
                null=True,
                db_index=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='items.category'
            ),
        ),
        # Step 2: Populate the new field from the old field
        migrations.RunPython(convert_category_codes_to_foreignkeys, reverse_convert_category_foreignkeys_to_codes),
        # Step 3: Remove the old category CharField
        migrations.RemoveField(
            model_name='item',
            name='category',
        ),
        # Step 4: Rename category_new to category
        migrations.RenameField(
            model_name='item',
            old_name='category_new',
            new_name='category',
        ),
    ]

