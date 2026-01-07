# Architecture

System design and technical architecture for the Dropshipping E-commerce Platform.

**Last Updated**: 2026-01-07

---

## Overview

A multi-category dropshipping e-commerce website built with Next.js 14+ App Router. The system supports customer product browsing, shopping cart, Stripe checkout, and admin management for products, orders, and suppliers.

### System Diagram

```
                                    ┌─────────────────┐
                                    │   Cloudflare    │
                                    │   CDN / WAF     │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
            ┌───────▼───────┐       ┌───────▼───────┐       ┌───────▼───────┐
            │    Browser    │       │    Browser    │       │    Browser    │
            │   (Customer)  │       │    (Admin)    │       │   (Mobile)    │
            └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                                   ┌────────▼────────┐
                                   │    Next.js      │
                                   │  App Router     │
                                   │  (SSR + API)    │
                                   └────────┬────────┘
                                            │
        ┌───────────────┬───────────────────┼───────────────────┬───────────────┐
        │               │                   │                   │               │
┌───────▼───────┐ ┌─────▼─────┐    ┌───────▼───────┐   ┌───────▼───────┐ ┌─────▼─────┐
│  PostgreSQL   │ │   Redis   │    │    Stripe     │   │   S3 / R2     │ │   Resend  │
│  (Database)   │ │  (Queue)  │    │  (Payments)   │   │  (Storage)    │ │  (Email)  │
└───────────────┘ └───────────┘    └───────────────┘   └───────────────┘ └───────────┘
                        │
                ┌───────▼───────┐
                │   BullMQ      │
                │  Workers      │
                │ (Background)  │
                └───────────────┘
```

---

## Layers

### Presentation Layer

**Purpose**: Handle user interface and user interactions

**Components**:

| Component         | Responsibility            | Location               |
| ----------------- | ------------------------- | ---------------------- |
| Shop Pages        | Customer-facing UI        | src/app/(shop)/        |
| Admin Pages       | Admin dashboard UI        | src/app/(admin)/admin/ |
| Auth Pages        | Login/Register UI         | src/app/(auth)/        |
| UI Components     | Reusable UI elements      | src/components/ui/     |
| Shop Components   | Shop-specific components  | src/components/shop/   |
| Admin Components  | Admin-specific components | src/components/admin/  |
| Common Components | Shared components         | src/components/common/ |

**Key Interfaces**:

- React Server Components for SSR/SEO
- Client Components for interactivity (use client directive)
- Zustand store for client-side state (cart)

### Business Logic Layer

**Purpose**: Handle business rules and data processing

**Components**:

| Component          | Responsibility         | Location                         |
| ------------------ | ---------------------- | -------------------------------- |
| Product Service    | Product business logic | src/services/                    |
| Cart Service       | Cart operations        | src/stores/cart.store.ts         |
| Order Service      | Order processing       | src/services/                    |
| Supplier Service   | Supplier integration   | src/services/supplier.service.ts |
| Validation Schemas | Input validation       | src/lib/validations/             |

### API Layer

**Purpose**: Handle HTTP requests and responses

**Components**:

| Component         | Responsibility            | Location              |
| ----------------- | ------------------------- | --------------------- |
| Public API Routes | Customer-facing endpoints | src/app/api/          |
| Admin API Routes  | Admin operations          | src/app/api/admin/    |
| Auth API Routes   | Authentication            | src/app/api/auth/     |
| Webhook Handlers  | External webhooks         | src/app/api/webhooks/ |
| API Utilities     | Common API helpers        | src/lib/api-utils.ts  |

### Data Layer

**Purpose**: Handle data persistence and retrieval

**Components**:

| Component     | Responsibility  | Location             |
| ------------- | --------------- | -------------------- |
| Prisma Client | Database ORM    | src/lib/db.ts        |
| Prisma Schema | Database schema | prisma/schema.prisma |
| Migrations    | Schema changes  | prisma/migrations/   |
| Seed Script   | Test data       | prisma/seed.ts       |

---

## Data Flow

### Customer Purchase Flow

```
1. Browse Products
   └─▶ 2. Add to Cart (Zustand)
       └─▶ 3. Checkout Page
           └─▶ 4. Create Payment Intent (Stripe)
               └─▶ 5. Submit Payment
                   └─▶ 6. Confirm Order (DB Transaction)
                       └─▶ 7. Send Confirmation Email
                           └─▶ 8. Queue Supplier Orders
```

**Description**:

- Products are fetched via Server Components for SEO
- Cart state is managed client-side with Zustand (localStorage persistence)
- Checkout creates a Stripe PaymentIntent with order metadata
- On successful payment, order is created in a database transaction
- Stock is decremented atomically
- Confirmation email sent via Resend
- Supplier orders queued via BullMQ for background processing

