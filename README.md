# Dropshipping E-commerce Platform

Multi-category dropshipping e-commerce website with customer storefront, admin panel, and supplier integrations.

---

## Overview

A full-featured dropshipping platform built with Next.js 14+ App Router. Supports product management via API and CSV import, Stripe payments, and automated order forwarding to suppliers. Designed for multi-category product catalogs with hierarchical categories, inventory tracking, and background job processing.

---

## Quick Start

### Prerequisites

- Node.js 18+
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
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

---

## Project Structure

```
dropshipping/
├── src/                      # Source code
│   ├── app/                  # Next.js App Router
│   │   ├── (shop)/           # Customer storefront pages
│   │   ├── (admin)/admin/    # Admin dashboard pages
│   │   ├── (auth)/           # Authentication pages
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── shop/             # Shop-specific components
│   │   ├── admin/            # Admin-specific components
│   │   └── common/           # Shared components
│   ├── lib/                  # Utilities, clients, configs
│   ├── services/             # Business logic services
│   └── stores/               # Zustand state stores
├── prisma/                   # Database schema & migrations
├── tests/                    # Test files
│   ├── unit/                 # Vitest unit tests
│   └── e2e/                  # Playwright E2E tests
├── docs/                     # Documentation
│   ├── README.md             # Documentation index
│   ├── ARCHITECTURE.md       # System design
│   ├── planning/             # Task management
│   │   ├── TODO.md           # Active tasks
│   │   ├── DONE.md           # Completed tasks
│   │   └── ROADMAP.md        # Long-term vision
│   └── archive/              # Historical documents
├── CLAUDE.md                 # Claude Code configuration
├── PROJECT.md                # Project-specific config
└── README.md                 # This file
```

---

## Documentation

| Document                                             | Description                  |
| ---------------------------------------------------- | ---------------------------- |
| [docs/README.md](docs/README.md)                     | Documentation index          |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System architecture          |
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)   | Decisions, patterns, history |
| [docs/planning/TODO.md](docs/planning/TODO.md)       | Current tasks                |
| [docs/planning/ROADMAP.md](docs/planning/ROADMAP.md) | Project roadmap              |
| [CLAUDE.md](CLAUDE.md)                               | Claude Code rules            |
| [PROJECT.md](PROJECT.md)                             | Project configuration        |

---

## Tech Stack

| Component    | Technology                         |
| ------------ | ---------------------------------- |
| Language     | TypeScript                         |
| Framework    | Next.js 16 (App Router)            |
| Styling      | Tailwind CSS 4 + shadcn/ui + Radix |
| Database     | PostgreSQL with Prisma 7           |
| Auth         | NextAuth.js v5 (Auth.js)           |
| State        | Zustand                            |
| Forms        | React Hook Form + Zod              |
| Payments     | Stripe                             |
| Email        | Resend                             |
| File Storage | S3-compatible (Cloudflare R2)      |
| Queue        | BullMQ + Redis                     |
| Testing      | Vitest (unit) + Playwright (E2E)   |

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

# All pre-commit hooks
pre-commit run --all-files
```

### Running Tests

```bash
# Unit tests (Vitest)
npm run test

# Unit tests with watch mode
npm run test:watch

# E2E tests (Playwright)
npm run test:e2e

# All tests with coverage
npm run test:coverage
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
| `S3_BUCKET_NAME`                     | S3 bucket name              | No       |

### Test Accounts (Development)

After running `npm run db:seed`:

| Role     | Email                | Password    |
| -------- | -------------------- | ----------- |
| Admin    | admin@store.com      | admin123    |
| Customer | customer@example.com | customer123 |

---

## Features

### Customer Storefront

- Product browsing with search and filters
- Hierarchical category navigation
- Shopping cart with localStorage persistence
- Multi-step checkout with Stripe payments
- Order history and tracking
- User account management

### Admin Panel

- Product management (CRUD, CSV import, image upload)
- Category management (hierarchical)
- Order management with status updates
- Supplier management and order forwarding
- Dashboard with statistics

### Technical Features

- Server-side rendering for SEO
- Optimized images with Next.js Image
- Background job processing with BullMQ
- Transactional emails with Resend
- Comprehensive test coverage

---

## Deployment

See [docs/deployment/setup.md](docs/deployment/setup.md) for deployment guides.

### Quick Deploy (Vercel)

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy

### Docker Deployment

```bash
# Build and run production stack
docker-compose -f docker-compose.prod.yml up -d
```

---

## Contributing

1. Check [docs/planning/TODO.md](docs/planning/TODO.md) for open tasks
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow code style (see [PROJECT.md](PROJECT.md))
4. Write tests for new functionality
5. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

_For Claude Code rules, see [CLAUDE.md](CLAUDE.md)._
_For project-specific configuration, see [PROJECT.md](PROJECT.md)._
