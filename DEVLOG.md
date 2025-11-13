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

- create new .env.example file that has some default env vars for full demo/testing inside the Docker container for frontend and backend in the root directory
- add code in the Makefile to copy the .env.example file to .env if it doesn't already exist when making the Docker packages
- add the .env file to the docker-compose.yml frontend and backend services
- clean up .dockerignore files, added notes to old .env.example files for frontend and backend, these could still be relevant for local instances
- add creation of Django superuser to the backend start.sh for backend admin access

### SCRUM-20 fixes up env files, adds superuser to permissions

- get rid of local install envs
- separate out frontend, backend, db container envs
- add superusers to permissions structure

### SCRUM-20 sets up automated tests w/ GitHub Actions

- create the test.yml file to set up automated tests using the Docker testing containers

### SCRUM-20 fixes .env file creation

- in the Makefile, fix the .env file creation from the .env.example files if no .env exists

### SCRUM-20 fixes casing issue

- fix casing in Items.jsx that may have caused an automated test failure

### SCRUM-20 alters test commands to fail

- alter the Makefile test commands to return failure if either the backend or frontend tests fail
- reverse casing issue to test automated test failure response

### SCRUM-20 refixes casing issue

- refixes casing issue in Items.jsx since automated tests are returning failure properly now

### SCRUM-20 user login/logout, authorization endpoints

- update docker-compose.yml to allow frontend to watch for changes and automatically rebuild in development
- update Makefile test commands to actually allow frontend and backend tests to always run with the "make test" command, regardless if one fails, then return overall fail/success
- create user serializer to define what user information gets exposed to the frontend, adds derived fields to so role booleans can easily be used in frontend to show or hide elements based on group authorization
- revamp authorization endpoints to include login, logout, refresh, and auth check
- create core views.py which defines what the new auth endpoints do
- create AuthContext.jsx to keep track of user login state and provide auth data to UI
- create AuthService.js to make auth API requests and manage tokens
- create axiosConfig.js to define interceptors to always add JWT token to requests, and to handle token refresh on 401 Unauthorized error
- add axiosConfig to main.jsx
- add AuthProvider (from AuthContext) and login route to routing on App.jsx
- create simple login page
- update navbar with login/logout and user acknowledgment
- add frontend and backend tests for new features/processes

### SCRUM-73 Data migration for persistent groups

- add core to installed apps in settings.py
- create data migration for core that creates Manager and Staff groups to be created on new installs
- apply core migrations
- adjust start.sh with a --noinput flag on migrations for safety since it's being used in CI/CD

### SCRUM-74 Implements user registration, removes checked in, in repair

- add user registration serializer
- add user registration auth route
- create user registration endpoint
- create registration page and connect it to navbar when no user authenticated
- create register function in AuthService.js to create the API request for user registration
- create redirect from successful registration to login page which displays a success message and prompts to log in
- remove checked in and in repair fields from all files, frontend and backend, tests, mock data, and seed data, later going to handle check in/out from item bookings, may add back an in repair feature later that can handle quantities
- adjusted some error links to actually take you back to the previous relevant page
- add frontend and backend tests for new features
- update various test files to mock services instead of mocking with axios
- improve test coverage generally and test consistency across tests

### SCRUM-74 Adds minimums to quantity selectors

- Add minimum of 1 to quantity selectors

## SCRUM-8 Create events

### SCRUM-30 creates event model and API

- set up new Event model with fields: name, start_datetime, end_datetime, optional location, and optional notes
- add serializer, viewset, and URL routing for events, following similar structure as the existing items API
- make and apply migrations inside the backend Docker container for events "app"
- confirm CRUD routes working through manual API tests
- write backend unit tests for event endpoints, serializer, model, etc.
- update backend unit tests for items to match coverage on events
- suppress pytest deprecation warning for a known compatibility issue between Django and DRF, not a problem for the app right now

### SCRUM-31 implements backend event filtering and search

