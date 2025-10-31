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

## SCRUM-4 Create and Manage Inventory Items

### SCRUM-14 updates item schema for db incl. local django image saving

- update item schema with more fields and constraints
- list item categories
- install Pillow (pip install Pillow)
- create requirements.txt again
- perform db migrations again (makemigrations, migrate)
- update settings and urls for temp local django storage location for images

### SCRUM-68 creates basic frontend with navbar, routing, checks that backend, frontend, db are connected

- install axios, react-router, react-icons, and @material-tailwind/react as dependencies, and @tailwindcss/vite, prettier, prettier-plugin-tailwindcss, and tailwindcss as dev dependencies
- add tailwind to vite config
- comment out all default css, can delete later
- add tailwind css import to App.css
- create simple navbar component with a couple links and simple items page
- update serializer on backend to create the long category variable derived from matching the short category name in the model, and set it to return all fields
- create the react routing setup in App.jsx, just handling home and items pages for now
- create a couple sample items in the items table from the Django admin panel on the backend for testing purposes
- check to make sure that the items page is properly returning all of the sample items with their name and long category

### SCRUM-15 replaces material-tailwind with flowbite, creates items table and pagination

- uninstall @material-tailwind/react due to incompatibility with recent versions of Tailwind and/or React
- remove all configuration details related to @material-tailwind/react
- install flowbite-react as an alternative for basic components that is compatible (npx flowbite-react@latest init), this automatically takes care of config details as well
- add Django Rest Framework (DRF) pagination settings to settings.py, using just 10 page intervals for now, need to increase later
- create basic table to return all items, using Table components from Flowbite
- paginate the API call and the table with controls using Pagination components from Flowbite

### SCRUM-69 creates item detail page, links items table to item detail pages

- create route to item detail pages
- create item detail page that displays all information and handles items with no image or no description
- make each table row on the items page link to the corresponding item

### SCRUM-16 creates interface for adding new items

- fix backend item model to expect just a URL for the image instead of expecting an image upload, in the future we may want to change the frontend to an image upload that then uploads to AWS cloud or similar and then stores a URL in the database
- add routing for new item creation
- surface the categories from the item model using an api route with a category APIView for the new item form to get
- fix item api routing to not use extend and instead just include the path, this exposes the APIView properly
- set category_long to be read only in the items serializer so it's not required to create a new item
- create the new item component with Flowbite form that gets the categories from the the new category endpoint and submits the new item data to the new item route, set name to be the only required field
- add a create new item button to the items component that routes to the new item component

### SCRUM-17 implement item editing functionality

- create edit item page with form similar to new item form
- add routing for item editing
- make category field optional in both new and edit item forms by removing required attribute
- add default ordering to Item model to display items in creation order
- create and apply database migration for model changes
- restart Django server to use new ordering configuration

### SCRUM-18 add item deletion functionality

- add delete button to item detail page using Flowbite Button component with red color
- implement confirmation dialog using Flowbite Modal component with popup prop (optimized for confirmation dialogs), warning icon from react-icons, one button to delete, the other to not delete and remove modal
- add delete functionality using axios DELETE request to the item endpoint
- add navigation back to items list after successful deletion

### SCRUM-19 implement item search and filtering options, improve items table UI

- install django-filter package in backend (pip install django-filter)
- add django-filter to INSTALLED_APPS in settings.py
- update requirements.txt with new dependency
- configure REST_FRAMEWORK settings to enable filtering backends (DjangoFilterBackend, SearchFilter, OrderingFilter)
- create ItemFilter class in items/api/views.py to define filterable fields:
  - name (case-insensitive contains)
  - category (exact match)
  - color (case-insensitive contains)
  - location (case-insensitive contains)
  - checked_out (boolean)
  - in_repair (boolean)
