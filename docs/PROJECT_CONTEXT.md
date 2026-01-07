# Project Context

Accumulated knowledge, decisions, and patterns for the Dropshipping E-commerce Platform.

**Last Updated**: 2026-01-07

---

## Overview

Multi-category dropshipping e-commerce website built with Next.js 14+ App Router. Supports product management via API and CSV import, Stripe payments, and automated order forwarding to suppliers.

**Project Start**: 2026-01-05
**Current Status**: MVP Implementation Complete (Phases 1-5.2)
**Remaining**: Deployment (Phase 5.3)

---

## Key Decisions

### Decision Log

| Date       | Decision                   | Rationale                                        | Alternatives Considered        |
| ---------- | -------------------------- | ------------------------------------------------ | ------------------------------ |
| 2026-01-05 | Next.js 14+ App Router     | Modern patterns, SSR/SSG, great DX               | Pages Router, separate backend |
| 2026-01-05 | Prisma ORM                 | Type-safe queries, migrations, good DX           | Raw SQL, Drizzle, TypeORM      |
| 2026-01-05 | Zustand for cart state     | Lightweight, TypeScript-friendly                 | Redux, Jotai, React Context    |
| 2026-01-05 | Stripe for payments        | Industry standard, excellent docs, PCI compliant | PayPal, Square                 |
| 2026-01-05 | BullMQ for background jobs | Reliable, Redis-backed, good monitoring          | pg-boss, custom solution       |
| 2026-01-05 | S3/R2 for file storage     | Scalable, CDN-ready, cost-effective              | Local storage, Cloudinary      |
| 2026-01-05 | shadcn/ui components       | Customizable, accessible, Tailwind-based         | MUI, Chakra, custom components |

### Major Architectural Decisions

#### ADR-001: Next.js App Router over Pages Router

**Date**: 2026-01-05
**Context**: Needed to choose routing approach for the Next.js application
**Decision**: Use App Router with Server Components
**Rationale**:

- Server Components provide better SEO out of the box
- Layouts and nested routing reduce boilerplate
- Streaming and Suspense improve UX
- Future-proof as Next.js direction

**Alternatives**:

- Pages Router: More mature but less flexible
- Separate backend: More complexity, deployment overhead

**Consequences**:

- Some libraries needed compatibility updates
- Learning curve for Server vs Client Components
- Better performance for product pages

**Status**: Active

---

#### ADR-002: Client-side Cart with Zustand

**Date**: 2026-01-05
**Context**: Needed cart state management that works for both guest and logged-in users
**Decision**: Zustand store with localStorage persistence
**Rationale**:

- No server roundtrip for cart operations
- Works for guest users without authentication
- Instant UI updates with optimistic rendering
- Persist middleware handles storage automatically

**Alternatives**:

- Server-side cart only: Requires authentication
- React Context: More boilerplate, less features

**Consequences**:

- Cart validation needed at checkout (stock may change)
- Hydration handling required for SSR
- Cart merge needed when user logs in (future enhancement)

**Status**: Active

---

#### ADR-003: Multi-step Checkout Flow

**Date**: 2026-01-05
**Context**: Design checkout UX for the e-commerce site
**Decision**: Three-step checkout (Address → Shipping → Payment)
**Rationale**:

- Clear progress indication reduces abandonment
- Allows address validation before payment
- Shipping method affects final total
- Easier to debug issues

**Alternatives**:

- Single-page checkout: Faster but more complex UX
- Accordion style: Can be overwhelming

**Consequences**:

- More code to manage step state
- Better analytics per step
- Easier A/B testing in future

**Status**: Active

---

## Patterns

### Code Patterns

| Pattern               | When to Use                          | Example                             |
| --------------------- | ------------------------------------ | ----------------------------------- |
| Server Components     | Data fetching, SEO-critical pages    | Product detail, category pages      |
| Client Components     | Interactivity, forms, client state   | Cart drawer, checkout form          |
| API Routes            | External webhooks, complex mutations | Stripe webhooks, order confirmation |
| Server Actions        | Form submissions (future)            | Not currently used                  |
| Zustand stores        | Client-side global state             | Cart state                          |
| React Hook Form + Zod | All forms                            | Checkout, login, product forms      |

### Component Patterns

```typescript
// Server Component (default)
// src/app/(shop)/products/[slug]/page.tsx
export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({ where: { slug: params.slug } });
  return <ProductDetailClient product={product} />;
}

// Client Component
// src/app/(shop)/products/[slug]/product-detail-client.tsx
"use client";
export function ProductDetailClient({ product }) {
  const { addItem } = useCartStore();
  // Interactive logic here
}
```

