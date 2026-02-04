# Deployment Setup Guide

Environment setup and deployment documentation for the Dropshipping E-commerce Platform.

**Last Updated**: 2026-01-07

---

## Local Development Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- Docker and Docker Compose
- Git

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd dropshipping

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start Docker services (PostgreSQL, Redis, Adminer)
docker-compose up -d

# 5. Run database migrations
npx prisma migrate dev

# 6. Seed database with test data
npx prisma db seed

# 7. Start development server
npm run dev
```

### Local Services

| Service    | URL                   | Credentials            |
| ---------- | --------------------- | ---------------------- |
| App        | http://localhost:3000 | -                      |
| PostgreSQL | localhost:5433        | postgres/postgres      |
| Redis      | localhost:6380        | -                      |
| Adminer    | http://localhost:8080 | (use PostgreSQL creds) |

### Test Accounts

| Role     | Email                | Password    |
| -------- | -------------------- | ----------- |
| Admin    | admin@store.com      | admin123    |
| Customer | customer@example.com | customer123 |

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dropshipping"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Optional Variables

```bash
# Email (Resend)
RESEND_API_KEY="re_..."

# S3/R2 Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="auto"
S3_BUCKET_NAME="your-bucket"
S3_ENDPOINT="https://..."  # For R2/MinIO

# Redis (for background jobs)
REDIS_URL="redis://localhost:6380"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Monitoring (Sentry)
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Production Deployment

### Recommended Stack

| Component  | Recommended Service     | Alternative       |
| ---------- | ----------------------- | ----------------- |
| Hosting    | Vercel, Railway, Render | VPS (Hetzner, DO) |
| Database   | Neon, Supabase, Railway | Self-hosted PG    |
| Redis      | Upstash, Railway        | Self-hosted Redis |
| Storage    | Cloudflare R2, AWS S3   | MinIO             |
| CDN        | Cloudflare              | CloudFront        |
| Monitoring | Sentry                  | Self-hosted       |

### Deployment Options

#### Option 1: Vercel Deployment

Best for: Serverless, managed infrastructure, automatic scaling

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project
vercel link

# 4. Set environment variables in Vercel dashboard
# - All required variables from .env.example
# - Production values for DATABASE_URL, STRIPE keys, etc.

# 5. Deploy
vercel --prod
```

**Required GitHub Secrets for CI/CD:**

| Secret              | How to Get                                                               |
| ------------------- | ------------------------------------------------------------------------ |
| `VERCEL_TOKEN`      | [Vercel Tokens page](https://vercel.com/account/tokens)                  |
| `VERCEL_ORG_ID`     | Run `vercel link` locally, then `cat .vercel/project.json` → `orgId`     |
| `VERCEL_PROJECT_ID` | Run `vercel link` locally, then `cat .vercel/project.json` → `projectId` |
| `DATABASE_URL`      | Your production database connection string (for migrations)              |

> **Note**: If secrets are not configured, the deploy job will **skip gracefully** with a notice instead of failing.
> If `DEPLOYMENT_TARGET` is explicitly set to `vercel` but secrets are missing, the job will **fail** with an error.

#### Option 2: Docker Deployment

Best for: Self-hosted VPS, full control, consistent environments

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or build manually
docker build -t dropshipping-app .
docker run -p 3000:3000 --env-file .env dropshipping-app
```

**Docker files provided:**

- `Dockerfile` - Main application container
- `Dockerfile.workers` - Background workers container
- `docker-compose.prod.yml` - Production compose configuration
- `.dockerignore` - Build exclusions

#### Option 3: VPS Deployment with PM2

Best for: Traditional VPS hosting with process management

```bash
# 1. Clone repository
git clone <repository-url> /var/www/dropshipping
cd /var/www/dropshipping

# 2. Install dependencies
npm ci --production

# 3. Build application
npm run build

# 4. Set up environment
cp .env.example .env
# Edit .env with production values

# 5. Run migrations
npx prisma migrate deploy

# 6. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### VPS Server Setup

#### Initial Server Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Install PostgreSQL (or use managed)
sudo apt install -y postgresql postgresql-contrib

# 5. Install Redis
sudo apt install -y redis-server

# 6. Install Nginx
sudo apt install -y nginx
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/dropshipping
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Database Setup

### PostgreSQL (Production)

```bash
# Create database and user
sudo -u postgres psql

