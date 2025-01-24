# Development Log

## SCRUM-46 sets up django backend, db connection, documentation

- create Python virtual environment (python -m venv venv)
- activate venv (source venv/Scripts/activate)
- install dependencies (pip install django djangorestframework psycopg2-binary django-environ)
- create requirements file (pip freeze > requirements.txt)
- set up Django backend (django-admin startproject backend .)

---

**Local database set-up**

- sign into postgreSQL as default postgres user (psql -U postgres)
- create database (CREATE DATABASE database_name;)
- create user (CREATE USER "user_name" WITH PASSWORD 'some_password';)
- grant privileges on new db to new user (GRANT ALL PRIVILEGES ON DATABASE database_name TO user_name;)
- connect to new database with superuser account and create schema and authorize new account (CREATE SCHEMA schema_name AUTHORIZATION user_name;)
- set search path (ALTER ROLE user_name IN DATABASE database_name SET search_path = 'schema_name';)

---

- migrate the database (python manage.py makemigrations, python manage.py migrate)
- hide sensitive information in .env file, link it to settings.py using django-environ
- update gitignore to ignore sensitive files
- run server to check that everything is connected properly and the test page is displayed (python manage.py runserver)
