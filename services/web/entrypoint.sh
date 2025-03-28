#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

<<<<<<< HEAD
    while ! pg_isready -h $SQL_HOST -p $SQL_PORT -q; do
      sleep 1
    done
    echo "PostgreSQL started"

    # Check if the 'inventory' database exists
    if psql -h $SQL_HOST -U $SQL_USER -lqt | cut -d \| -f 1 | grep -qw "inventory"; then
        echo "Database 'inventory' already exists"
    else
        echo "Database 'inventory' does not exist. Creating..."
        psql -h $SQL_HOST -U $SQL_USER -c "CREATE DATABASE inventory"
        echo "Creating the database tables..."
        flask create_db
        flask seed_db
        echo "Tables created"
    fi
=======
    while ! nc -z $SQL_HOST $SQL_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

if [ "$FLASK_DEBUG" = "1" ]
then
    echo "Creating the database tables..."
    flask create_db
    flask seed_db
    echo "Tables created"
>>>>>>> origin/main
fi

exec "$@"