CREATE USER dropshipping WITH PASSWORD 'secure-password';
CREATE DATABASE dropshipping OWNER dropshipping;
GRANT ALL PRIVILEGES ON DATABASE dropshipping TO dropshipping;
\q

# Connection string
DATABASE_URL="postgresql://dropshipping:secure-password@localhost:5432/dropshipping"
```

### Managed PostgreSQL

**Neon** (Recommended for Vercel):

1. Create project at neon.tech
2. Copy connection string
3. Use pooled connection for serverless

**Supabase**:

1. Create project at supabase.com
2. Go to Settings > Database
3. Copy connection string (use "Connection pooling" for serverless)

---

## Stripe Setup

### Test Mode Setup

1. Create account at stripe.com
2. Go to Developers > API keys
3. Copy test keys to `.env`

### Production Setup

1. Complete Stripe account verification
2. Switch to live mode
3. Copy live keys to production environment
4. Update webhook endpoint

### Webhook Configuration

```bash
# Development: Use Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Production: Configure in Stripe Dashboard
# Endpoint: https://yourdomain.com/api/webhooks/stripe
# Events: payment_intent.succeeded, payment_intent.payment_failed
```

---

## S3/R2 Storage Setup

### Cloudflare R2 (Recommended)

1. Create R2 bucket in Cloudflare dashboard
2. Create API token with R2 access
3. Configure environment variables:

```bash
AWS_ACCESS_KEY_ID="your-r2-access-key-id"
AWS_SECRET_ACCESS_KEY="your-r2-secret-access-key"
AWS_REGION="auto"
S3_BUCKET_NAME="your-bucket-name"
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
```

### AWS S3

1. Create S3 bucket
2. Create IAM user with S3 access
3. Configure bucket CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## Background Workers

### Starting Workers

```bash
# Start all workers
npm run workers

# Or individually
npm run workers:forward  # Order forwarding
npm run workers:sync     # Status sync
```

### PM2 Worker Configuration

The project includes `ecosystem.config.js` for PM2 process management:

```bash
# Start all services
pm2 start ecosystem.config.js --env production

