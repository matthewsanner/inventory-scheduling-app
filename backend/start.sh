#!/bin/sh

python manage.py migrate

# Check if any Items exist before loading sample data
if [ "$(python manage.py shell -c 'from items.models import Item; print(Item.objects.exists())')" = "False" ]; then
  echo "Loading sample data..."
  python manage.py loaddata sample_data.json
else
  echo "Sample data already present, skipping."
fi

python manage.py runserver 0.0.0.0:8000
