# Project Context

Accumulated knowledge, decisions, and patterns for the Dropshipping E-commerce Platform.

**Last Updated**: 2026-02-10

---

## Overview

Multi-category dropshipping e-commerce website built with Next.js 14 App Router. Supports product management via API and CSV import, Stripe payments, automated order forwarding to suppliers, customer reviews, newsletter subscriptions, GA4 analytics, and social sharing.

**Project Start**: 2026-01-05
**Current Status**: MVP Complete & Demo Deployed
**Current Phase**: Freeze & Finalization (2026-02-09 to 2026-02-13)

---

## Key Decisions

### Decision Log

| Date       | Decision                        | Rationale                                           | Alternatives Considered        |
| ---------- | ------------------------------- | --------------------------------------------------- | ------------------------------ |
| 2026-01-05 | Next.js 14+ App Router          | Modern patterns, SSR/SSG, great DX                  | Pages Router, separate backend |
| 2026-01-05 | Prisma ORM                      | Type-safe queries, migrations, good DX              | Raw SQL, Drizzle, TypeORM      |
| 2026-01-05 | Zustand for cart state          | Lightweight, TypeScript-friendly                    | Redux, Jotai, React Context    |
| 2026-01-05 | Stripe for payments             | Industry standard, excellent docs, PCI compliant    | PayPal, Square                 |
| 2026-01-05 | BullMQ for background jobs      | Reliable, Redis-backed, good monitoring             | pg-boss, custom solution       |
| 2026-01-05 | S3/R2 for file storage          | Scalable, CDN-ready, cost-effective                 | Local storage, Cloudinary      |
| 2026-01-05 | shadcn/ui components            | Customizable, accessible, Tailwind-based            | MUI, Chakra, custom components |
| 2026-02-01 | GA4 via GTM for analytics       | Industry standard, GDPR compliance, rich e-commerce | Plausible, PostHog, Fathom     |
| 2026-02-01 | Cookie consent gating GTM       | GDPR compliance, no tracking without consent        | Consent mode v2, no consent    |
| 2026-02-02 | Platform-specific share buttons | Better UX than generic share, tracks per platform   | AddThis, ShareThis, generic    |
| 2026-02-04 | Double opt-in newsletter        | Anti-spam compliance, higher quality subscribers    | Single opt-in                  |
| 2026-02-04 | HMAC-SHA256 unsubscribe tokens  | Deterministic, no DB storage needed, tamper-proof   | Random tokens stored in DB     |
| 2026-02-06 | Verified purchase reviews       | Prevents fake reviews, builds trust                 | Open reviews, captcha-only     |
| 2026-02-06 | Google Shopping XML feed        | SEO product visibility, free merchant listings      | No feed, JSON-LD only          |
| 2026-02-07 | Dual CI/CD deployment           | Flexibility for serverless or traditional hosting   | Vercel-only, VPS-only          |

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

| Pattern                      | When to Use                          | Example                                 |
| ---------------------------- | ------------------------------------ | --------------------------------------- |
| Server Components            | Data fetching, SEO-critical pages    | Product detail, category pages          |
| Client Components            | Interactivity, forms, client state   | Cart drawer, checkout form, review form |
| API Routes                   | External webhooks, complex mutations | Stripe webhooks, order confirmation     |
| Zustand stores               | Client-side global state             | Cart state, cookie consent              |
| React Hook Form + Zod        | All forms                            | Checkout, login, product forms          |
| apiError()/apiSuccess()      | Standardized API responses           | All API route handlers                  |
| requireAdmin()/requireAuth() | Auth guards as early returns         | Protected API endpoints                 |
| useEffect + useRef           | Prevent duplicate analytics events   | Cart tracking, purchase tracking        |
| GTM dataLayer push           | Client-side analytics events         | GA4 e-commerce events                   |
| HMAC token verification      | Tamper-proof URL tokens              | Newsletter unsubscribe links            |

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
- Always validate inputs with Zod at API boundaries
- Use `async/await` over `.then()` chains
- Destructure props in function signature
- Export types alongside functions when needed
- Use `apiError()`/`apiSuccess()` for all API responses
- No `console.error()` in API routes (removed in TASK-029)
- Use bare `catch` syntax for unused error variables

---

## Domain Knowledge

### Glossary

| Term             | Definition                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Dropshipping     | Retail model where seller doesn't hold inventory                  |
| SKU              | Stock Keeping Unit - unique product identifier                    |
| MPN              | Manufacturer Part Number - manufacturer's product identifier      |
| GTIN             | Global Trade Item Number - barcode/UPC identifier                 |
| Supplier Order   | Order sent to supplier for fulfillment                            |
| Payment Intent   | Stripe object representing a payment attempt                      |
| Compare Price    | Original/strikethrough price (before discount)                    |
| Featured Product | Product highlighted on homepage                                   |
| Slug             | URL-friendly identifier (e.g., "blue-widget")                     |
| Double Opt-in    | Email subscription requiring confirmation click before activation |
| HMAC             | Hash-based Message Authentication Code for tamper-proof tokens    |
| OG Image         | Open Graph image for social media link previews                   |
| GTM              | Google Tag Manager - analytics tag management                     |
| JSON-LD          | Structured data format for search engine rich results             |
| Web Vitals       | Core performance metrics (CLS, LCP, FCP, TTFB, INP)               |