- create EventFilter class in events/api/views.py to define filterable fields
- add search_fields to EventViewSet to enable search across name, notes, and location fields
- add ordering_fields to EventViewSet to enable ordering by name, start_datetime, end_datetime, and location
- add comprehensive backend tests for filtering, search, and ordering functionality
- also add backend tests for items filtering, search, ordering to match coverage in events

### SCRUM-76 creates events page and API service

- create EventsService.js in frontend/src/services following the same pattern as ItemsService.js, with getEvents function that handles pagination, filtering, and error handling
- create Events.jsx page component in frontend/src/pages that mirrors the Items page structure but tailored for the Event model, includes table displaying event name, start date, end date, and location with formatted datetime display in local time, entries displayed in ascending order of event start date
- add search, location, and date filter inputs to the events page, with clear filters functionality
- add pagination controls using Flowbite Pagination component matching the items page style
- add error handling using ErrorCard and LoadingCard components consistent with other pages
- add events route to App.jsx routing configuration
- add Events link to Navbar component
- add LOAD_EVENTS_FAILED error key to errorMessages.js with appropriate error message and navigation
- add mock events data to testUtils.js for testing purposes including mockEvent and mockEvents exports
- create comprehensive Events.test.jsx test file covering all functionality including fetching and displaying events, filtering, pagination, navigation, error handling, loading states, and edge cases
- verify that events page displays properly and integrates with the existing backend events API
- fix an issue in axiosConfig.js that was causing an infinite loop of token refresh attempts anytime app loaded with invalid or expired token
- adds ASCII art logo to Home page so that it has something on it for now

### SCRUM-78 creates event details page

- create EventDetailService.js in frontend/src/services following the same pattern as ItemDetailService.js, with getEvent function that fetches a single event by ID
- create EventDetail.jsx page component in frontend/src/pages that mirrors the ItemDetail page structure but tailored for the Event model, displays event name as header, formatted start and end datetime, location (with fallback message if empty), and notes section (only displayed when notes exist)
- add event detail route to App.jsx routing configuration at /events/:id
- add LOAD_EVENT_FAILED error key to errorMessages.js with appropriate error message and navigation back to events page
- create comprehensive EventDetail.test.jsx test file covering all functionality including fetching and displaying event details, handling optional fields (location and notes), datetime formatting, error handling, loading states, and navigation
- verify that clicking on events in the events table properly navigates to the event details page and displays all event information

### SCRUM-79 creates new event form

- create NewEventService.js in frontend/src/services following the same pattern as NewItemService.js, with createEvent function that posts new event data to the events API endpoint
- create NewEvent.jsx page component in frontend/src/pages that mirrors the NewItem page structure but tailored for the Event model, includes form fields for name (required), start_datetime (required, datetime-local input), end_datetime (required, datetime-local input), location (optional), and notes (optional textarea)
- add form validation to ensure name, start_datetime, and end_datetime are provided, and that end_datetime is after start_datetime
- convert datetime-local format to ISO string format when submitting to the API
- add CREATE_EVENT_FAILED error key to errorMessages.js with appropriate error message and navigation back to events page
- add /events/new route to App.jsx routing configuration
- add mockEventFormData to testUtils.js for testing purposes
- create comprehensive NewEvent.test.jsx test file covering all functionality including form rendering, input handling, successful submission and navigation, error handling, validation (required fields and datetime ordering), loading states, and optional fields
- verify that the "Add New Event" button on the events page properly navigates to the new event form and that successful submission redirects back to the events list

### SCRUM-80 creates edit event form

