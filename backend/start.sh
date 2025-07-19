#!/bin/sh

python manage.py migrate

# Check if any Items exist before loading sample data
if [ "$(python manage.py shell -c 'from items.models import Item; print(Item.objects.exists())')" = "False" ]; then
  echo "Loading sample data..."
  python manage.py loaddata sample_data.json
else
  echo "Sample data already present, skipping."
fi

# Automatically create superuser if it doesn't exist
echo "Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(username='${DJANGO_SUPERUSER_USERNAME}').exists():
    User.objects.create_superuser(
        '${DJANGO_SUPERUSER_USERNAME}',
        '${DJANGO_SUPERUSER_EMAIL}',
        '${DJANGO_SUPERUSER_PASSWORD}'
    )
"

python manage.py runserver 0.0.0.0:8000
