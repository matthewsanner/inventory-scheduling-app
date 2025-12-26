#!/bin/sh
set -e

echo "Bootstrapping backend..."

#######################################
# PRODUCTION (Render)
#######################################
if [ "$RENDER" = "true" ]; then
    echo "Detected Render environment (production)"

    # IMPORTANT:
    # - No migrations
    # - No fixtures
    # - No shell scripts
    # - No superuser creation
    # All of that must be done separately

    echo "Starting Gunicorn..."
    gunicorn core.wsgi:application \
        --bind 0.0.0.0:$PORT \
        --workers 2 \
        --threads 4 \
        --timeout 120

    exit 0
fi

#######################################
# DEVELOPMENT (local / non-Render)
#######################################
echo "Detected local development environment"

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

# Auto-create superuser (dev only)
echo "Checking for superuser..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
import os

User = get_user_model()
username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin")

if not User.objects.filter(username=username).exists():
    print("Creating development superuser...")
    User.objects.create_superuser(username=username, email=email, password=password)
else:
    print("Superuser already exists.")
EOF

echo "Starting Django development server..."
python manage.py runserver 0.0.0.0:8000