- create EditEventService.js in frontend/src/services following the same pattern as EditItemService.js, with fetchEventById function that gets a single event by ID and updateEvent function that updates event data via PUT request to the events API endpoint
- create EditEvent.jsx page component in frontend/src/pages that mirrors the NewEvent page structure but loads existing event data like EditItem does, includes form fields for name (required), start_datetime (required, datetime-local input), end_datetime (required, datetime-local input), location (optional), and notes (optional textarea)
- add loading state with LoadingCard while fetching event data
- convert ISO datetime strings from API to datetime-local format when loading event data into the form, and convert back to ISO string format when submitting to the API
- add form validation to ensure name, start_datetime, and end_datetime are provided, and that end_datetime is after start_datetime
- add UPDATE_EVENT_FAILED error key to errorMessages.js with appropriate error message and navigation back to event details page
- add /events/:id/edit route to App.jsx routing configuration
- create comprehensive EditEvent.test.jsx test file covering all functionality including loading states, fetching and displaying event data, form input handling, successful submission and navigation, error handling (both fetch and update errors), validation (required fields and datetime ordering), datetime format conversion, cancel navigation, and edge cases
- add Edit Event and Delete Event buttons to EventDetail.jsx page to match the button layout of ItemDetail.jsx, with Edit Event button navigating to the edit form and Delete Event button placeholder
- update EventDetail.test.jsx to include tests for the new Edit Event and Delete Event buttons
- verify that the edit event form properly loads existing event data and that successful submission redirects back to the events list

### SCRUM-81 implements event deletion with confirmation modal

- add deleteEvent function to EventDetailService.js to handle DELETE request to events API endpoint
- create DeleteEventModal component following the same pattern as DeleteItemModal, with confirmation dialog using Flowbite Modal component with popup prop, warning icon from react-icons, and confirmation/cancel buttons
- update EventDetail.jsx to implement delete functionality: add showDeleteModal state, handleDelete function that calls deleteEvent service and navigates to events list on success, and integrate DeleteEventModal component with the delete button
- add DELETE_EVENT_FAILED error key to errorMessages.js with appropriate error message and navigation back to events page
- add comprehensive delete functionality tests to EventDetail.test.jsx covering modal opening, modal closing, successful deletion and navigation, and error handling
- verify that delete button on event detail page properly opens confirmation modal and that successful deletion redirects back to events list

### SCRUM-81 new event migration

- create and apply new migration to reflect model ordering by start_datetime instead of id

### SCRUM-81 fixes token logic, clean up

- fix token retry logic in axiosConfig.js to make sure it doesn't actually cause the infinite loop issue it was trying to prevent
- add defaults to Event model fields with blank=True to fit best practices
- comment out a couple unused imports

### SCRUM-81 fixes seed data, adds BE datetime validation, modal error issue

- fix start.sh to check for empty tables for events and items separately and load separate seed data for either one if they are empty
- adds backend datetime validation in the model and serializer for events to make sure the end time is not before the start time
- fix delete item and delete event user flows to close the delete modal when a deletion error occurs

### SCRUM-81 fixes/adds BE tests, services use configured axios

- fix a couple BE unit tests that had unintentionally bad data with start datetimes after end datetimes
- add BE tests for the new BE datetime validations in model and serializer
- set all services to use the configured axios instance instead of the base instance, this allows us to use relative URLs and properly take advantage of automatic token refreshes on 401 errors, and explicitly include JWT auth headers via the request interceptor

## SCRUM-10 Handle item bookings

### SCRUM-37 creates ItemBooking model and API

- create itembookings Django app
- create ItemBooking model with foreign key to Item, foreign key to Event, quantity field (PositiveSmallIntegerField), and created_at datetime field (auto_now_add)
- add compound uniqueness constraint on (item, event) in ItemBooking model Meta class
- add db_index=True to item and event foreign key fields in ItemBooking model for indexing
- add indexes to Event model for start_datetime and end_datetime fields in Event model Meta class for efficient overlap queries
- implement overbooking validation in ItemBooking model clean() method that checks all existing bookings for the same item whose events overlap with the booking's event, raises ValidationError if total booked quantity would exceed item quantity
- create ItemBookingSerializer with read-only fields: item_name, event_name, event_start_datetime, event_end_datetime for display purposes
- implement overbooking validation in ItemBookingSerializer validate() method to prevent overbooking via API
- make item and event fields read-only during updates (but writable during creation) by overriding serializer init() method to conditionally set read_only=True when instance exists
- create ItemBookingViewSet with IsManagerOrStaffReadOnly permission class, using standard ModelViewSet behavior
- create ItemBooking API URLs using DefaultRouter and register in core/api/urls.py at 'itembookings/' path
- register itembookings app in INSTALLED_APPS in settings.py
- create comprehensive backend tests covering model creation, uniqueness constraint, overbooking validation (overlapping events, non-overlapping events, partial overlaps), serializer serialization/deserialization, read-only fields, API CRUD operations, update restrictions, permissions (staff read-only, manager full access), and edge cases

