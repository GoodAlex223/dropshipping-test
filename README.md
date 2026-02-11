# Dropshipping E-commerce Platform

Multi-category dropshipping e-commerce website with customer storefront, admin panel, and supplier integrations.

---

## Overview

A full-featured dropshipping platform built with Next.js 14 App Router. Supports product management via API and CSV import, Stripe payments, automated order forwarding to suppliers, customer reviews, newsletter subscriptions, and GA4 analytics. Designed for multi-category product catalogs with hierarchical categories, inventory tracking, and background job processing.

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Redis (for background jobs)
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dropshipping

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start database services (Docker)
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Seed the database with test data
npm run db:seed
```

### Running

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Background workers (separate terminal)
npm run workers
```

### Testing

```bash
# Run unit tests (249 tests)
npm run test:run

# Run E2E tests
npm run test:e2e

# Run with coverage (~90% statement coverage)
npm run test:coverage
```

---

## Features

### Customer Storefront

- Product browsing with search, filters, and sorting
- Hierarchical category navigation
- Shopping cart with localStorage persistence
- Multi-step checkout with Stripe payments
- Order history and tracking
- User account management
- Product reviews with verified purchase validation
- Newsletter subscription with double opt-in email confirmation

### Admin Panel

- Product management (CRUD, CSV import, S3 image upload)
- Category management (hierarchical)
- Order management with status updates and CSV export
- Supplier management and order forwarding
- Customer review moderation (reply, hide/show, delete)
- Newsletter subscriber management (search, filter, export CSV)
- Dashboard with statistics

### Marketing & SEO

- Server-side rendering for SEO with dynamic metadata
- Dynamic Open Graph images for product pages
- Social sharing buttons (Facebook, X, Pinterest, WhatsApp, Telegram, native share)
- Google Shopping XML product feed
- Dynamic sitemap and robots.txt
- JSON-LD structured data with review markup

### Analytics & Performance

- GA4 e-commerce tracking via Google Tag Manager (9 events)
- GDPR-compliant cookie consent banner
- Core Web Vitals tracking (CLS, LCP, FCP, TTFB, INP)
- Image blur placeholders (shimmer effect)
- Resource hints (preconnect/dns-prefetch)
- Deferred font loading

### Technical

- Background job processing with BullMQ
- Transactional emails with Resend
- Comprehensive test coverage (249 unit tests, E2E tests)
- GitHub Actions CI/CD with dual deployment (Vercel/VPS)
- Multi-theme showcase system (bold, luxury, organic)

---

## Tech Stack

| Component    | Technology                         |
| ------------ | ---------------------------------- |
| Language     | TypeScript                         |
| Framework    | Next.js 14 (App Router)            |
| UI Library   | React 18                           |
| Styling      | Tailwind CSS 4 + shadcn/ui + Radix |
| Database     | PostgreSQL with Prisma 6           |
| Auth         | NextAuth.js v5 (Auth.js)           |
| State        | Zustand                            |
| Forms        | React Hook Form + Zod              |
| Payments     | Stripe                             |
| Email        | Resend                             |
| File Storage | S3-compatible (AWS/Cloudflare R2)  |
| Queue        | BullMQ + Redis                     |
| Analytics    | GA4 via Google Tag Manager         |
| Testing      | Vitest (unit) + Playwright (E2E)   |

---

## Project Structure

