# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- AUTO-MANAGED: project-description -->

## Overview

**Dropshipping E-commerce Platform** — A full-featured multi-category dropshipping e-commerce website built with Next.js 14 App Router.

Key capabilities:

- Customer storefront with product catalog, cart, and checkout
- Admin panel for products, categories, orders, customers, suppliers, and reviews
- Product review system with verified purchase requirements, star ratings, and admin reply functionality
- Stripe payment integration
- Automated order forwarding to suppliers via background workers (BullMQ)
- CSV product import, S3 image storage, email notifications (Resend)
- Multi-theme showcase system (bold, luxury, organic design variants)
- SEO with dynamic sitemap, robots.txt, dynamic Open Graph images, Google Shopping XML feed, and review-based JSON-LD structured data
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
│   │   └── reviews/        # Review management (list, reply, hide/show, delete)
│   ├── (auth)/             # Login & register pages
│   ├── (shop)/             # Customer storefront (home, products, cart, checkout, account)
│   ├── showcase/           # Multi-theme demo pages (bold, luxury, organic)
│   ├── api/                # API routes
│   │   ├── admin/          # Admin-only API endpoints (auth-guarded)
│   │   │   └── reviews/    # Admin review API ([id], [id]/reply, [id]/visibility)
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── cart/            # Cart validation
│   │   ├── categories/     # Public category endpoints
│   │   ├── checkout/       # Payment & order creation
│   │   ├── health/         # Health check
│   │   ├── orders/         # Customer order endpoints
│   │   ├── products/       # Public product endpoints
│   │   │   └── [slug]/reviews/  # Product-specific review list
│   │   └── reviews/        # Customer review API (create, update, delete, eligibility check)
│   ├── feed/               # Product feeds
│   │   └── google-shopping.xml/  # Google Shopping RSS 2.0 feed
│   ├── layout.tsx          # Root layout
│   ├── middleware.ts       # Auth middleware (route protection)
│   ├── robots.ts           # SEO robots.txt
│   └── sitemap.ts          # SEO dynamic sitemap
├── components/
│   ├── admin/              # Admin panel components (sidebar, forms, dialogs)
│   ├── analytics/          # Analytics tracking components (PurchaseTracker, WebVitalsReporter)
│   ├── checkout/           # Payment form components
│   ├── common/             # Header, Footer, CookieConsent, ResourceHints
│   ├── products/           # ProductCard, SocialShareButtons
│   ├── reviews/            # Review components (ReviewSection, ReviewForm, ReviewList, ReviewItem, ReviewStats, StarRating)
│   ├── shop/               # CartDrawer
│   ├── showcase/           # Multi-theme showcase components (bold/, luxury/, organic/)
│   ├── theme/              # Theme switcher & config
│   ├── ui/                 # shadcn/ui primitives (button, card, dialog, etc.)
│   └── providers.tsx       # Context providers wrapper (auth, theme, toast, cookie consent, web vitals)
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
│   ├── seo.ts              # SEO utilities (metadata, JSON-LD, review structured data)
│   ├── analytics.ts        # GA4 e-commerce + share event tracking (GTM dataLayer)
│   ├── share-utils.ts      # Social sharing URL builders, Web Share API
│   ├── image-utils.ts      # Image optimization (blur placeholders, sizes)
│   ├── web-vitals.ts       # Core Web Vitals reporting to GA4
│   ├── utils.ts            # General utils (cn, etc.)
│   └── validations/        # Zod schemas for all entities
│       ├── index.ts        # Product, category, order, user, review schemas
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
tests/
├── e2e/                    # Playwright E2E tests
│   └── navigation.spec.ts  # Navigation and basic user flow tests
└── global-setup.ts         # E2E test infrastructure validation
prisma/
├── schema.prisma           # Database schema (PostgreSQL)
├── migrations/             # Prisma migrations
└── seed.ts                 # Database seeder
```

**Key data flow**: Customer checkout -> Stripe payment intent -> Order created -> BullMQ job queued -> Worker forwards to supplier -> Status sync worker polls supplier updates.

**Auth flow**: NextAuth v5 with JWT strategy. Middleware protects `/account`, `/checkout` (auth required) and `/admin` (ADMIN role required). API routes use `requireAdmin()` / `requireAuth()` guards from `api-utils.ts`.

**Database**: PostgreSQL via Prisma. Local dev uses standard connection; production uses Neon serverless adapter. Global singleton pattern in `db.ts`.

**Analytics flow**: Cookie consent banner (Zustand persisted) -> User accepts -> GTM script loads -> Client-side events pushed to `window.dataLayer` -> GA4 receives e-commerce events (view_item_list, select_item, view_item, add_to_cart, view_cart, begin_checkout, add_shipping_info, add_payment_info, purchase).

**Performance optimizations**: Resource hints (preconnect to Stripe/GTM, dns-prefetch to Google Analytics/Fonts) in root layout; Web Vitals (CLS, LCP, FCP, TTFB, INP) reported to GA4 via GTM dataLayer; blur placeholders for next/image (shimmer effect, no external dependencies); deferred theme font loading (preload: false, display: swap saves ~60-80KB on initial load).

**E2E test infrastructure**: Playwright with global setup hook validates database connectivity and seed data before tests run. CI runs E2E tests with pre-built app (PostgreSQL 16 + Redis 7 services), requires AUTH_TRUST_HOST=true for NextAuth. Local dev uses port 3001, CI uses port 3000. Tests include navigation, mobile responsiveness, and cart interactions.

**Deployment pipeline**: GitHub Actions workflow supports dual deployment targets (Vercel serverless, VPS/PM2) controlled by `DEPLOYMENT_TARGET` variable. CI job runs first (lint, typecheck, tests), then deploy job validates required secrets before execution. Vercel path: secret validation → vercel pull → vercel build (with DATABASE_URL + NEXTAUTH_SECRET env) → vercel deploy → prisma migrate. VPS path: secret validation → SSH deploy → git pull → npm ci → prisma migrate → npm build → pm2 restart. Graceful degradation: missing secrets skip deployment with notice unless `DEPLOYMENT_TARGET` explicitly set, then fails with error.

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
- **Validation**: Zod schemas in `src/lib/validations/` (index.ts for core entities, google-shopping.ts for feed items), shared between client and server
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
- **Feed validation filtering**: Use `validateFeedItemSafe()` with `.filter()` after `.map()` to exclude invalid items from feeds instead of breaking serialization; prevents malformed data (e.g., non-numeric GTINs) from corrupting XML output
- **Product identifier fields**: Schema includes optional `brand` and `mpn` (Manufacturer Part Number) fields for Google Shopping compliance and product catalog enrichment
- **Image blur placeholders**: SVG-based shimmer effect for `next/image` placeholder="blur"; `DEFAULT_BLUR_DATA_URL` constant provides lightweight gradient animation; `IMAGE_SIZES` const defines responsive sizes for productCard, productDetail, thumbnail, categoryCard, hero
- **Resource hints pattern**: `preconnect` for critical third-party domains (Stripe, GTM) enables early connection establishment; `dns-prefetch` for secondary domains (Google Analytics, Google Fonts) reduces DNS lookup latency; hints added in root layout `<head>`
- **Web Vitals tracking**: Core Web Vitals (CLS, LCP, FCP, TTFB, INP) captured via `web-vitals` library and reported to GTM dataLayer; `WebVitalsReporter` component dynamically imports metrics library, runs client-side only; dataLayer clearing (`{ ecommerce: null }`) applied before events for consistency with analytics.ts pattern
- **Deferred font loading**: Theme-specific fonts (Playfair Display, Lora) loaded with `preload: false` and `display: swap` to defer loading until CSS actually uses them; saves ~60-80KB on initial load for users on default theme
- **E2E test setup pattern**: Playwright config uses `globalSetup` hook (tests/global-setup.ts) to validate infrastructure before tests run; checks database connection via Prisma `$queryRaw`, verifies seed data exists (categories and active products), throws error if data missing; prevents test failures from infrastructure issues
- **CI E2E configuration**: Port management via `IS_CI` flag (port 3000 in CI, 3001 local); CI uses pre-built app with `npm start` (build happens in separate job); PostgreSQL 16 and Redis 7 as GitHub Actions services with health checks; requires AUTH_TRUST_HOST=true for NextAuth in CI environment
- **E2E timeout tuning**: Test timeout 30s in CI (60s local), navigation timeout 15s in CI (45s local); 2 retries in CI (0 local); chromium-only in CI for speed (all browsers local); webServer stdout/stderr piped for debugging
- **Mobile-responsive E2E tests**: Tests use Playwright's `isMobile` context property for viewport-aware assertions; navigation tests conditionally check desktop menu visibility (`if (!isMobile)`) while always testing mobile-specific elements; flexible selectors (`.first()`, regex matching) handle multiple matching elements across viewport sizes
- **CI secret validation pattern**: GitHub Actions jobs validate required secrets before execution; bash script checks for empty variables, builds error message listing missing secrets, then either fails (if `DEPLOYMENT_TARGET` explicitly set) or skips gracefully (if unset); all subsequent steps conditional on validation with `if: steps.validate.outputs.skip != 'true'`
- **Dual deployment strategy**: Single workflow handles both Vercel and VPS deployments via `jobs.<job>.if` conditions checking `vars.DEPLOYMENT_TARGET`; Vercel job runs if value is `vercel` or empty string; VPS job runs if value is `vps`; prevents both paths executing simultaneously; notify job uses `needs: [deploy-vercel, deploy-vps]` with `if: always()` to report status regardless of which path ran
- **Review eligibility pattern**: Customer reviews require verified purchase (order status `DELIVERED` with product in order items); eligibility check via `/api/reviews/eligibility?productId=xxx` returns `canReview`, `hasExistingReview`, `orderId`; enforces one review per product per user via unique constraint `userId_productId`; client checks eligibility before showing form
- **Review visibility management**: Admin reviews page filters by `isHidden` status; toggle endpoint `PATCH /api/admin/reviews/[id]/visibility` manages visibility (default `false` = visible); product detail pages exclude hidden reviews from display (`where: { isHidden: false }`)
- **Admin review reply pattern**: Two-step pattern for admin replies: (1) form pre-populates with existing `adminReply` text if already replied, (2) `PATCH /api/admin/reviews/[id]/reply` updates reply text and sets `adminRepliedAt` timestamp; product display shows admin replies with timestamp (`adminRepliedAt` formatted relative to review creation)
- **Review deletion cascade**: `onDelete: Cascade` on Review foreign keys ensures reviews cascade-delete when user/product/order deleted; unique constraint prevents orphaned reviews; index on `isHidden` for fast visibility filtering
- **Review data structure**: Prisma Review model stores `rating` (1-5), `comment` (optional, max 2000 chars via schema validation), `isHidden` (boolean, default false), `adminReply` (optional, max 1000 chars), `adminRepliedAt` (timestamp); client interfaces extend with `user` details and computed fields (`averageRating`, `totalReviews`, `ratingDistribution`)

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: git-insights -->

## Git Insights

- **Commit style**: Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`) with optional scope (`feat(seo):`, `feat(perf):`, `fix(ci):`, `fix(e2e):`, `feat(deploy):`)
- **Branch naming**: `feat/task-NNN-description` pattern
- **Recent focus**: Deployment infrastructure (dual-target CI/CD with Vercel/VPS support), E2E test infrastructure improvements (global setup validation, CI reliability, mobile-responsive tests), performance optimization (Web Vitals tracking, resource hints, image optimization)
- **Known challenges**: Prisma + Vercel serverless requires Neon adapter; Next.js 14/React 18 pinned for stability (React.cache not available in React 18); NextAuth requires `AUTH_TRUST_HOST=true` in CI E2E tests; E2E tests need seeded database with categories and active products
- **CI improvements**: E2E infrastructure overhaul with global setup validation, separated build and test jobs, PostgreSQL 16 + Redis 7 services with health checks; deployment workflow with graceful secret validation, dual-target support (Vercel/VPS), conditional job execution, and comprehensive deployment documentation; JS files auto-formatted on commit via lint-staged; E2E tests run chromium-only in CI with port 3000, pre-built app, and optimized timeouts
- **Deployment strategy**: Dual-path deployment via `DEPLOYMENT_TARGET` variable (vercel/vps); graceful degradation when secrets missing (skip with notice if unset, fail with error if explicitly set); Vercel path uses CLI for pull/build/deploy + migrations; VPS path uses SSH action with git pull + pm2 restart; both paths validate secrets before execution
- **Latest completion**: TASK-026 Fix Vercel Deploy in CI (8f17be9) - resolved Prisma and NextAuth build errors by passing DATABASE_URL and NEXTAUTH_SECRET to Vercel build step; added validation-first deployment pattern with graceful skip for missing secrets, conditional step execution via output checks, job-level env vars for Vercel CLI
- **Active tasks**: None (MVP complete, post-MVP enhancements in BACKLOG)

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: best-practices -->

