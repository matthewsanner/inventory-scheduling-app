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

## SCRUM-46 more backend, frontend setup, connection

- also install django-cors-headers (pip install django-cors-headers)
- create requirements.txt again
- fix directory structure so all backend files are inside backend folder with core folder (previously was backend folder) inside, could have avoided this by using different command to create the backend (django-admin startproject core), then rename the upper folder backend
- create Django admin superuser (python manage.py createsuperuser)
- create items "app" in backend (python manage.py startapp items)
- create React/Javascript frontend with Vite (npm create vite@latest frontend)
- install frontend dependencies (npm install)
- make sure frontend works (npm run dev)
- update core settings.py file
- update item models, admin.py,
- create api directory in items app with 3 files, fill those in
- create api directory in core, add urls.py
- add api path to urls.py in core
- run migrations again (python manage.py makemigrations, python manage.py migrate)
- confirm can log-in to Django admin panel
- check that api routes function and you can add items from the api endpoint or the admin panel
- create .env file in frontend with the API route
- update App.jsx to fetch items from api and display them on the index page
- comment out strict mode on main.jsx
- adjust some css for better display
- check that frontend retrieves data from api which retrieves from db and displays on frontend without errors, use ctrl+shift+r if needed for hard reload