# View status
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all
```

**PM2 processes configured:**

- `dropshipping-web` - Main Next.js application (cluster mode)
- `dropshipping-workers` - Background job workers (fork mode)

---

## CI/CD Pipeline

The project includes GitHub Actions workflows in `.github/workflows/`:

### CI Workflow (`.github/workflows/ci.yml`)

Runs on all PRs and pushes to main/develop:

1. **Lint & Type Check** - ESLint, TypeScript, Prettier
2. **Unit Tests** - Vitest with coverage
3. **Build** - Production build verification
4. **E2E Tests** - Playwright tests with PostgreSQL/Redis services

### Deploy Workflow (`.github/workflows/deploy.yml`)

Runs on push to main or manual trigger:

1. Runs CI workflow
2. Deploys to Vercel (default) or VPS via SSH
3. Runs database migrations
4. Sends deployment notification

### Required GitHub Secrets

| Secret              | Purpose                               | Required For |
| ------------------- | ------------------------------------- | ------------ |
| `VERCEL_TOKEN`      | Vercel API access token               | Vercel       |
| `VERCEL_ORG_ID`     | Vercel organization/team ID           | Vercel       |
| `VERCEL_PROJECT_ID` | Vercel project ID                     | Vercel       |
| `DATABASE_URL`      | Production database connection string | Vercel       |
| `VPS_HOST`          | VPS hostname or IP address            | VPS          |
| `VPS_USERNAME`      | VPS SSH username                      | VPS          |
| `VPS_SSH_KEY`       | VPS SSH private key                   | VPS          |
| `CODECOV_TOKEN`     | Coverage reporting (optional)         | CI           |

### GitHub Variables

| Variable            | Purpose                             |
| ------------------- | ----------------------------------- |
| `DEPLOYMENT_TARGET` | `vercel` or `vps` (default: vercel) |

### Deployment Validation

The deploy workflow validates that required secrets are configured before running:

- **Vercel (default)**: Checks `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`
  - If `DEPLOYMENT_TARGET` is unset/empty and secrets are missing → **skips gracefully** with a notice
  - If `DEPLOYMENT_TARGET` is `vercel` and secrets are missing → **fails** with an error
- **VPS**: Checks `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`
  - If any secret is missing → **fails** with an error (VPS deployment is always explicit)

This means CI stays green even when deployment is not yet configured.

---

## Monitoring Setup

### Sentry (Error Tracking)

Sentry is pre-configured in the project. To enable:

1. Create project at sentry.io
2. Get DSN from project settings
3. Set environment variables:

```bash
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ORG="your-org"
SENTRY_PROJECT="dropshipping"
```

**Configuration files:**

- `sentry.client.config.ts` - Browser error tracking
- `sentry.server.config.ts` - Server error tracking
- `sentry.edge.config.ts` - Edge runtime tracking
- `instrumentation.ts` - Next.js instrumentation

### Health Check Endpoint

The application includes a comprehensive health check at `/api/health`:

```bash
# Check application health
curl https://yourdomain.com/api/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-07T12:00:00.000Z",
  "version": "0.1.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok", "latency": 5 },
    "redis": { "status": "ok", "latency": 2 }
  }
}
```

**Status codes:**

- `200` - Healthy or degraded
- `503` - Critical services down

### Uptime Monitoring

Configure monitoring service (UptimeRobot, Better Uptime, Pingdom) to check:

| Endpoint      | Check Frequency | Alert Threshold |
| ------------- | --------------- | --------------- |
| `/api/health` | 1 minute        | 2 failures      |
| `/`           | 5 minutes       | 3 failures      |

---

## Pre-deployment Checklist

### Environment

- [ ] All required environment variables set
- [ ] Production database connection string
- [ ] Stripe live keys configured
- [ ] S3/R2 bucket configured
- [ ] Redis configured (if using workers)

### Security

- [ ] NEXTAUTH_SECRET is unique and secure (min 32 chars)
- [ ] Database credentials are secure
- [ ] Stripe webhook secret configured
- [ ] CORS configured for storage
- [ ] SSL certificate installed

### Database

- [ ] Migrations applied (`prisma migrate deploy`)
- [ ] Database is backed up
- [ ] Connection pooling configured (for serverless)

### Application

- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] E2E tests pass (`npm run test:e2e`)

### External Services

- [ ] Stripe webhook endpoint configured
- [ ] Email service configured (Resend)
- [ ] CDN configured (images)

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured
- [ ] Logs accessible
- [ ] Health check endpoint accessible

---

## Troubleshooting

### Common Issues

**Database connection errors**:

- Check DATABASE_URL format
- Verify database server is running
- Check firewall rules
- For serverless: use connection pooling

**Stripe webhook errors**:

- Verify webhook secret matches
- Check webhook URL is accessible
- Verify events are selected
- Check for HTTPS requirement in production

**Image upload failures**:

- Check S3 credentials
- Verify bucket CORS configuration
- Check bucket permissions
- Verify S3_ENDPOINT for R2/MinIO

**Build failures**:

- Clear `.next` directory
- Run `npm ci` (clean install)
- Check for TypeScript errors
- Verify all env vars are set

**Sentry not reporting errors**:

- Verify DSN is correct
- Check that `enabled: true` in config
- Ensure SENTRY_DSN env var is set

**Health check failing**:

- Check database connection
- Verify Redis is running (if configured)
- Check application logs

**Vercel deployment skipped in CI**:

- This means Vercel secrets are not configured (expected if deployment not set up yet)
- To enable: add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` to GitHub secrets
- Get IDs by running `vercel link` locally, then `cat .vercel/project.json`
- Get token from https://vercel.com/account/tokens

**Vercel deployment failing with "missing secrets" error**:

- This happens when `DEPLOYMENT_TARGET` is set to `vercel` but secrets are missing
- Either add the missing secrets or remove the `DEPLOYMENT_TARGET` variable

---

## Deployment File Reference

| File                           | Purpose                   |
| ------------------------------ | ------------------------- |
| `.github/workflows/ci.yml`     | CI pipeline configuration |
| `.github/workflows/deploy.yml` | Deployment pipeline       |
| `Dockerfile`                   | Application container     |
| `Dockerfile.workers`           | Workers container         |
| `docker-compose.yml`           | Development services      |
| `docker-compose.prod.yml`      | Production deployment     |
| `.dockerignore`                | Docker build exclusions   |
| `ecosystem.config.js`          | PM2 process configuration |
| `sentry.*.config.ts`           | Sentry error tracking     |
| `instrumentation.ts`           | Next.js instrumentation   |

---

_See [ARCHITECTURE.md](../ARCHITECTURE.md) for system design._
_See [planning/TODO.md](../planning/TODO.md) for deployment tasks._
