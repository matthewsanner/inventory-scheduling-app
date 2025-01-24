# Inventory Scheduling App

A Django-based web application for managing and scheduling inventory for entertainment productions

## Installation

**1.** Clone the repository:

```bash
git clone https://github.com/matthewsanner/inventory-scheduling-app.git
```

**2.** Navigate to the project directory:

```bash
cd inventory-scheduling-app
```

**3.** Create a Python virtual environment:

```bash
python -m venv venv
```

**4.** Activate the virtual environment:
On Windows:

```bash
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

**5.** Install dependencies:

```bash
pip install -r requirements.txt
```

**6.** Create, set-up your PostgreSQL database:
Refer to the dev log's first commit 'Local database set-up' section for more details on how to do this

**7.** Update .env file with your sensitive info including database info, make sure .gitignore is set to ignore all sensitive and unnecessary files

**8.** Generate new Django secret key from terminal and add that to your .env:

```bash
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

**9.** Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

**10.** Run the development server, watch for db related errors, check that server test page works:

```bash
python manage.py runserver
```