### Business Rules

| Rule                        | Description                                               | Implemented In                     |
| --------------------------- | --------------------------------------------------------- | ---------------------------------- |
| Stock validation            | Cannot purchase more than available                       | Cart validation, checkout          |
| Price at purchase           | Order stores price at time of purchase                    | Order creation                     |
| Admin-only product creation | Only admins can create/edit products                      | API middleware                     |
| Order number format         | ORD-YYYYMMDD-XXXX                                         | src/lib/stripe.ts                  |
| Guest checkout              | Users can checkout without account                        | Checkout flow                      |
| Verified purchase reviews   | Only users with DELIVERED orders can review               | Review eligibility API             |
| One review per product      | Users can write only one review per product               | Unique constraint userId+productId |
| comparePrice > price        | Compare price must exceed selling price if provided       | Zod refinement, API routes         |
| Newsletter double opt-in    | Subscribers must confirm email before activation          | Newsletter API + email flow        |
| HMAC unsubscribe            | Unsubscribe tokens are HMAC-signed, not stored in DB      | Newsletter unsubscribe API         |
| Email normalization         | Emails lowercased and trimmed before DB operations        | Newsletter subscribe API           |
| CSV formula injection       | CSV exports escape cells starting with =, +, -, @, \t, \r | Admin newsletter/order export      |

---

## Known Issues

### Technical Debt

| Issue                        | Impact                                  | Remediation Plan             | Priority |
| ---------------------------- | --------------------------------------- | ---------------------------- | -------- |
| No cart merge on login       | Guest cart lost on login                | Implement cart sync service  | Medium   |
| No product search indexing   | Basic search only                       | Add Meilisearch              | Low      |
| No structured logging        | Hard to debug in production             | Add pino or winston          | Medium   |
| No partial update validation | Admin updates accept any fields         | Add explicit partial schemas | Low      |
| React 18 pinned              | Can't use React.cache, RSC improvements | Upgrade when stable          | Low      |
| Next.js 14 pinned            | Security patches pending                | Major upgrade with migration | Medium   |

### Workarounds

| Issue                        | Workaround                               | Permanent Fix Needed |
| ---------------------------- | ---------------------------------------- | -------------------- |
| Prisma Decimal serialization | Convert to string for JSON               | No                   |
| Middleware Edge runtime      | Added `runtime = "nodejs"`               | No                   |
| Hydration mismatch for cart  | `useEffect` for client rendering         | No                   |
| ZodEffects breaks .partial() | Split base/refined schemas               | No (design pattern)  |
| Native share hydration       | CSS hiding instead of conditional render | No (design pattern)  |

---

## Historical Context

### Project Evolution

- **2026-01-05**: Project initialized with Next.js 14, TypeScript, Prisma
- **2026-01-05**: Completed all MVP phases (1-5.2: Foundation, Catalog, Cart, Orders, SEO, Testing)
- **2026-01-07**: Phase 5.3 Deployment infrastructure complete (CI/CD, Docker)
- **2026-01-07**: Documentation completion
- **2026-01-13**: Phase 5.4 Demo deployment to Vercel with Neon PostgreSQL
- **2026-01-13**: MVP plan archived
- **2026-01-22**: TASK-017 SEO Technical Setup (sitemap, robots.txt, meta tags, JSON-LD)
- **2026-02-01**: TASK-018 GA4 Analytics Integration (GTM, e-commerce events, cookie consent, Web Vitals)
- **2026-02-02**: TASK-019 Social Sharing (platform buttons, Web Share API, OG images)
- **2026-02-03**: TASK-020 Performance Optimization (image blur placeholders, resource hints, deferred fonts)
- **2026-02-04**: TASK-021 Google Shopping XML Feed (RSS 2.0, Zod validation, hourly revalidation)
- **2026-02-04**: TASK-022 Newsletter System (double opt-in, HMAC unsubscribe, admin management)
- **2026-02-05**: TASK-023 Product Seed Data (50+ products, hierarchical categories, realistic data)
- **2026-02-06**: TASK-024 Review System (verified purchase, star ratings, admin moderation)
- **2026-02-06**: TASK-025 E2E Test Infrastructure (Playwright, global setup, CI optimization)
- **2026-02-07**: TASK-026 CI/CD Deployment Pipeline (dual Vercel/VPS, secret validation)
- **2026-02-09**: TASK-027 Dependency Audit (security patches, 30 package updates)
- **2026-02-09**: TASK-028 Test Coverage Improvement (158 new tests, 89.82% coverage)
- **2026-02-10**: TASK-029 Technical Debt Cleanup (NaN guards, JSON-LD merge, console.error removal)
- **2026-02-09 to 2026-02-13**: Freeze Week (stability, cleanup, documentation)

### Deprecated Approaches

| What                   | When Deprecated | Replaced By               | Why                             |
| ---------------------- | --------------- | ------------------------- | ------------------------------- |
| console.error in APIs  | 2026-02-10      | Structured apiError()     | Cleaner error handling          |
| Separate JSON-LD funcs | 2026-02-10      | Single getProductJsonLd() | Avoid duplicate structured data |
| Server Actions mention | 2026-02-10      | API Routes pattern        | Not currently used in project   |

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
