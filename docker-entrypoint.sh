#!/bin/sh
set -e

echo "Cyber Compliance: applying database migrations..."
npx prisma migrate deploy

echo "Cyber Compliance: seeding database (safe to run repeatedly)..."
npx prisma db seed || echo "Seed step reported an issue; continuing startup."

echo "Cyber Compliance: starting application..."
exec "$@"
