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

### Vercel Deployment

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

### VPS Deployment

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

#### Application Deployment

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
pm2 start npm --name "dropshipping" -- start
pm2 save
pm2 startup
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

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "dropshipping-web",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "dropshipping-workers",
      script: "npm",
      args: "run workers",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:run

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: vercel/actions/cli@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

---

## Monitoring Setup

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs

# Run Sentry wizard
npx @sentry/wizard@latest -i nextjs
```

### Health Check Endpoint

Create `/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

### Uptime Monitoring

Configure monitoring service (UptimeRobot, Better Uptime) to check:

- `GET /api/health` - Application health
- `GET /` - Homepage loads

---

## Pre-deployment Checklist

### Environment

- [ ] All required environment variables set
- [ ] Production database connection string
- [ ] Stripe live keys configured
- [ ] S3/R2 bucket configured
- [ ] Redis configured (if using workers)

### Security

- [ ] NEXTAUTH_SECRET is unique and secure
- [ ] Database credentials are secure
- [ ] Stripe webhook secret configured
- [ ] CORS configured for storage

### Database

- [ ] Migrations applied (`prisma migrate deploy`)
- [ ] Database is backed up
- [ ] Connection pooling configured (for serverless)

### Application

- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Type checking passes (`npm run typecheck`)

### External Services

- [ ] Stripe webhook endpoint configured
- [ ] Email service configured (Resend)
- [ ] CDN configured (images)

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured
- [ ] Logs accessible

---

## Troubleshooting

### Common Issues

**Database connection errors**:

- Check DATABASE_URL format
- Verify database server is running
- Check firewall rules

**Stripe webhook errors**:

- Verify webhook secret matches
- Check webhook URL is accessible
- Verify events are selected

**Image upload failures**:

- Check S3 credentials
- Verify bucket CORS configuration
- Check bucket permissions

**Build failures**:

- Clear `.next` directory
- Run `npm ci` (clean install)
- Check for TypeScript errors

---

_See [ARCHITECTURE.md](../ARCHITECTURE.md) for system design._
_See [planning/TODO.md](../planning/TODO.md) for deployment tasks._
