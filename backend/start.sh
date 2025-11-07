#!/bin/sh

python manage.py migrate --noinput

# Check if any Items exist before loading sample data
if [ "$(python manage.py shell -c 'from items.models import Item; print(Item.objects.exists())')" = "False" ]; then
  echo "Loading sample item data..."
  python manage.py loaddata sample_items.json
else
  echo "Sample item data already present, skipping."
fi

# Check if any Events exist before loading sample event data
if [ "$(python manage.py shell -c 'from events.models import Event; print(Event.objects.exists())')" = "False" ]; then
  echo "Loading sample event data..."
  python manage.py loaddata sample_events.json
else
  echo "Sample event data already present, skipping."
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