### SCRUM-38 item booking creation flow

- delete accidentally duplicated clean function in ItemBooking model
- add "Book Item" button to item detail page using Flowbite Button component with blue color, positioned alongside existing Edit Item and Delete Item buttons
- create CurrentFutureEventsView API endpoint in events/api/views.py that returns events where end_datetime >= now, ordered by start_datetime, for use in item booking form dropdown
- add current-future route to events/api/urls.py for the new endpoint
- create NewItemBookingService.js in frontend/src/services with getCurrentFutureEvents function to fetch current/future events and createItemBooking function to create new item bookings
- create NewItemBooking.jsx page component with form fields for event selection (dropdown of current/future events with formatted dates) and quantity (number input with minimum of 1), includes form validation for required fields and quantity minimum, handles backend validation errors by displaying error messages from API response (especially for overbooking scenarios), includes loading state while fetching events and submitting form, includes Add Item Booking and Cancel buttons matching style of other form pages
- add /items/:id/book route to App.jsx routing configuration
- add CREATE_ITEM_BOOKING_FAILED error key to errorMessages.js with appropriate error message and navigation back to item details page
- add mockCurrentFutureEvents and mockItemBookingFormData to testUtils.js for testing purposes
- create comprehensive NewItemBooking.test.jsx test file covering all functionality including loading states, fetching and displaying events, form input handling, successful submission and navigation, error handling (both API errors and backend validation errors), validation (required fields and quantity minimum), cancel navigation, and edge cases
- create comprehensive backend tests for CurrentFutureEventsView endpoint covering filtering (only returns events with end_datetime >= now), ordering (by start_datetime), authentication requirements, permissions (staff and manager access), edge cases (events ending now, empty results), and exclusion of past events
- create and run migrations for new ItemBooking model, should have been done in previous commit really, this also appropriately created and applied new migrations for the Events model
- verify that clicking "Book Item" button on item detail page properly navigates to the new item booking form and that successful submission redirects back to item details page
- standardize quantity handling across all forms (NewItem, EditItem, NewItemBooking) to use custom validation only, update tests appropriately

### SCRUM-82 display item bookings on event & item detail pages

