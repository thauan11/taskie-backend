#!/bin/sh

until nc -z db 5432; do
  echo "Waiting for PostgreSQL..."
  sleep 1
done

npm run build
npm run seed

echo "DATABASE_URL is: $DATABASE_URL"

exec npm start