### Admin Order Management Flow

```
1. View Order List
   └─▶ 2. View Order Detail
       └─▶ 3. Update Status
           └─▶ 4. Forward to Supplier (Optional)
               └─▶ 5. Track Supplier Status
```

---

## Data Model

### Core Entities

| Entity        | Description                       | Key Fields                        |
| ------------- | --------------------------------- | --------------------------------- |
| User          | Customer and admin accounts       | id, email, role, passwordHash     |
| Product       | Sellable items                    | id, name, slug, price, stock, sku |
| Category      | Product categories (hierarchical) | id, name, slug, parentId          |
| Cart          | Shopping cart per user            | id, userId, items                 |
| Order         | Customer orders                   | id, orderNumber, status, total    |
| OrderItem     | Line items in orders              | id, orderId, productId, quantity  |
| Supplier      | Product suppliers                 | id, name, apiEndpoint, apiKey     |
| SupplierOrder | Orders sent to suppliers          | id, orderId, supplierId, status   |
| Address       | Customer shipping addresses       | id, userId, line1, city, country  |

### Relationships

```
User ──1:N──▶ Order
User ──1:N──▶ Address
User ──1:1──▶ Cart
Cart ──1:N──▶ CartItem ──N:1──▶ Product
Order ──1:N──▶ OrderItem ──N:1──▶ Product
Order ──1:N──▶ SupplierOrder ──N:1──▶ Supplier
Category ──1:N──▶ Product
Category ──1:N──▶ Category (self-referencing for hierarchy)
Supplier ──1:N──▶ Product
```

### Storage

| Data Type       | Storage            | Rationale                  |
| --------------- | ------------------ | -------------------------- |
| User data       | PostgreSQL         | ACID compliance, relations |
| Product images  | S3 / Cloudflare R2 | Scalable, CDN-ready        |
| Sessions        | PostgreSQL         | NextAuth adapter           |
| Background jobs | Redis (BullMQ)     | Fast, in-memory queue      |
| Cart (guest)    | localStorage       | No server roundtrip        |

---

## External Dependencies

### Services

| Service       | Purpose             | Integration Point                  |
| ------------- | ------------------- | ---------------------------------- |
| Stripe        | Payment processing  | src/lib/stripe.ts                  |
| Resend        | Transactional email | src/lib/email.ts                   |
| Cloudflare R2 | Image/file storage  | src/lib/s3.ts                      |
| Redis         | Job queue backing   | src/lib/redis.ts, src/lib/queue.ts |
| Supplier APIs | Order forwarding    | src/services/supplier.service.ts   |

### Key Libraries

| Library                    | Version | Purpose                 |
| -------------------------- | ------- | ----------------------- |
| next                       | 16.x    | React framework         |
| react                      | 19.x    | UI library              |
| @prisma/client             | 7.x     | Database ORM            |
| next-auth                  | 5.x     | Authentication          |
| stripe / @stripe/stripe-js | latest  | Payment processing      |
| zustand                    | latest  | Client state management |
| react-hook-form            | latest  | Form handling           |
| zod                        | latest  | Schema validation       |
| bullmq                     | latest  | Background job queue    |
| resend                     | latest  | Email sending           |
| tailwindcss                | 4.x     | CSS framework           |

---

## Configuration

### Environment Variables

| Variable                           | Purpose                     | Required |
| ---------------------------------- | --------------------------- | -------- |
| DATABASE_URL                       | PostgreSQL connection       | Yes      |
| NEXTAUTH_SECRET                    | Auth encryption key         | Yes      |
| NEXTAUTH_URL                       | Auth callback URL           | Yes      |
| STRIPE_SECRET_KEY                  | Stripe API key              | Yes      |
| STRIPE_WEBHOOK_SECRET              | Stripe webhook verification | Yes      |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe client key           | Yes      |
| RESEND_API_KEY                     | Email service key           | No       |
| AWS_ACCESS_KEY_ID                  | S3 credentials              | No       |
| AWS_SECRET_ACCESS_KEY              | S3 credentials              | No       |
| AWS_REGION                         | S3 region                   | No       |
| S3_BUCKET_NAME                     | S3 bucket name              | No       |
| REDIS_URL                          | Redis connection            | No       |

### Configuration Files

| File                 | Purpose                       |
| -------------------- | ----------------------------- |
| next.config.ts       | Next.js configuration         |
| tailwind.config.ts   | Tailwind CSS configuration    |
| tsconfig.json        | TypeScript configuration      |
| prisma/schema.prisma | Database schema               |
| docker-compose.yml   | Local development services    |
| .env.example         | Environment variable template |

