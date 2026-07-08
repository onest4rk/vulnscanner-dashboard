# VulnScanner Dashboard

A self-hosted vulnerability scanner orchestration and reporting dashboard. Schedule scans, trigger Nmap jobs, store results, and visualize findings in a clean security operations UI.

> **Important:** This tool is designed for authorized internal scanning only. Do not use for offensive purposes.

## Architecture

- **Next.js 15** (App Router) — Web UI + API routes
- **TypeScript** — Full type safety
- **PostgreSQL** + **Prisma ORM** — Data persistence
- **Node.js Workers** — Scan execution and scheduling
- **Nmap** — Network scanning engine
- **Chart.js** — Data visualization
- **Docker Compose** — Local stack deployment

## Quick Start (Docker)

```bash
# Clone and enter the project
cd vulnscanner-dashboard

# Copy environment config
cp .env.example .env

# Start everything
docker compose up -d

# Run database migrations
docker compose exec app npx prisma db push

# Seed demo data
docker compose exec app npx tsx prisma/seed.ts
```

Then open **http://localhost:3000** and sign in with:
- **Email:** `admin@example.com`
- **Password:** `admin123`

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- **Nmap** (required for real scan execution)
- npm or yarn

### Installing Nmap

**Windows:** Download from https://nmap.org/download.html and install. Add the install path (e.g. `C:\Program Files\Nmap`) to your system PATH, or set `NMAP_BINARY` in `.env` to the full path:
```
NMAP_BINARY="C:\Program Files\Nmap\nmap.exe"
```

**Linux/macOS:** Install via your package manager:
```bash
sudo apt install nmap           # Debian/Ubuntu
sudo dnf install nmap           # Fedora
brew install nmap               # macOS
```

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and edit as needed
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed demo data
npm run db:seed
```

### Running

You need **two terminal windows**:

```bash
# Terminal 1 — Web UI + API (Next.js dev server)
npm run dev
```

```bash
# Terminal 2 — Scan worker (polls for pending jobs, runs real nmap)
npm run worker
```

The worker polls every 5 seconds for pending scan jobs. Create a target + trigger a scan from the dashboard, and the worker will execute nmap against it automatically.

Also available:
```bash
npm run scheduler   # Optional: cron-based scan scheduler
```

## Project Structure

```
src/
  app/
    (public)/login       # Login page
    (auth)/              # Authenticated routes
    (app)/               # Dashboard pages
      dashboard/         # Main dashboard with charts
      targets/           # Scan target CRUD
      scans/             # Scan jobs and runs
      findings/          # Vulnerability findings
      reports/           # Report snapshots
      audit/             # Audit log
    api/                 # REST API routes
      auth/              # Login/logout
      targets/           # Target management
      scans/             # Scan orchestration
      findings/          # Finding management
      reports/           # Report generation
      audit/             # Audit trail
  components/            # Reusable UI components
  lib/                   # Shared utilities
    prisma.ts            # Database client
    auth.ts              # Auth helpers
    audit.ts             # Audit logging
    validations.ts       # Zod schemas
  workers/               # Background workers
    scan-worker.ts       # Executes scan jobs
    scheduler.ts         # Cron-based scheduling
  scripts/               # Bash utilities
    nmap-scan.sh         # Nmap wrapper script
prisma/
  schema.prisma          # Database schema
  seed.ts                # Demo data seeder
docker/
  Dockerfile.worker      # Worker container
  Dockerfile.scheduler    # Scheduler container
  setup.sh               # Setup helper
docker-compose.yml       # Full stack orchestration
```

## Roles & Permissions

| Role    | View Dashboard | Manage Targets | Trigger Scans | Manage Findings | View Audit Log |
|---------|:--------------:|:--------------:|:-------------:|:---------------:|:--------------:|
| Admin   | Yes            | Yes            | Yes           | Yes             | Yes            |
| Analyst | Yes            | Yes            | Yes           | Yes             | No             |
| Viewer  | Yes            | No             | No            | No              | No             |

## API Endpoints

| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| POST   | /api/auth/login         | Sign in                  |
| POST   | /api/auth/logout        | Sign out                 |
| GET    | /api/targets            | List targets             |
| POST   | /api/targets            | Create target            |
| PUT    | /api/targets?id=        | Update target            |
| DELETE | /api/targets?id=        | Soft-delete target       |
| GET    | /api/scans              | List scan jobs           |
| POST   | /api/scans              | Create scan job          |
| POST   | /api/scans/run?jobId=   | Trigger scan run         |
| GET    | /api/findings           | List findings (filtered) |
| PUT    | /api/findings?id=       | Update finding status    |
| GET    | /api/reports            | List report snapshots    |
| POST   | /api/reports            | Generate report          |
| DELETE | /api/reports?id=        | Delete report            |
| GET    | /api/audit              | List audit logs (admin)  |

## Environment Variables

| Variable                | Description                    | Default                          |
|-------------------------|--------------------------------|----------------------------------|
| DATABASE_URL            | PostgreSQL connection string   | postgresql://vulnuser:vulnpass@...|
| JWT_SECRET              | JWT signing secret             | (required)                       |
| JWT_EXPIRES_IN          | Session TTL                    | 8h                               |
| SCAN_CONCURRENCY_LIMIT  | Max parallel scans             | 2                                |
| SCAN_ALLOWED_RANGES     | Comma-separated allowed CIDRs  | 10.0.0.0/8,172.16.0.0/12,...    |
| NMAP_BINARY             | Path to nmap binary            | /usr/bin/nmap                    |