```
dropshipping/
├── src/                      # Source code
│   ├── app/                  # Next.js App Router
│   │   ├── (shop)/           # Customer storefront pages
│   │   ├── (admin)/admin/    # Admin dashboard pages
│   │   ├── (auth)/           # Authentication pages
│   │   ├── api/              # API routes
│   │   ├── feed/             # Product feeds (Google Shopping)
│   │   └── newsletter/       # Newsletter confirmation/unsubscribe
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── shop/             # Shop-specific components
│   │   ├── admin/            # Admin-specific components
│   │   ├── reviews/          # Review system components
│   │   ├── analytics/        # Analytics tracking components
│   │   ├── products/         # Product card, social sharing
│   │   └── common/           # Header, Footer, CookieConsent
│   ├── lib/                  # Utilities, clients, configs
│   │   └── validations/      # Zod schemas for all entities
│   ├── services/             # Business logic services
│   ├── stores/               # Zustand state stores
│   └── types/                # TypeScript types
├── prisma/                   # Database schema & migrations
│   └── seed-data/            # Modular seed data files
├── tests/                    # Test files
│   ├── unit/                 # Vitest unit tests (249 tests)
│   ├── e2e/                  # Playwright E2E tests
│   └── helpers/              # Test utilities
├── docs/                     # Documentation
│   ├── README.md             # Documentation index
│   ├── ARCHITECTURE.md       # System design
│   ├── planning/             # Task management
│   └── archive/              # Historical documents
├── CLAUDE.md                 # Claude Code configuration
├── PROJECT.md                # Project-specific config
├── LICENSE                   # MIT License
└── README.md                 # This file
```

---

## Documentation

| Document                                             | Description                  |
| ---------------------------------------------------- | ---------------------------- |
| [docs/README.md](docs/README.md)                     | Documentation index          |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System architecture          |
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)   | Decisions, patterns, history |
| [docs/api/endpoints.md](docs/api/endpoints.md)       | API endpoint reference       |
| [docs/database/schema.md](docs/database/schema.md)   | Database schema docs         |
| [docs/deployment/setup.md](docs/deployment/setup.md) | Deployment guide             |
| [docs/planning/TODO.md](docs/planning/TODO.md)       | Current tasks                |
| [docs/planning/ROADMAP.md](docs/planning/ROADMAP.md) | Project roadmap              |

---

## Development

### Setup Development Environment

```bash
# Start local services (PostgreSQL, Redis, Adminer)
docker-compose up -d

# Services available:
# - PostgreSQL: localhost:5433
# - Redis: localhost:6380
# - Adminer (DB GUI): localhost:8080

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (DB GUI)
npx prisma studio
```

### Code Quality

```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run typecheck
```

---

## Configuration

### Environment Variables

| Variable                             | Description                 | Required |
| ------------------------------------ | --------------------------- | -------- |
| `DATABASE_URL`                       | PostgreSQL connection       | Yes      |
| `NEXTAUTH_SECRET`                    | Auth encryption key         | Yes      |
| `NEXTAUTH_URL`                       | Auth callback URL           | Yes      |
| `STRIPE_SECRET_KEY`                  | Stripe API key              | Yes      |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook verification | Yes      |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key           | Yes      |
| `RESEND_API_KEY`                     | Email service key           | No       |
| `REDIS_URL`                          | Redis connection for queues | No       |
| `AWS_ACCESS_KEY_ID`                  | S3 credentials              | No       |
| `AWS_SECRET_ACCESS_KEY`              | S3 credentials              | No       |
| `NEXT_PUBLIC_GTM_ID`                 | Google Tag Manager ID       | No       |
| `NEXT_PUBLIC_APP_URL`                | Application base URL        | No       |

See [.env.example](.env.example) for full list with descriptions.

### Test Accounts (Development)

After running `npm run db:seed`:

| Role     | Email                | Password    |
| -------- | -------------------- | ----------- |
| Admin    | admin@store.com      | admin123    |
| Customer | customer@example.com | customer123 |

Additional test customers: alice@example.com, bob@example.com, carol@example.com, diana@example.com (password: customer123)

---

## Deployment

See [docs/deployment/setup.md](docs/deployment/setup.md) for full deployment guides.

### Quick Deploy (Vercel)

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy

### Docker Deployment

```bash
# Build and run production stack
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD

GitHub Actions workflows handle CI (lint, typecheck, tests, build) and deployment (Vercel or VPS). See [docs/deployment/setup.md](docs/deployment/setup.md) for required secrets.

---

## Contributing

1. Check [docs/planning/TODO.md](docs/planning/TODO.md) for open tasks
2. Create a feature branch: `git checkout -b feat/task-NNN-description`
3. Follow code style (see [PROJECT.md](PROJECT.md))
4. Write tests for new functionality
5. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

_For Claude Code rules, see [CLAUDE.md](CLAUDE.md)._
_For project-specific configuration, see [PROJECT.md](PROJECT.md)._
