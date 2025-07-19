.PHONY: up down test ensure-env

# Check if .env exists, if not create it from .env.example
ensure-env:
	@test -f .env || (echo ".env not found, copying from .env.example..." && cp .env.example .env)

up: ensure-env
	docker compose up --build

down:
	docker compose down

test: ensure-env
	-docker compose run --rm backend-tests
	-docker compose run --rm frontend-tests