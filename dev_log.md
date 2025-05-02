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

## SCRUM-14 updates item schema for db incl. local django image saving

- update item schema with more fields and constraints
- list item categories
- install Pillow (pip install Pillow)
- create requirements.txt again
- perform db migrations again (makemigrations, migrate)
- update settings and urls for temp local django storage location for images

## SCRUM-68 creates basic frontend with navbar, routing, checks that backend, frontend, db are connected

- install axios, react-router, react-icons, and @material-tailwind/react as dependencies, and @tailwindcss/vite, prettier, prettier-plugin-tailwindcss, and tailwindcss as dev dependencies
- add tailwind to vite config
- comment out all default css, can delete later
- add tailwind css import to App.css
- create simple navbar component with a couple links and simple items page
- update serializer on backend to create the long category variable derived from matching the short category name in the model, and set it to return all fields
- create the react routing setup in App.jsx, just handling home and items pages for now
- create a couple sample items in the items table from the Django admin panel on the backend for testing purposes
- check to make sure that the items page is properly returning all of the sample items with their name and long category

## SCRUM-15 replaces material-tailwind with flowbite, creates items table and pagination

- uninstall @material-tailwind/react due to incompatibility with recent versions of Tailwind and/or React
- remove all configuration details related to @material-tailwind/react
- install flowbite-react as an alternative for basic components that is compatible (npx flowbite-react@latest init), this automatically takes care of config details as well
- add Django Rest Framework (DRF) pagination settings to settings.py, using just 10 page intervals for now, need to increase later
- create basic table to return all items, using Table components from Flowbite
- paginate the API call and the table with controls using Pagination components from Flowbite

## SCRUM-69 creates item detail page, links items table to item detail pages

- create route to item detail pages
- create item detail page that displays all information and handles items with no image or no description
- make each table row on the items page link to the corresponding item