---

## Security

### Authentication

- NextAuth.js v5 with Credentials provider
- Password hashing with bcrypt (12 rounds)
- Session-based authentication (database sessions)
- CSRF protection built into NextAuth
- Role-based access (CUSTOMER, ADMIN)

### Authorization

- Middleware-based route protection (src/middleware.ts)
- Admin routes require ADMIN role
- Protected routes require authentication
- API routes validate session server-side

### Data Protection

- Input validation with Zod schemas at all API boundaries
- SQL injection prevented by Prisma ORM
- XSS prevented by React's default escaping
- Stripe handles all payment card data (PCI compliance)
- Passwords never stored in plain text

---

## Scalability

### Current Limits

| Resource        | Current Capacity  | Bottleneck         |
| --------------- | ----------------- | ------------------ |
| Database        | Single PostgreSQL | Connection pooling |
| Image storage   | Unlimited (S3)    | Bandwidth costs    |
| Background jobs | Single worker     | Redis memory       |
| API requests    | ~100 RPS          | Server CPU/memory  |

### Scaling Strategy

1. **Database**: Add read replicas, connection pooling (PgBouncer)
2. **Application**: Horizontal scaling with load balancer
3. **Images**: CDN caching (Cloudflare)
4. **Background jobs**: Multiple worker instances
5. **Cache**: Add Redis caching for product queries

---

## Error Handling

### Error Categories

| Category       | Handling Strategy             | Example                  |
| -------------- | ----------------------------- | ------------------------ |
| Validation     | Return 400 with field errors  | Invalid email format     |
| Authentication | Return 401, redirect to login | Expired session          |
| Authorization  | Return 403                    | Customer accessing admin |
| Not Found      | Return 404                    | Product not found        |
| Server Error   | Return 500, log to Sentry     | Database connection fail |
| Payment Error  | Display Stripe error message  | Card declined            |

### Logging

- Development: Console logging
- Production: Sentry for error tracking (planned)
- Structured error responses: `{ error: string, code: string, details?: object }`

### Monitoring

- Uptime monitoring (planned)
- Error tracking with Sentry (planned)
- Performance monitoring with Next.js Analytics (planned)

---

## Development Guidelines

### Layer Boundaries

| From Layer     | To Layer       | Allowed? | Notes                            |
| -------------- | -------------- | -------- | -------------------------------- |
| Presentation   | Business Logic | Yes      | Via services/stores              |
| Presentation   | Data           | No       | Use API/Server Components        |
| Business Logic | Data           | Yes      | Via Prisma client                |
| API            | Business Logic | Yes      | Import services directly         |
| API            | Data           | Yes      | Prisma queries allowed in routes |

### Adding New Components

1. Determine if Server or Client Component needed
2. Create component in appropriate directory (shop/, admin/, common/)
3. Add to index.ts export if reusable
4. Write unit tests for complex logic
5. Update documentation if significant

### Breaking Changes

**What constitutes a breaking change**:

- Database schema changes requiring migration
- API response format changes
- Removing or renaming exported functions
- Environment variable changes

**Process for breaking changes**:

1. Create migration for database changes
2. Update all consumers of changed APIs
3. Update environment variable documentation
4. Communicate changes in commit message

---

## Testing Architecture

### Test Levels

| Level  | What's Tested                 | Location                  | Framework  |
| ------ | ----------------------------- | ------------------------- | ---------- |
| Unit   | Services, utilities, stores   | tests/unit/               | Vitest     |
| E2E    | User flows, page interactions | tests/e2e/                | Playwright |
| Manual | Visual, edge cases            | docs/TESTING_CHECKLIST.md | -          |

### Test Configuration

- **Vitest**: jsdom environment, path aliases, coverage reports
- **Playwright**: Multi-browser (Chrome, Firefox, Safari), mobile viewports

---

## Deployment

### Environments

| Environment | Purpose           | Database           | Configuration    |
| ----------- | ----------------- | ------------------ | ---------------- |
| Development | Local development | Docker PostgreSQL  | .env             |
| Staging     | Pre-production    | Managed PostgreSQL | Environment vars |
| Production  | Live site         | Managed PostgreSQL | Environment vars |

### Deployment Process

1. Push to main branch
2. CI/CD runs tests (unit + E2E)
3. Build Next.js application
4. Run database migrations
5. Deploy to hosting platform
6. Verify health checks

### Docker Development

```bash
# Start local services
docker-compose up -d

# Services available:
# - PostgreSQL: localhost:5433
# - Redis: localhost:6380
# - Adminer: localhost:8080
```

---

_See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for decisions and patterns._
_See [planning/TODO.md](planning/TODO.md) for planned architectural changes._
