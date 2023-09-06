# INVENTORY - rachmiel-cs50finalproj

#### Video Demo: 

## This project was build with WSL2 on Windows, so commands below are in Bash

## IMPORTANT: Docker is required to run this project!
- This is because PostgreSQL is used instead of SQLite, and PostgreSQL can be easily run within a Docker container.
- flask run will not work because some SQL queries do not work on SQLite

## This web application runs on docker, where 3 services (containers) are created: 
- an Nginx reverse proxy forwards requests to the web server, and serves static content
- a Web server is exposed via Gunicorn
- A database server that runs PostgreSQL

# Steps after installing Docker:

- git clone https://github.com/rachtrx/rachmiel-cs50finalproj.git
- python3 -m venv venv
- . venv/bin/activate
- cd inventory_app

### Get .env files

## BUILD (choose between Prod or Dev)

### Production: If there is already a volume in Docker with the database, ignore create_db
- npm install 
- npm run build:parcel 
- npm run build:css 
- docker-compose -f docker-compose.prod.yml up -d --build 
- docker-compose -f docker-compose.prod.yml exec web flask create_db
- docker-compose -f docker-compose.prod.yml exec web flask seed_db
- navigate to 127.0.0.1:80
- login with authorized username and password

### Development: Resets the database by default - see entrypoint.sh
- npm install
- npm run start
- npm run watch:sass
- docker-compose -f docker-compose.yml up -d --build 
- navigate to 127.0.0.1:5001
- login with email: test@test.com and password: 1234

### Testing:
#### Create Device:
- Devices can be added in 3 ways:
  - Onboard Device (initially the home page when database is empty, supports only Excel bulk upload)
  - Register Model -> Register Device (supports individual and bulk upload)
  - Register Device -> Onboard Device (same as Onboard Device)
  - Get the sample onboard excel file from https://1drv.ms/x/s!AteVrZk2S_HiiZAq8qLRmY1P1BqB4w?e=l9ddb3
#### Create User:
- Users can be added in 2 ways:
  - Onboard Device (User can be added via onboard if they are currently loaning a device, bulk upload)
  - Create User (supports individual and bulk upload)
#### Loan Device
  - Devices can only be loaned individually to have a strict workflow in device movement. Loan forms are automatically generated but can also be submitted without the form
#### Return Device
  - Devicess can only be returned individually for the same reason. If the user signed when loaning, it can be downloaded again to complete the form. Upon submission, the previous loan form is replaced by the new return form. Can also be submitted without the form
#### Condemn Device / Remove User
  - Devices can be condemned and Users can be removed both individually and in bulk
#### Devices, Users, Events
  - There are 3 main overviews in the navigation bar: Devices (also Show All Devices), Users (also Show All Users) and History.
  - Able to filter based on multiple factors to find target Device / User / Event
  - Able to export data into Excel
#### Show Device / Show User
  - Provides comprehensive details of each user and device, including a timeline of events relevant to each Device / User
#### Dashboard
  - The homepage provides administrators with a broad overview of the top devices, users, budget etc, to get an understanding of the entire school inventory

## CLEANUP

### To remove all tables,
- docker-compose -f docker-compose.prod.yml exec web python manage.py remove_db (PROD) 
- docker-compose -f docker-compose.yml exec web python manage.py remove_db (DEV)

### To remove all docker containers,
- docker-compose -f docker-compose.prod.yml down 

### To remove all docker containers, images and volumes,
- docker-compose -f docker-compose.prod.yml down -v --rmi all


## Other notes and for future reference:

### Use Alembic for database migration (not too sure about how this works)

### To view the tables from the terminal:
- docker-compose exec db psql --username= --dbname=