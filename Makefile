.PHONY: up down test ensure-env

# Check if .env files exists, if not create them from .env.example(s)
ensure-env:
	@test -f .env || (echo "Creating root .env from .env.example..." && cp .env.example .env)
	@test -f backend/.env || (echo "Creating backend/.env from backend/.env.example..." && cp backend/.env.example backend/.env)
	@test -f frontend/.env || (echo "Creating frontend/.env from frontend/.env.example..." && cp frontend/.env.example frontend/.env)

up: ensure-env
	docker compose up --build

down:
	docker compose down

test: ensure-env
	@set -e; \
	EXIT_CODE=0; \
	echo "Running backend tests..."; \
	docker compose run --rm backend-tests || EXIT_CODE=$$?; \
	echo "Running frontend tests..."; \
	docker compose run --rm frontend-tests || EXIT_CODE=$$?; \
	if [ $$EXIT_CODE -ne 0 ]; then \
		echo "Some tests failed."; \
	else \
		echo "All tests passed."; \
	fi; \
	exit $$EXIT_CODE


dev: ensure-env
	docker compose up