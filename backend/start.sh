#!/bin/sh

# python manage.py migrate --noinput

# # Check if any Items exist before loading sample data
# if [ "$(python manage.py shell -c 'from items.models import Item; print(Item.objects.exists())')" = "False" ]; then
#   echo "Loading sample item data..."
#   python manage.py loaddata sample_items.json
# else
#   echo "Sample item data already present, skipping."
# fi

# # Check if any Events exist before loading sample event data
# if [ "$(python manage.py shell -c 'from events.models import Event; print(Event.objects.exists())')" = "False" ]; then
#   echo "Loading sample event data..."
#   python manage.py loaddata sample_events.json
# else
#   echo "Sample event data already present, skipping."
# fi

# # Automatically create superuser if it doesn't exist
# echo "Checking for superuser..."
# python manage.py shell -c "
# from django.contrib.auth import get_user_model;
# User = get_user_model();
# if not User.objects.filter(username='${DJANGO_SUPERUSER_USERNAME}').exists():
#     User.objects.create_superuser(
#         '${DJANGO_SUPERUSER_USERNAME}',
#         '${DJANGO_SUPERUSER_EMAIL}',
#         '${DJANGO_SUPERUSER_PASSWORD}'
#     )
# "

# python manage.py runserver 0.0.0.0:8000




# Stop on any error (production-safe)
set -e

echo "Applying migrations..."
python manage.py migrate --noinput

# Load sample items if empty
if [ "$(python manage.py shell -c 'from items.models import Item; print(Item.objects.exists())')" = "False" ]; then
  echo "Loading sample item data..."
  python manage.py loaddata sample_items.json
else
  echo "Sample item data already present; skipping."
fi

# Load sample events if empty
if [ "$(python manage.py shell -c 'from events.models import Event; print(Event.objects.exists())')" = "False" ]; then
  echo "Loading sample event data..."
  python manage.py loaddata sample_events.json
else
  echo "Sample event data already present; skipping."
fi

# Auto-create superuser
echo "Checking for superuser..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
import os

User = get_user_model()
username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

if username and password and not User.objects.filter(username=username).exists():
    print("Creating superuser...")
    User.objects.create_superuser(username=username, email=email, password=password)
else:
    print("Superuser already exists or env vars missing.")
EOF

# Determine environment
if [ "$RENDER" = "true" ]; then
    echo "Starting Gunicorn (Render production mode)..."
    gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
else
    echo "Starting Django runserver (local dev mode)..."
    python manage.py runserver 0.0.0.0:8000
fi
