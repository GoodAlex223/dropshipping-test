# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- AUTO-MANAGED: project-description -->

## Overview

**Dropshipping E-commerce Platform** — A full-featured multi-category dropshipping e-commerce website built with Next.js 14 App Router.

Key capabilities:

- Customer storefront with product catalog, cart, and checkout
- Admin panel for products, categories, orders, customers, and suppliers
- Stripe payment integration
- Automated order forwarding to suppliers via background workers (BullMQ)
- CSV product import, S3 image storage, email notifications (Resend)
- Multi-theme showcase system (bold, luxury, organic design variants)
- SEO with dynamic sitemap, robots.txt, dynamic Open Graph images, and Google Shopping XML feed
- Social sharing with platform-specific share buttons and Web Share API support
- GA4 e-commerce analytics via Google Tag Manager with GDPR-compliant cookie consent

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: build-commands -->

## Build & Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Production build (prisma generate + next build)
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run typecheck        # TypeScript type checking (tsc --noEmit)
npm run format           # Prettier format all files
npm run format:check     # Prettier check formatting

# Testing
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run
npm run test:coverage    # Vitest with coverage
npm run test:e2e         # Playwright end-to-end tests
npm run test:e2e:ui      # Playwright with UI

# Database
npm run db:generate      # Prisma generate client
npm run db:push          # Prisma push schema (no migration)
npm run db:migrate       # Prisma migrate (creates migration files)
npm run db:studio        # Prisma Studio GUI
npm run db:seed          # Seed database with test data

# Background Workers
npm run workers          # Run all workers
npm run workers:forward  # Order forwarding worker only
npm run workers:sync     # Order status sync worker only

# Infrastructure
docker-compose up -d     # Start PostgreSQL + Redis + Adminer
```

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: architecture -->

## Architecture

Next.js 14 App Router with route groups for domain separation:

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/admin/      # Admin panel pages (protected, ADMIN role)
│   ├── (auth)/             # Login & register pages
│   ├── (shop)/             # Customer storefront (home, products, cart, checkout, account)
│   ├── showcase/           # Multi-theme demo pages (bold, luxury, organic)
│   ├── api/                # API routes
│   │   ├── admin/          # Admin-only API endpoints (auth-guarded)
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── cart/            # Cart validation
│   │   ├── categories/     # Public category endpoints
│   │   ├── checkout/       # Payment & order creation
│   │   ├── health/         # Health check
│   │   ├── orders/         # Customer order endpoints
│   │   └── products/       # Public product endpoints
│   ├── feed/               # Product feeds
│   │   └── google-shopping.xml/  # Google Shopping RSS 2.0 feed
│   ├── layout.tsx          # Root layout
│   ├── middleware.ts       # Auth middleware (route protection)
│   ├── robots.ts           # SEO robots.txt
│   └── sitemap.ts          # SEO dynamic sitemap
├── components/
│   ├── admin/              # Admin panel components (sidebar, forms, dialogs)
│   ├── analytics/          # Analytics tracking components (PurchaseTracker)
│   ├── checkout/           # Payment form components
│   ├── common/             # Header, Footer, CookieConsent
│   ├── products/           # ProductCard, SocialShareButtons
│   ├── shop/               # CartDrawer
│   ├── showcase/           # Multi-theme showcase components (bold/, luxury/, organic/)
│   ├── theme/              # Theme switcher & config
│   ├── ui/                 # shadcn/ui primitives (button, card, dialog, etc.)
│   └── providers.tsx       # Context providers wrapper (auth, theme, toast, cookie consent)
├── hooks/                  # Custom React hooks (use-debounce, use-toast)
├── lib/                    # Core utilities
│   ├── auth.ts             # NextAuth v5 config (JWT + Prisma adapter)
│   ├── db.ts               # Prisma client (Neon adapter for prod)
│   ├── api-utils.ts        # API response helpers, auth guards
│   ├── stripe.ts           # Stripe server-side
│   ├── stripe-client.ts    # Stripe client-side
│   ├── email.ts            # Resend email service
│   ├── queue.ts            # BullMQ queue setup
│   ├── redis.ts            # Redis/ioredis connection
│   ├── s3.ts               # AWS S3 image storage
│   ├── seo.ts              # SEO utilities (metadata, JSON-LD)
│   ├── analytics.ts        # GA4 e-commerce + share event tracking (GTM dataLayer)
│   ├── share-utils.ts      # Social sharing URL builders, Web Share API
│   ├── utils.ts            # General utils (cn, etc.)
│   └── validations/        # Zod schemas for all entities
│       ├── index.ts        # Product, category, order, user schemas
│       └── google-shopping.ts  # Google Shopping feed item schema
├── services/               # Business logic services
│   └── supplier.service.ts # Supplier order forwarding
├── stores/                 # Zustand stores
│   └── cart.store.ts       # Cart state (persisted to localStorage)
├── types/                  # TypeScript types (re-exports Prisma + custom types)
│   └── index.ts
└── workers/                # Background job processors (BullMQ)
    ├── index.ts            # Worker orchestrator
    ├── order-forwarding.worker.ts
    └── order-status-sync.worker.ts
prisma/
├── schema.prisma           # Database schema (PostgreSQL)
├── migrations/             # Prisma migrations
└── seed.ts                 # Database seeder
```

