#!/usr/bin/env bash
set -euo pipefail

echo "Running database migrations..."
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push

echo "Starting application..."
exec "$@"