### API Route Pattern

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const session = await requireAuth(); // Throws 401 if not authenticated
  // ... handle request
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(); // Throws 403 if not admin
  const body = await request.json();
  const validated = schema.parse(body); // Zod validation
  // ... handle request
}
```

### Anti-Patterns

| Anti-Pattern                    | Why Avoid                    | Better Alternative                |
| ------------------------------- | ---------------------------- | --------------------------------- |
| Fetching in Client Components   | Poor SEO, waterfall requests | Server Components or SWR          |
| Large Client Components         | Increases bundle size        | Split into smaller components     |
| Inline API calls in components  | Hard to test, no caching     | Use services or Server Components |
| Storing sensitive data in state | Security risk                | Server-only handling              |

---

## Conventions

### Naming

| Element          | Convention                   | Example                     |
| ---------------- | ---------------------------- | --------------------------- |
| Components       | PascalCase                   | ProductCard.tsx             |
| Hooks            | camelCase with `use` prefix  | useCartStore.ts             |
| Services         | camelCase with `.service`    | supplier.service.ts         |
| API routes       | kebab-case folders           | api/admin/products/route.ts |
| Database tables  | snake_case (via @@map)       | product_images              |
| Environment vars | SCREAMING_SNAKE_CASE         | DATABASE_URL                |
| Types/Interfaces | PascalCase                   | Product, CartItem           |
| Zod schemas      | camelCase with Schema suffix | productSchema               |

### File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (shop)/            # Customer routes (grouped)
│   ├── (admin)/           # Admin routes (grouped)
│   ├── (auth)/            # Auth routes (grouped)
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── shop/              # Shop-specific components
│   ├── admin/             # Admin-specific components
│   └── common/            # Shared components
├── lib/                   # Utilities, clients, configs
├── services/              # Business logic services
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks
```

### Code Style

- Server Components by default, `"use client"` only when needed
- Prefer Server Actions for mutations (future)
- Always validate inputs with Zod at API boundaries
- Use `async/await` over `.then()` chains
- Destructure props in function signature
- Export types alongside functions when needed

---

## Domain Knowledge

### Glossary

| Term             | Definition                                       |
| ---------------- | ------------------------------------------------ |
| Dropshipping     | Retail model where seller doesn't hold inventory |
| SKU              | Stock Keeping Unit - unique product identifier   |
| Supplier Order   | Order sent to supplier for fulfillment           |
| Payment Intent   | Stripe object representing a payment attempt     |
| Compare Price    | Original/strikethrough price (before discount)   |
| Featured Product | Product highlighted on homepage                  |
| Slug             | URL-friendly identifier (e.g., "blue-widget")    |

### Business Rules

| Rule                        | Description                            | Implemented In            |
| --------------------------- | -------------------------------------- | ------------------------- |
| Stock validation            | Cannot purchase more than available    | Cart validation, checkout |
| Price at purchase           | Order stores price at time of purchase | Order creation            |
| Admin-only product creation | Only admins can create/edit products   | API middleware            |
| Order number format         | ORD-YYYYMMDD-XXXX                      | src/lib/stripe.ts         |
| Guest checkout              | Users can checkout without account     | Checkout flow             |

---

## Known Issues

### Technical Debt

| Issue                      | Impact                   | Remediation Plan            | Priority |
| -------------------------- | ------------------------ | --------------------------- | -------- |
| No cart merge on login     | Guest cart lost on login | Implement cart sync service | Medium   |
| E2E tests need prod build  | Slow CI, unreliable dev  | Pre-compile in CI           | Low      |
| No product search indexing | Basic search only        | Add Meilisearch             | Low      |

### Workarounds

| Issue                        | Workaround                       | Permanent Fix Needed |
| ---------------------------- | -------------------------------- | -------------------- |
| Prisma Decimal serialization | Convert to string for JSON       | No                   |
| Middleware Edge runtime      | Added `runtime = "nodejs"`       | No                   |
| Hydration mismatch for cart  | `useEffect` for client rendering | No                   |

---

## Historical Context

### Project Evolution

- **2026-01-05**: Project initialized with Next.js 16, TypeScript, Prisma
- **2026-01-05**: Completed all MVP phases (1-5.2)
- **2026-01-07**: Documentation completion

### Deprecated Approaches

| What | When Deprecated | Replaced By | Why                 |
| ---- | --------------- | ----------- | ------------------- |
| -    | -               | -           | No deprecations yet |

---

## Lessons Learned

### What Works Well

- **Server Components for product pages**: Excellent SEO, fast initial load
- **Zustand for cart**: Simple API, great DevTools, easy persistence
- **shadcn/ui**: Customizable, accessible, good defaults
- **Prisma**: Type safety catches errors early, migrations are painless
- **React Hook Form + Zod**: Great DX for form handling

### What to Avoid

- **Large client bundles**: Keep interactivity minimal, use Server Components
- **Fetching in useEffect**: Use Server Components or SWR instead
- **Storing Decimal as number**: Use string for precision

### Insights

- Next.js App Router requires thinking about Server vs Client boundaries
- Stripe Elements significantly simplifies PCI compliance
- BullMQ with Redis provides reliable background processing
- Pre-compiling pages before E2E tests makes them more reliable

---

## References

| Resource                                  | Purpose             |
| ----------------------------------------- | ------------------- |
| [Next.js Docs](https://nextjs.org/docs)   | Framework reference |
| [Prisma Docs](https://www.prisma.io/docs) | ORM reference       |
| [Stripe Docs](https://stripe.com/docs)    | Payment integration |
| [shadcn/ui](https://ui.shadcn.com)        | Component library   |
| [Zustand](https://zustand-demo.pmnd.rs)   | State management    |

---

_Updated after each significant task completion._
_See [ARCHITECTURE.md](ARCHITECTURE.md) for system design._
_See [planning/TODO.md](planning/TODO.md) for active tasks._