**Key data flow**: Customer checkout -> Stripe payment intent -> Order created -> BullMQ job queued -> Worker forwards to supplier -> Status sync worker polls supplier updates.

**Auth flow**: NextAuth v5 with JWT strategy. Middleware protects `/account`, `/checkout` (auth required) and `/admin` (ADMIN role required). API routes use `requireAdmin()` / `requireAuth()` guards from `api-utils.ts`.

**Database**: PostgreSQL via Prisma. Local dev uses standard connection; production uses Neon serverless adapter. Global singleton pattern in `db.ts`.

**Analytics flow**: Cookie consent banner (Zustand persisted) -> User accepts -> GTM script loads -> Client-side events pushed to `window.dataLayer` -> GA4 receives e-commerce events (view_item_list, select_item, view_item, add_to_cart, view_cart, begin_checkout, add_shipping_info, add_payment_info, purchase).

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: conventions -->

## Code Conventions

- **Language**: TypeScript strict mode (`"strict": true`)
- **Path aliases**: `@/*` maps to `./src/*`
- **Formatting**: Prettier with double quotes, semicolons, 2-space indent, 100 char print width, trailing commas (es5), tailwindcss plugin
- **Linting**: ESLint with next/core-web-vitals + next/typescript configs
- **Pre-commit**: Husky + lint-staged (eslint --fix + prettier --write on TypeScript files; prettier --write on JS/JSON/MD files)
- **Components**: PascalCase filenames for React components (e.g., `AdminSidebar.tsx`, `ProductCard.tsx`)
- **Non-component files**: kebab-case (e.g., `api-utils.ts`, `cart.store.ts`, `use-debounce.ts`)
- **UI primitives**: shadcn/ui components in `src/components/ui/` (Radix UI + Tailwind + CVA)
- **State management**: Zustand with `persist` middleware, stores in `src/stores/*.store.ts`
- **Validation**: Zod schemas in `src/lib/validations/index.ts`, shared between client and server
- **API routes**: Export named functions (`GET`, `POST`, `PUT`, `DELETE`), use `try/catch`, return `NextResponse.json()`
- **API auth**: Use `requireAdmin()` / `requireAuth()` from `api-utils.ts` at top of handlers
- **Types**: Re-export Prisma types from `src/types/index.ts`, add custom interfaces there
- **Imports**: ES modules, `@/` alias for all src imports
- **Client components**: Marked with `"use client"` directive at top
- **Barrel exports**: `index.ts` files in component directories

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: patterns -->

## Detected Patterns

