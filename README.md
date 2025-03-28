<<<<<<< HEAD
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
=======
# Leave Reporting System
Built for Grace Orchard School

## Starting the Environment in Development

1. Get [ngrok](https://dashboard.ngrok.com/get-started/setup) and use your computer as a local server
   ```sh
   ngrok http 80

2. Login to Twilio and ensure that 
   - The number is already registered as a Whatsapp number under a business
   - There is a Messaging Service. Under the integration tab, point the webhook and the callback to the ngrok URL (which is the local computer) 
   - All the Content Templates have already been implemented

3. **Build and Run Containers:** Containers are defined in the `docker-compose.yml` file, execute the following command in your terminal:

   ```sh
   docker-compose -f docker-compose.yml up --build

## Jobs

### System Jobs

The following [system jobs](./services/app/models/jobs/system/) exist
1. Acquiring MSAL Token
2. Morning Report to School Leaders
3. Syncing of Leave Records to Sharepoint
4. Syncing of Users from Sharepoint

### User Jobs

Currently, the only [user job](./services/app/models/jobs/user/) that exist is for:
1. Leave Reporting
2. Sharepoint Document Search (in progress)

#### Leave Reporting Jobs

**Application Logic**
- Uses regular expressions to determine the type of leave, dates of leave, and duration of leave

**Leave Details**
- Leave records are stored in leave_records, a table of the database, and syncs to Sharepoint via [Microsoft Graph API](https://developer.microsoft.com/en-us/graph/rest-api)

## Messages
Messages are sent and received through a Twilio number. Read Twilio's [Documentation](https://www.twilio.com/docs). It uses Programmable Messaging through a Messaging Service which allows for Content Template Builders.

### Incoming
Incoming messages are either stored as a [MessageReceived or MessageConfirm](./services/app/models/messages/received.py) 
- MessageReceiveds are the initial messages
- MessageConfirms are replies to the system after the system has generated its own message

### Outgoing
Outgoing messages are either stored as a [MessageSent or MessageForward](./services/app/models/messages/sent.py)
- MessageSents are replies to the user
- MessageForwards are messages to other users about the current user

## Upcoming Features
- Possibly looking into the Sharepoint Document Search that can be implemented using ElasticSearch
- Notifications for incoming and outgoing staff

### The following are required in .env in [./services/app/](./services/app/):

**Redis**
- REDIS_URL
- FERNET_KEY

**Microsoft (MSAL) Please Read Below!**
- CLIENT_ID
- CLIENT_SECRET
- AUTHORITY
- SCOPE
- SITE_ID

**Sharepoint**
- DRIVE_ID
- FOLDER_ID
- USERS_FILE_ID
- TOKEN_PATH

**Twilio metadata**
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- MESSAGING_SERVICE_SID
- TWILIO_NO

**Twilio Content Templates (Need to be implemented already)**
- LEAVE_CONFIRMATION_CHECK_SID
- LEAVE_CONFIRMATION_CHECK_3_ISSUES_SID
- LEAVE_CONFIRMATION_CHECK_2_ISSUES_SID
- LEAVE_CONFIRMATION_CHECK_1_ISSUE_SID
- SEND_MESSAGE_TO_HODS_SID
- SEND_MESSAGE_TO_HODS_ALL_PRESENT_SID
- FORWARD_MESSAGES_CALLBACK_SID
- LEAVE_NOTIFY_SID
- LEAVE_NOTIFY_CANCEL_SID
- SEND_MESSAGE_TO_LEADERS_SID
- SEND_MESSAGE_TO_LEADERS_ALL_PRESENT_SID
- SHAREPOINT_LEAVE_SYNC_NOTIFY_SID
- SELECT_LEAVE_TYPE_SID
- SEND_SYSTEM_TASKS_SID

`Note on MSAL Client Secret`: Client ID has to be changed when it expires. To create a new Client Secret, go to Microsoft Entra ID → Applications → App Registrations → Chatbot → Certificates & Secrets → New client secret. Then update the .env file and restart Docker
>>>>>>> origin/main
