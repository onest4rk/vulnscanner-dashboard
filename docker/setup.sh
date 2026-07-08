#!/usr/bin/env bash
set -euo pipefail

echo "=== VulnScanner Dashboard Setup ==="

# Copy env file if needed
if [ ! -f ../.env ]; then
  cp ../.env.example ../.env
  echo "Created .env from .env.example"
fi

# Install dependencies
cd ..
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
echo "Waiting for database..."
sleep 3
npx prisma db push

# Seed demo data
npx tsx prisma/seed.ts

echo ""
echo "=== Setup complete ==="
echo "Run 'npm run dev' to start the dev server"
echo "Default login: admin@example.com / admin123"