- **Route groups**: `(admin)`, `(auth)`, `(shop)` separate layout concerns without affecting URL paths
- **Global Prisma singleton**: `globalThis` caching pattern in `db.ts` to avoid multiple instances in development
- **API response helpers**: `apiError()`, `apiSuccess()` in `api-utils.ts` standardize JSON responses
- **Auth guards as early returns**: `requireAdmin()` returns `{ error, session }` tuple pattern
- **Pagination helper**: `getPagination()` function extracts page/limit/skip from search params
- **Dynamic route segments**: `[id]`, `[slug]`, `[...nextauth]` for parameterized routes
- **Loading states**: `loading.tsx` files for Suspense boundaries in product/category pages
- **Showcase pattern**: Three theme variants (bold, luxury, organic) with parallel component structures
- **Worker separation**: Individual worker files for each job type, orchestrated by `index.ts`
- **Env validation**: Runtime checks for required env vars (NEXTAUTH_SECRET, DATABASE_URL) with descriptive errors
- **Analytics tracking pattern**: `useEffect` with `useRef` to prevent duplicate events on re-renders (cart, checkout, purchase, share)
- **GTM conditional loading**: GTM script only loads after user accepts cookies; regex validation for GTM_ID format
- **DataLayer clearing**: Push `{ ecommerce: null }` before each event to prevent GA4 data leakage between events
- **Cookie consent persistence**: Zustand store with localStorage persistence for consent status (pending/accepted/declined)
- **Async params unwrapping**: Next.js 14 dynamic routes use `use(params)` to unwrap Promise-based params in client components
- **Search debouncing**: Admin list pages debounce search input (300ms) via `useDebounce` hook to reduce API calls
- **Suspense-wrapped list pages**: Admin list pages wrap content in `<Suspense>` with loading skeleton fallbacks
- **Social sharing pattern**: Platform-specific URL builders (`buildShareUrl`) with proper URI encoding; Web Share API detection (`canUseNativeShare`) with graceful fallback to clipboard copy on failure
- **OG image file convention**: Product pages use `opengraph-image.tsx` file-based generation (exports `alt`, `size`, `contentType`, and default `Image` function returning `ImageResponse`); Next.js automatically wires images into meta tags
- **Native share visibility**: Native share button rendered with CSS hiding (`sm:hidden`) instead of conditional rendering to avoid hydration mismatch
- **Google Shopping feed pattern**: RSS 2.0 XML with Google Shopping namespace; strict Zod validation for title (max 150 chars), description (max 5000 chars), price format (`/^\d+\.\d{2} [A-Z]{3}$/`), GTIN (8/12/13/14 digits), and enum values; XML escaping for special characters; hourly revalidation with stale-while-revalidate
- **Product identifier fields**: Schema includes optional `brand` and `mpn` (Manufacturer Part Number) fields for Google Shopping compliance and product catalog enrichment

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: git-insights -->

## Git Insights

- **Commit style**: Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`) with optional scope (`feat(seo):`)
- **Branch naming**: `feat/task-NNN-description` pattern
- **Recent focus**: CI/CD hardening (workflow_call trigger for reusable workflows), code quality enforcement (lint-staged covering all file types)
- **Known challenges**: Prisma + Vercel serverless requires Neon adapter; Next.js 14/React 18 pinned for stability
- **CI improvements**: Added workflow_call trigger for deploy.yml integration; JS files now auto-formatted on commit via lint-staged

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: best-practices -->

## Best Practices

- Run `npm run typecheck` before committing to catch type errors early
- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format:check` to verify formatting before CI (matches CI job)
- Use `npm run test:run` for a single test pass (CI-style)
- When modifying Prisma schema, run `npm run db:migrate` to create migration, then `npm run db:generate`
- Always add Zod validation schemas for new API endpoints in `src/lib/validations/index.ts`
- Use `requireAdmin()` or `requireAuth()` for protected API routes, never roll custom auth checks
- Keep UI primitives in `src/components/ui/` unchanged (shadcn/ui managed)
- Environment variables: never commit `.env` files; use `.env.example` as reference
- Use `next/image` for all images; avoid native `<img>` tags (ESLint enforced)

<!-- END AUTO-MANAGED -->

<!-- MANUAL -->

## Custom Notes

Add project-specific notes here. This section is never auto-modified.

<!-- END MANUAL -->