- add ItemBookingFilter class to ItemBookingViewSet in backend/itembookings/api/views.py to enable filtering by item and event foreign keys
- create ItemBookingService.js in frontend/src/services with getItemBookingsByItem and getItemBookingsByEvent functions to fetch filtered bookings from the API
- update ItemDetail.jsx to fetch and display item bookings for that item in a separate card below the main item details card, showing event name, event start datetime, event end datetime, and quantity in a table format
- update EventDetail.jsx to fetch and display item bookings for that event in a separate card below the main event details card, showing item name and quantity in a table format
- make booking table rows clickable to navigate to item booking edit page which doesn't exist yet
- add loading states and error handling for bookings (bookings errors are logged but don't prevent the main detail page from displaying)
- add LOAD_ITEM_BOOKINGS_FAILED error key to errorMessages.js (not used currently)
- add mockItemBooking and mockItemBookings to testUtils.js for testing purposes
- create comprehensive unit tests for ItemDetail and EventDetail components covering booking display, loading states, empty states, navigation to edit page, and error handling

### SCRUM-83 item booking edit page w/ delete

- create EditItemBookingService.js in frontend/src/services following the same pattern as EditItemService.js, with fetchItemBookingById function that gets a single item booking by ID, updateItemBooking function that updates booking data via PATCH request to the itembookings API endpoint, and deleteItemBooking function that deletes a booking via DELETE request
- create DeleteItemBookingModal.jsx component following the same pattern as DeleteItemModal, with confirmation dialog using Flowbite Modal component with popup prop, warning icon from react-icons, and confirmation/cancel buttons, displays item name and event name in the confirmation message
- create EditItemBooking.jsx page component in frontend/src/pages that loads existing booking data and displays it in a form, includes form fields for item (disabled, displays item name), event (disabled, displays event name with formatted start and end datetime), and quantity (editable, number input with minimum of 1), includes form validation to ensure quantity is at least 1, handles backend validation errors by displaying error messages from API response (especially for overbooking scenarios), includes loading state while fetching booking data and submitting form, includes Update Booking, Delete Booking, and Cancel buttons matching style of other form pages
- add error keys for LOAD_ITEM_BOOKING_FAILED, UPDATE_ITEM_BOOKING_FAILED, and DELETE_ITEM_BOOKING_FAILED to errorMessages.js with appropriate error messages and navigation back to item details page
- add /itembookings/:id/edit route to App.jsx routing configuration
- create comprehensive EditItemBooking.test.jsx test file covering all functionality including loading states, fetching and displaying booking data, form input handling (quantity only, item and event disabled), successful submission and navigation, error handling (both API errors and backend validation errors), validation (quantity minimum), delete modal functionality (opening, closing, successful deletion, error handling), cancel navigation, loading states during submission, and edge cases
- verify that clicking on item bookings in the item detail page and event detail page properly navigates to the edit item booking form and that successful submission or deletion redirects back to item details page

### SCRUM-83 fixes variable scope issue

- fixes possible overlapping_bookings variable scope issue in itembookings/api/serializer

### SCRUM-83 minor code improvements

- perform sum for overlapping bookings directly in database instead of Python, more efficient
- extract quantity validation and datetime formatting into utility functions called across multiple files
- extract backend error handling from NewItemBooking.jsx and EditItemBooking.jsx into a utility function

### SCRUM-83 more minor code improvements

- extends use of datetime formatting utility function to other files with one custom passed option
- improves the validateQuantity function by removing a confusing check
- extracts overbooking validation logic so that it can be then called by model's clean method and serializer's validate method from a central file

### SCRUM-83 fixes indentation

- fixes indentation on ItemBookingFilter

## SCRUM-84 Categories model

### SCRUM-85 Turn categories into a model

- create Category model in items/models.py with name field (unique), removing the need for hardcoded CATEGORY_CHOICES
- create migration 0006_category.py to create Category table
- create data migration 0007_populate_categories.py to populate Category table from existing CATEGORY_CHOICES data
- update Item model to change category field from CharField with choices to ForeignKey(Category) with SET_NULL on delete
- create migration 0008_convert_item_category_to_foreignkey.py to convert existing Item.category values from codes to ForeignKey references
- update ItemSerializer to use category.name for category_long field instead of get_category_display(), remove category_code field, and handle category ID input in to_internal_value()
- update CategoryChoicesView to query Category.objects.all() instead of Item.CATEGORY_CHOICES, returning {"value": cat.id, "label": cat.name} format
- update ItemFilter to filter by category ID using NumberFilter instead of filtering by code
- register Category model in Django admin with CategoryAdmin class for easy management
- remove CATEGORY_CHOICES constant from Item model as it's no longer needed
- create migration 0009_remove_category_code.py to remove code field from Category model (categories now use IDs and names only)
- update all backend tests in items/tests.py to use Category instances instead of category codes, add category fixtures for common categories
- update all backend tests in itembookings/tests.py to use Category instances
- update frontend test utilities in testUtils.js to use category IDs (1, 2) instead of codes ("COS", "WIG")
- update all frontend tests to convert category IDs to strings when interacting with HTML select elements (since HTML select values are always strings)
- add waitFor() calls in frontend tests to ensure categories are loaded before selecting options
- fix frontend test assertions to check for category IDs as strings and update button text matching for loading states
- verify that API maintains backward compatibility with existing {value, label} format, where value is now category ID instead of code
- verify that frontend code requires no changes since it uses cat.value and cat.label generically

### SCRUM-86 Add ability to create new categories

- create CategorySerializer in backend/items/api/serializers.py to handle category creation with name field validation
- add POST method to CategoryChoicesView in backend/items/api/views.py to allow creating new categories via the existing categories endpoint, returns category in {value, label} format for consistency with GET endpoint
- add comprehensive backend tests in backend/items/tests.py covering successful category creation, duplicate name validation, empty name validation, missing name validation, long name validation, staff permission restrictions, and unauthenticated access restrictions
- create createCategory function in frontend/src/services/ItemsService.js to handle POST requests to categories endpoint with error handling
- add category creation form widget to Items.jsx page with text input and submit button, positioned in the filter form grid alongside other filters
- implement inline error handling for category creation that displays error messages below the form without disrupting the page, extracts specific error messages from backend validation responses
- automatically add newly created categories to the category dropdown list and maintain alphabetical sorting
- add CREATE_CATEGORY_FAILED and LOAD_CATEGORIES_FAILED error keys to ErrorKeys in errorMessages.js (used by service functions for consistent error identification, but not displayed in UI since category errors are handled inline)
- create comprehensive frontend tests in Items.test.jsx covering successful category creation, error handling (duplicate names, empty names, backend validation errors), form validation, error message clearing, disabled state when categories unavailable, and loading state during creation
- verify that new categories can be created and appear immediately in the category dropdown and can be used for filtering items

### SCRUM-86 minor code improvements

- remove unused variables
- fix redundant if statement
- change empty category to set to null instead of blank string

### SCRUM-86 switch out category_long

- remove category_long field from ItemSerializer in backend/items/api/serializers.py, replace with nested CategorySerializer using to_representation() method to return full category object {id, name} instead of separate category ID and category_long fields
- update ItemSerializer to_representation() method to return nested category object for reads while maintaining ability to accept category ID for writes via simplified to_internal_value() method that handles the actual frontend inputs (integers or null) with minimal defensive handling for empty strings
- simplify ItemSerializer to_internal_value() method to match frontend behavior: frontend sends category as integer (when selected) or null (when not selected), removed unnecessary nested object handling and generic falsy checks
- update all backend tests in items/tests.py to check category.id and category.name from nested category object instead of separate category and category_long fields
- update frontend Items.jsx to use item.category?.name instead of item.category_long for displaying category in table
- update frontend ItemDetail.jsx to use item.category?.name instead of item.category_long for displaying category in item details
- update frontend EditItem.jsx to extract category.id from nested category object when loading item data and convert category string to number when submitting form data
- update frontend NewItem.jsx to convert category string to number when submitting form data for consistency with EditItem
- update frontend test utilities in testUtils.js to use nested category objects {id, name} instead of separate category and category_long fields in mockItem and mockItems
- update all frontend tests in Items.test.jsx, EditItem.test.jsx, and NewItem.test.jsx to use nested category objects and access category.name for display assertions
- verify that API now returns category as nested object {id, name} instead of separate category ID and category_long fields
- verify that frontend correctly handles null categories (returns empty string for display)
- verify that serializer correctly handles frontend inputs: integers for selected categories, null for unselected categories
- remove order_by in CategoryChoicesView because Category model already defines ordering name
- remove default image url which was a local image because it wasn't do anything, will allow user to enter their own image URL here or they can enter "/box.png" if they want the default image, would like to change this later to allow image upload

### SCRUM-86 code clean up, accessibility

- add .select_related(category) to the ItemViewSet so that items' category data are retrieved in the initial database call for items instead of one by one after the initial call
- fix backend items test that was making it's own categories instead of using the existing fixtures
- improve frontend error message accessibility by adding role="alert" for displayed errors or role="status" for displayed status/success messages

### SCRUM-86 error cleanup

- fix error message display issue for item booking overbooking validation errors by moving validation logic directly into ItemBookingSerializer.validate() method, raising DRF ValidationError directly with string values (matching EventSerializer pattern) instead of converting from Django ValidationError
- simplify frontend error handling in errorHandling.js

## SCRUM-87 Frontend security/auth (also backend)

### SCRUM-88 input validation and XSS protection

- install bleach package (bleach==6.3.0) in backend requirements.txt for HTML sanitization
- add HTML sanitization to ItemSerializer using bleach.clean() with tags=[] and strip=True to remove all HTML tags from name, description, color, and location fields in to_internal_value() method
- add HTML sanitization to CategorySerializer to strip HTML tags from name field
- add HTML sanitization to EventSerializer to strip HTML tags from name, location, and notes fields
- add HTML sanitization to UserRegistrationSerializer to strip HTML tags from first_name and last_name fields
- add email format validation to UserRegistrationSerializer using Django's EmailValidator to ensure valid email addresses are provided during registration
- add URL validation to ItemSerializer image field to only allow http:// and https:// protocols, reject javascript:, data:, and other dangerous protocols, and validate URL format using Django's URLValidator
- add security headers to Django settings.py
- create frontend/src/utils/sanitization.js utility file with functions for URL validation and sanitization
- add URL validation to NewItem.jsx and EditItem.jsx forms using validateImageUrl() function, display error message if image URL uses invalid protocol or format
- add URL sanitization to ItemDetail.jsx using getSafeImageUrl() function before rendering image URLs in img src attribute, prevents rendering of dangerous URLs even if they somehow bypass validation
- add comprehensive backend security tests in backend/items/tests.py covering HTML tag stripping from all text fields, dangerous URL protocol rejection, valid URL acceptance, and invalid URL format rejection
- add comprehensive backend security tests in backend/events/tests.py covering HTML tag stripping from name, location, and notes fields
- add comprehensive backend security tests in backend/core/tests.py covering HTML tag stripping from first_name and last_name fields, and email format validation
- add back in ability to use relative URLs for images since that is what is being used temporarily for demo purposes

### SCRUM-88 adds note

- was going to hide certain UI elements from unauthorized users or users signed in as staff not managers, but decided not to do so right now because in the demo it is better to be able to see directly that certain tasks are blocked under those conditions in the UI when they are attempted

### SCRUM-88 code cleanup

- remove unused import CharField from ItemSerializer
- add data immutability protection by adding data = data.copy() at the beginning of to_internal_value() methods in CategorySerializer, ItemSerializer, EventSerializer, and UserRegistrationSerializer to avoid mutating original input data
- improve parent directory traversal validation in ItemSerializer image URL validation by replacing simple string inclusion check ('..' in image_url) with regex pattern to only reject .. when it appears as a complete path segment, allowing legitimate filenames
- improve parent directory traversal validation in frontend sanitization.js by replacing simple string inclusion check with regex pattern in sanitizeUrl() and getSafeImageUrl() functions for consistency with backend validation
- add test_serializer_accepts_relative_url_with_dots_in_filename test case in backend/items/tests.py to verify that relative URLs with .. in filenames (not as path segments) are properly accepted

### SCRUM-88 code improvements

- remove redundant fallback validation logic in getSafeImageUrl() function in frontend sanitization.js that was duplicating checks already performed by sanitizeUrl(), simplifying to single validation path
- fix whitespace normalization issue in ItemSerializer where whitespace-only image URLs weren't being updated in data before validation check, now properly normalizes to empty strings