- add search_fields and ordering_fields to ItemViewSet
- update frontend Items component:
  - add search and filter form with responsive grid layout
  - implement filter controls (search input, category dropdown, color/location filters, checkboxes)
  - add clear filters button
  - set max-width (1200px) for table and filter form
  - center content and maintain horizontal scrolling for smaller screens
- update frontend API call to include filter parameters
- reset pagination when filters change
- move edit button to item detail page
- fix fetchItems dependency issue

### SCRUM-47 improve error handling and write unit tests

- create DeleteItemModal.jsx component to check if users are sure they want to delete item
- create parameterized ErrorCard.jsx component to display when certain types of anticipated errors occur
- create LoadingCard.jsx to display briefly before items or item details load
- install react-error-boundary
- create ErrorBoundary.jsx to handle unexpected errors by displaying ErrorCard and wrap app with it on App.jsx
- create errormessages.js to centralized all ErrorCard error messages, redirects, and button text
- implement the improved error handling and loading state on all pages as appropriate
- install @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, eslint-plugin-vitest, jsdom
- create simple setupTest.js file to make jest-dom features available (it's compatible with Vitest), and link it into the vite.config.js which is set up to use JSDOM
- create testUtils.js to hold reusable test mocks
- create reasonably comprehensive tests for all pages and components using Vitest

### SCRUM-47 refactor API services out of frontend pages

- refactor API service out of the main frontend pages for separation of concerns and readability

### SCRUM-47 creates backend tests with pytest

- install pytest and pytest-django on backend
- create comprehensive backend tests with pytest including edge cases

### SCRUM-71 containerizes app with Docker

- create docker-compose.yml with services for db, frontend, backend, frontend-tests, and backend-tests, set test profile for testing services so they don't run automatically on docker compose up
- create Makefile to streamline docker compose commands
- create .dockerignore files for frontend and backend
- create Dockerfile for frontend and backend
- create sample_data.json to fill container database with some sample testing data
- create start.sh and wait-for-postgres.sh to make sure backend waits for the database to be ready before initializing
- install dj-database-url so we can use DATABASE_URL from docker-compose.yml in settings.py db settings
- update settings.py CORS_ALLOWED_ORIGINS to include 127.0.0.1
- change package.json dev command to add --host so Vite listens inside the container
- change package.json test command to add run so it runs the tests and stops and shuts down instead of continuing to listen
- remove flowbite-react/plugin/vite from plugins because it is not a valid import
- add box.png to public folder so that test images set in the db will load on frontend
- remove cursor-pointer tailwind class from wherever it was and add that in as a css rule for all buttons instead
- update gitignore to ignore .vite cache

## SCRUM-5 Enable User Authentication

### SCRUM-21 implement role-based access

- install djangorestframework_simplejwt on backend
- add 'rest_framework.authtoken' to INSTALLED APPS in settings.py
- add 'rest_framework_simplejwt.authentication.JWTAuthentication' to DEFAULT_AUTHENTICATION_CLASSES in REST_FRAMEWORK in settings.py
- add token and token refresh paths to core/api/urls.py
- create permissions.py with isManagerOrStaffReadOnly class that checks for authentication and authorization per the class
- in items/api/views.py assign that permission class to ItemViewSet and CategoryChoicesView
- fixed issue with shell script line endings, added a .gitattributes file to enforce LF endings for .sh files since the Docker container expects Unix-style line endings

### SCRUM-20 fixes env vars issue with docker container

- creates new .env.example file that has some default env vars for full demo/testing inside the Docker container for frontend and backend in the root directory
- adds code in the Makefile to copy the .env.example file to .env if it doesn't already exist when making the Docker packages
- adds the .env file to the docker-compose.yml frontend and backend services
- cleaned up .dockerignore files, added notes to old .env.example files for frontend and backend, these could still be relevant for local instances
- added creation of Django superuser to the backend start.sh for backend admin access

# SCRUM-20 fixes up env files, adds superuser to permissions

- gets rid of local install envs
- separates out frontend, backend, db container envs
- adds superusers to permissions structure
