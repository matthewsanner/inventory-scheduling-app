#!/bin/bash

# Wait until Postgres is ready
until pg_isready -h inventory-db -p 5432 -U postgres; do
  echo "Waiting for Postgres..."
  sleep 2
done

# Run whatever command was passed to the container
exec "$@"
