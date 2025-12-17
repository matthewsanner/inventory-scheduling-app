# Inventory Scheduling App

A Django-based web application for managing and scheduling inventory for entertainment productions, packaged with Docker for easy installation and testing

## Check out the Live Demo!

[InventoryFlow](https://inventory-scheduling-app-frontend.onrender.com/)

Sign in with the test staff user or test manager user accounts to see data in the app. The test staff user is read-only whereas the test manager user also has the ability to create, update, and delete data entries.

Test staff username: teststaff
Test staff password: teststaff123

Test manager username: testmanager
Test manager password: testmanager123

Note: the backend may take up to a minute to spin up so be patient at the beginning

## Requirements

**1.** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**2.** Any modern web browser

## Installation

**1.** Clone the repository:

```bash
git clone https://github.com/matthewsanner/inventory-scheduling-app.git
```

**2.** Navigate to the project directory:

```bash
cd inventory-scheduling-app
```

**3.** Use simple Make command to start containers:

```bash
make up
```

## Using the App

**1.** View/use the app at [http://localhost:5173/](http://localhost:5173/)

Note: The Home page is currently just a placeholder, navigate to the Items page for the current content.

**2.** Use Make command to run frontend and backend tests:

```bash
make test
```

**3.** When you are done, use Make command to shut down and remove containers

```
make down
```