## Best Practices

- Run `npm run typecheck` before committing to catch type errors early
- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format:check` to verify formatting before CI (matches CI job)
- Use `npm run test:run` for a single test pass (CI-style)
- Run `npm run db:seed` after database setup to populate test data required for E2E tests
- When modifying Prisma schema, run `npm run db:migrate` to create migration, then `npm run db:generate`
- Always add Zod validation schemas for new API endpoints in `src/lib/validations/` (index.ts for core schemas, separate files for specialized domains like google-shopping.ts)
- Use `requireAdmin()` or `requireAuth()` for protected API routes, never roll custom auth checks
- Keep UI primitives in `src/components/ui/` unchanged (shadcn/ui managed)
- Environment variables: never commit `.env` files; use `.env.example` as reference
- Use `next/image` for all images; avoid native `<img>` tags (ESLint enforced)
- **Performance**: Add blur placeholders to all product/category images using `DEFAULT_BLUR_DATA_URL` and `IMAGE_SIZES` from `image-utils.ts`; Web Vitals are automatically tracked via `WebVitalsReporter` in providers
- **Deployment secrets**: Configure GitHub Actions secrets before deploying (see docs/deployment/setup.md); Vercel requires VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, DATABASE_URL, NEXTAUTH_SECRET; VPS requires VPS_HOST, VPS_USERNAME, VPS_SSH_KEY; missing secrets cause graceful skip or explicit failure depending on DEPLOYMENT_TARGET setting

<!-- END AUTO-MANAGED -->

<!-- MANUAL -->

## Custom Notes

Add project-specific notes here. This section is never auto-modified.

<!-- END MANUAL -->
