# PROJECT.md

Project-specific configuration. Universal rules are in [CLAUDE.md](CLAUDE.md).

**Last Updated**: 2026-01-26

---

## Project Overview

Multi-category dropshipping e-commerce website with customer storefront, admin panel, and supplier integrations. Supports product management via API and CSV import, Stripe payments, and automated order forwarding to suppliers.

### Tech Stack

| Component    | Technology                         |
| ------------ | ---------------------------------- |
| Language     | TypeScript                         |
| Framework    | Next.js 16 (App Router)            |
| Styling      | Tailwind CSS 4 + shadcn/ui + Radix |
| Database     | PostgreSQL                         |
| ORM          | Prisma 7                           |
| Auth         | NextAuth.js (Auth.js v5)           |
| State        | Zustand                            |
| Forms        | React Hook Form + Zod              |
| Payments     | Stripe                             |
| Email        | Resend                             |
| File Storage | S3-compatible (Cloudflare R2)      |
| Queue        | BullMQ + Redis                     |
| Testing      | Vitest (unit) + Playwright (E2E)   |

---

## Project Structure

| Component      | Location                 | Purpose                  |
| -------------- | ------------------------ | ------------------------ |
| Entry Point    | `src/app/`               | Next.js App Router pages |
| Components     | `src/components/`        | React components         |
| Business Logic | `src/services/`          | Service layer            |
| Database       | `prisma/`                | Schema and migrations    |
| API Routes     | `src/app/api/`           | Backend API              |
| Tests          | `tests/`                 | Unit and E2E tests       |
| Config         | `.env`, `next.config.js` | Configuration files      |

---

## Commands

### Development

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Run development server
npm run dev

# Run with database studio
npx prisma studio
```

### Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Format code
npm run format

# All pre-commit hooks
pre-commit run --all-files
```

---

## Critical Systems (Tier Classification)

| Tier | Description | Examples                                 | Modification Rules              |
| ---- | ----------- | ---------------------------------------- | ------------------------------- |
| 1    | Critical    | Payment processing, Order creation, Auth | Requires explicit user approval |
| 2    | Important   | Cart logic, Product pricing, Inventory   | Requires plan review            |
| 3    | Standard    | Product display, Search, Filtering       | Standard workflow               |
| 4    | Low-risk    | Admin UI, Documentation, Tests           | Proceed with normal care        |

---

## Project-Specific Conventions

### Naming Conventions

| Element          | Convention                       | Example                 |
| ---------------- | -------------------------------- | ----------------------- |
| Components       | PascalCase                       | `ProductCard.tsx`       |
| Hooks            | camelCase with `use` prefix      | `useCart.ts`            |
| Services         | camelCase with `.service` suffix | `order.service.ts`      |
| API routes       | kebab-case folders               | `api/checkout/route.ts` |
| Database tables  | PascalCase (Prisma)              | `Product`, `OrderItem`  |
| Environment vars | SCREAMING_SNAKE_CASE             | `DATABASE_URL`          |

### Code Patterns

- **Server Components by default**: Only use `"use client"` when necessary
- **Server Actions for mutations**: Prefer Server Actions over API routes for forms
- **Zod for all validation**: Input validation at API boundaries
- **Service layer**: Business logic in `services/`, not in routes
- **Optimistic updates**: Use for cart operations

### Error Handling

- Use custom `AppError` class for business logic errors
- Structured error responses: `{ error: string, code: string, details?: object }`
- Log errors with context to Sentry
- User-friendly error messages, no stack traces in production

---

## External Dependencies

### APIs

| Service       | Purpose                        | Docs Location                        |
| ------------- | ------------------------------ | ------------------------------------ |
| Stripe        | Payment processing             | https://stripe.com/docs              |
| Resend        | Transactional emails           | https://resend.com/docs              |
| Cloudflare R2 | File storage                   | https://developers.cloudflare.com/r2 |
| Supplier APIs | Product sync, Order forwarding | docs/suppliers/                      |

### Configuration

| Variable                | Purpose                     | Location |
| ----------------------- | --------------------------- | -------- |
| `DATABASE_URL`          | PostgreSQL connection       | .env     |
| `NEXTAUTH_SECRET`       | Auth encryption key         | .env     |
| `STRIPE_SECRET_KEY`     | Stripe API key              | .env     |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | .env     |
| `RESEND_API_KEY`        | Email service key           | .env     |
| `R2_ACCESS_KEY_ID`      | R2 storage credentials      | .env     |
| `R2_SECRET_ACCESS_KEY`  | R2 storage credentials      | .env     |
| `R2_BUCKET_NAME`        | R2 bucket name              | .env     |
| `REDIS_URL`             | Redis connection for queues | .env     |

---

## Domain-Specific Documentation

| Document                                                                                                         | Purpose                            |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [docs/archive/plans/2026-01-05_dropshipping-mvp-plan.md](docs/archive/plans/2026-01-05_dropshipping-mvp-plan.md) | MVP implementation plan (complete) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                                                     | System architecture                |
| [docs/database/schema.md](docs/database/schema.md)                                                               | Database schema docs               |
| [docs/api/endpoints.md](docs/api/endpoints.md)                                                                   | API endpoint reference             |
| [docs/deployment/setup.md](docs/deployment/setup.md)                                                             | Deployment guide                   |

---

## Deployment

### Environments

| Environment | URL/Location     | Branch  | Status      |
| ----------- | ---------------- | ------- | ----------- |
| Development | localhost:3000   | develop | Active      |
| Demo        | Vercel (Neon DB) | main    | Deployed    |
| Production  | TBD              | main    | Not Started |

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Stripe webhooks configured
- [ ] Email templates tested
- [ ] Performance audit passed

---

## Known Limitations

1. **Single currency**: USD only initially
2. **Single language**: English only initially
3. **No real-time shipping rates**: Flat rate shipping
4. **Manual supplier sync**: Background jobs only, no real-time

---

## Contact / Ownership

| Role       | Contact |
| ---------- | ------- |
| Maintainer | TBD     |

---

_For universal Claude Code rules, see [CLAUDE.md](CLAUDE.md)._
_For documentation index, see [docs/README.md](docs/README.md)._
