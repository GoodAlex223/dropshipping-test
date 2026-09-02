# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- AUTO-MANAGED: project-description -->

## Overview

**Dropshipping E-commerce Platform** — A full-featured multi-category dropshipping e-commerce website built with Next.js 14 App Router.

Key capabilities:

- Customer storefront with product catalog, cart, and checkout
- Admin panel for products, categories, orders, customers, suppliers, reviews, and newsletter subscribers
- Product review system with verified purchase requirements, star ratings, and admin reply functionality
- Newsletter subscription with double opt-in email confirmation and admin management
- No-prepayment COD checkout (guest-capable, Nova Poshta delivery methods; Stripe integration dormant since G2, 2026-08-06)
- Order forwarding to suppliers via background workers (BullMQ; jobs queued manually from admin — auto-queue after checkout is BACKLOG'd)
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
npm run test:run         # Vitest single run (CI-style, runs all tests once)
npm run test:coverage    # Vitest with coverage report
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
│   │   ├── newsletter/     # Newsletter subscriber management (list, search, filter, export, delete)
│   │   └── reviews/        # Review management (list, reply, hide/show, delete)
│   ├── (auth)/             # Login & register pages
│   ├── (shop)/             # Customer storefront (home, products, cart, checkout, account, feedback)
│   ├── newsletter/         # Newsletter confirmation and unsubscribe pages
│   │   ├── confirm/        # Email confirmation landing page
│   │   └── unsubscribe/    # Unsubscribe landing page
│   ├── showcase/           # Multi-theme demo pages (bold, luxury, organic)
│   ├── api/                # API routes
│   │   ├── admin/          # Admin-only API endpoints (auth-guarded)
│   │   │   ├── products/[id]/variants/  # Variant CRUD (G16) — GET/POST list, PATCH/DELETE [variantId]; ownership-scoped via findFirst({id, productId}), coded outcomes (PRODUCT_NOT_FOUND / VALIDATION_ERROR / DUPLICATE_VARIANT / VARIANT_NOT_FOUND / VARIANT_REFERENCED)
│   │   │   ├── newsletter/ # Admin newsletter API (list, [id] update/delete, export CSV)
│   │   │   └── reviews/    # Admin review API ([id], [id]/reply, [id]/visibility)
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── cart/            # Cart validation
│   │   ├── categories/     # Public category endpoints
│   │   ├── checkout/       # Payment & order creation
│   │   ├── feedback/       # Public feedback form endpoint (guest POST, coded outcomes, honeypot drop)
│   │   ├── health/         # Health check
│   │   ├── newsletter/     # Public newsletter API (subscribe, confirm, unsubscribe)
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
│   ├── admin/              # Admin panel components (sidebar, forms, dialogs); G16 added ProductImagesSection + ProductVariantsSection (mounted on the product edit page) and image-diff.ts (pure diffImages(prev,next) → {added, removedIds, orderChanged})
│   ├── analytics/          # Analytics tracking components (PurchaseTracker, WebVitalsReporter)
│   ├── checkout/           # Payment form components
│   ├── common/             # Header, Footer, AnnouncementBar, BenefitStrip, SocialLinks, FadeIn, Logo, NewsletterSignup, CookieConsent, ResourceHints, LocaleSwitcher (TASK-039 UA|RU header toggle)
│   ├── home/               # Homepage sections: Hero, ProductRail, WhyChooseUs, Testimonials
│   ├── products/           # ProductCard (carousel, badges, quick actions), ProductImage, ProductGallery (PDP thumb rail / mobile swipe+dots), QuickViewDialog, SizePicker, BoughtTogether, RecentlyViewed, SocialShareButtons
│   ├── reviews/            # Review components (ReviewSection, ReviewForm, ReviewList, ReviewItem, ReviewStats, StarRating)
│   ├── shop/               # CartDrawer
│   ├── showcase/           # Multi-theme showcase components (bold/, luxury/, organic/)
│   ├── ui/                 # shadcn/ui primitives (button, card, dialog, etc.)
│   └── providers.tsx       # Context providers wrapper (auth, toast, cookie consent, web vitals)
├── content/                # Typed content-CONFIG layer only (TASK-039 G9 externalized all display copy to messages/*.json; cart.ts/auth.ts/feedback.ts/newsletter.ts/system.ts deleted outright — their copy lives in the catalog now — and account.ts followed in PR #37 review round 2 (its two label maps proved consumer-less); the rest trimmed to non-translatable config)
│   ├── brand.ts            # BRAND_NAME/BRAND_TAGLINE/BRAND_META_SUFFIX — deliberately import-free (consumed by seo.ts); tagline/metaSuffix are byte-duplicated into the catalog for build-time consumers (opengraph-image.tsx) that can't call request-scoped getTranslations; also carries SOCIALS (relocated from site.ts, G5) and WHATSAPP_HREF (CLIENT-SUPPLIED-pending, null-gated)
│   ├── checkout.ts         # Non-translatable checkout config only: prepay card details (CLIENT-SUPPLIED-pending) + manager contact links; all copy now in messages/uk.json's checkout namespace
│   ├── emails.ts           # Transactional email copy (subjects + bodies, UA); untouched by TASK-039 by design; imports only brand.ts — lucide-free by contract (bundled into API routes)
│   ├── home.ts             # Non-translatable homepage config only: hero eyebrow/CTA hrefs/image path, benefit icons, rail hrefs; all copy now in messages/uk.json's home namespace
│   └── site.ts             # Site-wide config only: announcement id/href/marquee gate, socials, client claims, footer benefit icons; all copy now in messages/uk.json's site/header/footer namespaces
├── hooks/                  # Custom React hooks (use-debounce)
├── i18n/                   # next-intl cookie-mode wiring (TASK-039): config.ts (LOCALES/DEFAULT_LOCALE/NEXT_LOCALE cookie/resolveLocale), merge.ts (RU-over-UK deepMerge), request.ts (getRequestConfig), actions.ts (setLocale server action)
├── lib/                    # Core utilities
│   ├── auth.ts             # NextAuth v5 config (JWT + Prisma adapter)
│   ├── db.ts               # Prisma client (Neon adapter for prod)
│   ├── api-utils.ts        # API response helpers, auth guards
│   ├── stripe.ts           # Stripe server-side (payment-intent path dormant since G2; generateOrderNumber still live)
│   ├── stripe-client.ts    # Stripe client-side (dormant since G2)
│   ├── shipping.ts         # Nova Poshta delivery methods (np-office/np-courier/np-postomat, UAH) + legacy label lookup
│   ├── email.ts            # Resend wiring only — subjects from content/emails.ts, HTML from email-templates/
│   ├── format.ts           # formatPrice() — the only sanctioned UAH price formatter (uk-UA, Intl.NumberFormat)
│   ├── variant-names.ts    # VARIANT_NAMES = { size: «Розмір», color: «Колір» } — canonical ProductVariant.name DATA values (G14); consumed by all storefront variant lookups AND prisma/seed-data/products.ts (relative import); changing a value requires a data migration (precedent: 20260815095848)
│   ├── order-status.ts     # OrderStatus badge style lookup only (monochrome policy); customer label copy lives in the messages catalog (account.orderStatus/paymentStatus) — admin sources labels from the catalog since G13 (reusing `account.*`; supplier statuses via `admin.supplierOrderStatus`)
│   ├── supplier-order-status.ts # SupplierOrder.status badge style lookup (monochrome policy), G13 — deliberately parallel to order-status.ts, do NOT merge the two: these are lowercase service-layer convention values (pending/submitted/confirmed/shipped/delivered/cancelled/failed) set by supplier.service.ts, not a Prisma enum; labels come from the catalog via `admin.supplierOrderStatus` behind a `t.has()` guard
│   ├── newsletter.ts       # Newsletter utilities (token generation, URL builders, HMAC unsubscribe)
│   ├── og-fonts.ts         # Fetches Cyrillic-subset Manrope TTFs for next/og (Satori) OG image routes; fails safe to []
│   ├── queue.ts            # BullMQ queue setup
│   ├── redis.ts            # Redis/ioredis connection
│   ├── s3.ts               # S3-compatible image storage — AWS or Cloudflare R2 via the optional S3_ENDPOINT (G16). R2 credentials reuse the AWS_* slots: single env contract, NO R2_* variables. Setting an endpoint forces region "auto" + forcePathStyle (path-style verified against the real bucket) and makes AWS_CLOUDFRONT_URL mandatory — getPresignedUploadUrl throws MissingCdnUrlError at call time rather than persisting a dead *.s3.amazonaws.com URL
│   ├── seo.ts              # SEO utilities (metadata, JSON-LD, review structured data)
│   ├── analytics.ts        # GA4 e-commerce + share event tracking (GTM dataLayer)
│   ├── share-utils.ts      # Social sharing URL builders, Web Share API
│   ├── image-utils.ts      # Image optimization (blur placeholders, sizes)
│   ├── web-vitals.ts       # Core Web Vitals reporting to GA4
│   ├── utils.ts            # General utils (cn, etc.)
│   ├── email-templates/    # HTML email templates
│   │   ├── layout.ts       # Shared dark Mirox table-based shell (lang=uk, EMAIL_COLORS, renderEmailShell/renderPanel/renderButton)
│   │   ├── order-confirmation.ts     # Order confirmation template (OrderEmailData, guest-aware CTA)
│   │   ├── newsletter-confirmation.ts  # Double opt-in confirmation email
│   │   └── feedback.ts     # Feedback notification (conditional contact rows, escaped message; sent to FEEDBACK_EMAIL with Reply-To = submitter)
│   └── validations/        # Zod schemas for all entities
│       ├── index.ts        # Product, category, order, user, review, newsletter schemas
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
├── unit/                   # Vitest unit tests
│   ├── admin-newsletter-api.test.ts  # Admin newsletter API tests (GET list, PATCH/DELETE [id], GET export)
│   ├── admin-reviews-api.test.ts     # Admin review API tests (GET list/[id], DELETE, PUT reply/visibility)
│   ├── api-utils.test.ts             # API utility tests (auth guards, response helpers, pagination, slug/SKU generation)
│   ├── email-templates.test.ts       # Transactional email tests (getStoreName env fallback, shell/order/newsletter HTML, escaping)
│   ├── newsletter-api.test.ts        # Public newsletter API tests (subscribe, confirm, unsubscribe)
│   ├── newsletter.test.ts            # Newsletter utility tests (token generation, URL builders, HMAC, HTML escaping)
│   ├── reviews-api.test.ts           # Customer review API tests (create, update, delete, eligibility)
│   └── seo.test.ts                   # SEO utility tests (metadata generators, JSON-LD structured data)
├── helpers/                # Test utilities
│   └── api-test-utils.ts   # NextRequest/params builders for API route testing
└── global-setup.ts         # E2E test infrastructure validation (database connectivity, seed data check)
messages/                   # next-intl message catalogs (TASK-039)
├── uk.json                 # Source of truth / schema — every UI string; byte-verified against the pre-i18n literals by scripts/i18n-byte-diff.mjs
├── ru.json                 # DRAFT, agent-translated 2026-08-14, pending client sign-off (TASK-056 rider) — deep-merges over uk.json at request time; a missing/malformed key silently falls back to the UA value
└── README.md               # Catalog conventions (namespaces, ICU plural branches, byCode keys) + the RU draft's nuance-flagged review list (Нова Пошта non-declension, claims copy, grammatical-gender resolution, ё spelling)
prisma/
├── schema.prisma           # Database schema (PostgreSQL)
├── migrations/             # Prisma migrations
├── seed.ts                 # Database seeder (orchestrator)
└── seed-data/              # Modular seed data files
    ├── users.ts            # User seed data (admin + test customers)
    ├── categories.ts       # Category hierarchy (top-level + subcategories)
    ├── products.ts         # Product catalog with images, variants, identifiers
    ├── orders.ts           # Order history with various statuses
    ├── reviews.ts          # Customer reviews with admin replies
    └── subscribers.ts      # Newsletter subscribers with various statuses
```

**Key data flow**: Customer checkout -> COD order created directly via `/api/checkout/create-order` (no payment processing since G2, 2026-08-06; Stripe payment-intent path dormant) -> supplier forwarding is currently a manual admin action (BullMQ auto-queue after checkout is an open BACKLOG item from TASK-031) -> Status sync worker polls supplier updates.

**Auth flow**: NextAuth v5 with JWT strategy. Middleware protects `/account` (auth required) and `/admin` (ADMIN role required); `/checkout` is deliberately public since G2 (guest COD checkout — orders link to the account when a session exists). API routes use `requireAdmin()` / `requireAuth()` guards from `api-utils.ts`.

**Test infrastructure**: Vitest for unit tests (`tests/unit/`), Playwright for E2E (`tests/e2e/`). Test helpers in `tests/helpers/api-test-utils.ts` provide `createNextRequest()` and `createRouteParams()` for API route testing. All API tests mock `@/lib/auth` and `@/lib/db` at module level. E2E tests use global setup validation (`tests/global-setup.ts`) to verify database connectivity and seed data before running.

**Database**: PostgreSQL via Prisma. Local dev uses standard connection; production uses Neon serverless adapter. Global singleton pattern in `db.ts`.

**Analytics flow**: Cookie consent banner (Zustand persisted) -> User accepts -> GTM script loads -> Client-side events pushed to `window.dataLayer` -> GA4 receives e-commerce events (view_item_list, select_item, view_item, add_to_cart, view_cart, begin_checkout, add_shipping_info, add_payment_info, purchase).

**Performance optimizations**: Resource hints (preconnect to Stripe/GTM, dns-prefetch to Google Analytics/Fonts) in root layout; Web Vitals (CLS, LCP, FCP, TTFB, INP) reported to GA4 via GTM dataLayer; blur placeholders for next/image (shimmer effect, no external dependencies); deferred theme font loading (preload: false, display: swap saves ~60-80KB on initial load).

**E2E test infrastructure**: Playwright with global setup hook validates database connectivity and seed data before tests run. CI runs E2E tests with pre-built app (PostgreSQL 16 + Redis 7 services), requires AUTH_TRUST_HOST=true for NextAuth. Local dev uses port 3001, CI uses port 3000. Tests include navigation, mobile responsiveness, and cart interactions.

**Deployment pipeline**: GitHub Actions workflow supports dual deployment targets (Vercel serverless, VPS/PM2) controlled by `DEPLOYMENT_TARGET` variable. CI job runs first (lint, typecheck, tests), then deploy job validates required secrets before execution. Vercel path: secret validation → vercel pull → vercel build (with DATABASE_URL + NEXTAUTH_SECRET env) → vercel deploy → prisma migrate. VPS path: secret validation → SSH deploy → git pull → npm ci → prisma migrate → npm build → pm2 restart. Graceful degradation: missing secrets skip deployment with notice unless `DEPLOYMENT_TARGET` explicitly set, then fails with error. **Operative reality (do not be misled by the above):** the Vercel secrets are unset, so the Actions "Deploy to Vercel" job is a validated **no-op** — its `prisma migrate` step has never run. Real production deploys come from the **Vercel Git integration**, whose build runs the `vercel-build` script (`scripts/vercel-build.sh`) → `prisma migrate deploy` (against `DIRECT_URL`, the direct non-pooled Neon endpoint) → `prisma generate` → `next build`. This is the only path that applies migrations to prod; it was added in PR #22 after prod schema drift (unmigrated `reviews`/`subscribers` tables) 500'd the homepage. A green Deploy badge ≠ a real deploy.

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: conventions -->

## Code Conventions

- **Language**: TypeScript strict mode (`"strict": true`)
- **Path aliases**: `@/*` maps to `./src/*`
- **Formatting**: Prettier with double quotes, semicolons, 2-space indent, 100 char print width, trailing commas (es5), tailwindcss plugin
- **Linting**: ESLint flat config format (eslint.config.mjs) with next/core-web-vitals + next/typescript configs
- **Pre-commit**: Husky + lint-staged (eslint --fix + prettier --write on TypeScript files; prettier --write on JS/JSON/MD files)
- **Components**: PascalCase filenames for React components (e.g., `AdminSidebar.tsx`, `ProductCard.tsx`)
- **Non-component files**: kebab-case (e.g., `api-utils.ts`, `cart.store.ts`, `use-debounce.ts`)
- **UI primitives**: shadcn/ui components in `src/components/ui/` (Radix UI + Tailwind + CVA)
- **State management**: Zustand with `persist` middleware, stores in `src/stores/*.store.ts`
- **Validation**: Zod schemas in `src/lib/validations/` (index.ts for core entities including newsletter, google-shopping.ts for feed items), shared between client and server
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
- **Dynamic-route params in client pages**: client-component dynamic routes read their segment via `useParams<{ id: string }>()!` from `next/navigation` — fixed in G3 after all 4 `[id]` client pages (`/admin/orders/[id]`, `/admin/products/[id]`, `/admin/suppliers/[id]`, `/account/orders/[id]`) 500'd calling `use(params)` on Next 14.2.35, which passes `params` as a plain object (Promise-based params is Next 15 behavior). The trailing `!` is required: `next-env.d.ts` references the pages-router compat types (the repo keeps `pages/` error stubs), which redeclare `useParams(): T | null` project-wide. `useParams` works unchanged on Next 14/15/16, so the ROADMAP'd upgrade needs no re-migration. Server components and API handlers keep Promise-typed `await params` (tolerant on 14, correct on 15+). Regression: `tests/unit/dynamic-route-params.test.tsx`
- **Search debouncing**: Admin list pages debounce search input (300ms) via `useDebounce` hook to reduce API calls
- **Suspense-wrapped list pages**: Admin list pages wrap content in `<Suspense>` with loading skeleton fallbacks
- **Social sharing pattern**: Platform-specific URL builders (`buildShareUrl`) with proper URI encoding; Web Share API detection (`canUseNativeShare`) with graceful fallback to clipboard copy on failure
- **OG image file convention**: Product pages use `opengraph-image.tsx` file-based generation (exports `alt`, `size`, `contentType`, and default `Image` function returning `ImageResponse`); Next.js automatically wires images into meta tags. A **site-wide** root `src/app/opengraph-image.tsx` (added TASK-035/PR #21) covers every route without its own card. **Gotcha:** a segment's `opengraph-image` file is only merged if that same segment's metadata export leaves `openGraph.images` unset (`mergeStaticMetadata`'s `!source.openGraph.hasOwnProperty('images')` guard). `getDefaultMetadata()` therefore must **not** set `openGraph.images`/`twitter.images` — doing so silently suppressed the generated card and pinned every route to the stale `public/og-image.png`
- **Native share visibility**: Native share button rendered with CSS hiding (`sm:hidden`) instead of conditional rendering to avoid hydration mismatch
- **Google Shopping feed pattern**: RSS 2.0 XML with Google Shopping namespace; strict Zod validation for title (max 150 chars), description (max 5000 chars), price format (`/^\d+\.\d{2} [A-Z]{3}$/`), GTIN (8/12/13/14 digits), and enum values; XML escaping for special characters; hourly revalidation with stale-while-revalidate. **Per-product opt-out (G16)**: the route selects `where: { isActive: true, excludeFromFeed: false }` — an explicit `Product.excludeFromFeed` boolean, not a brand allowlist, so trademark-bearing imagery stays out of the feed regardless of which text fields are set. **`image_link` is resolved against `siteConfig.url`** (`new URL(url, baseUrl)`): it is validated with `z.string().url()`, which rejects the root-relative paths seeded products store, and because the route filters on `validateFeedItemSafe` a rejected item is dropped **silently** — that bug kept the feed at zero items from the first seeded catalog until G16 (2026-09-01)
- **Feed validation filtering**: Use `validateFeedItemSafe()` with `.filter()` after `.map()` to exclude invalid items from feeds instead of breaking serialization; prevents malformed data (e.g., non-numeric GTINs) from corrupting XML output
- **Product identifier fields**: Schema includes optional `brand` and `mpn` (Manufacturer Part Number) fields for Google Shopping compliance and product catalog enrichment
- **Image blur placeholders**: SVG-based shimmer effect for `next/image` placeholder="blur"; `DEFAULT_BLUR_DATA_URL` constant provides lightweight gradient animation; `IMAGE_SIZES` const defines responsive sizes for productCard, productDetail, thumbnail, categoryCard, hero
- **Resource hints pattern**: `preconnect` for critical third-party domains (Stripe, GTM) enables early connection establishment; `dns-prefetch` for secondary domains (Google Analytics, Google Fonts) reduces DNS lookup latency; hints added in root layout `<head>`
- **Web Vitals tracking**: Core Web Vitals (CLS, LCP, FCP, TTFB, INP) captured via `web-vitals` library and reported to GTM dataLayer; `WebVitalsReporter` component dynamically imports metrics library, runs client-side only; dataLayer clearing (`{ ecommerce: null }`) applied before events for consistency with analytics.ts pattern
- **Deferred font loading**: Theme-specific fonts (Playfair Display, Lora) loaded with `preload: false` and `display: swap` to defer loading until CSS actually uses them; saves ~60-80KB on initial load for users on default theme
- **E2E test setup pattern**: Playwright config uses `globalSetup` hook (tests/global-setup.ts) to validate infrastructure before tests run; checks database connection via Prisma `$queryRaw`, verifies seed data exists (categories and active products), throws error if data missing; prevents test failures from infrastructure issues
- **CI E2E configuration**: Port management via `IS_CI` flag (port 3000 in CI, 3001 local); CI uses pre-built app with `npm start` (build happens in separate job); PostgreSQL 16 and Redis 7 as GitHub Actions services with health checks; requires AUTH_TRUST_HOST=true for NextAuth in CI environment
- **E2E timeout tuning**: Test timeout 30s in CI (60s local), navigation timeout 15s in CI (45s local); 2 retries in CI (0 local); chromium + webkit in CI (all five projects local — `Mobile Safari`, `firefox`, `Mobile Chrome` excluded from CI since CI runs `workers: 1`, so each project costs a full serial pass); webServer stdout/stderr piped for debugging
- **Mobile-responsive E2E tests**: Tests use Playwright's `isMobile` context property for viewport-aware assertions; navigation tests conditionally check desktop menu visibility (`if (!isMobile)`) while always testing mobile-specific elements; flexible selectors (`.first()`, regex matching) handle multiple matching elements across viewport sizes
- **CI secret validation pattern**: GitHub Actions jobs validate required secrets before execution; bash script checks for empty variables, builds error message listing missing secrets, then either fails (if `DEPLOYMENT_TARGET` explicitly set) or skips gracefully (if unset); all subsequent steps conditional on validation with `if: steps.validate.outputs.skip != 'true'`
- **Dual deployment strategy**: Single workflow handles both Vercel and VPS deployments via `jobs.<job>.if` conditions checking `vars.DEPLOYMENT_TARGET`; Vercel job runs if value is `vercel` or empty string; VPS job runs if value is `vps`; prevents both paths executing simultaneously; notify job uses `needs: [deploy-vercel, deploy-vps]` with `if: always()` to report status regardless of which path ran
- **Review eligibility pattern**: Customer reviews require verified purchase (order status `DELIVERED` with product in order items); eligibility check via `/api/reviews/eligibility?productId=xxx` returns `canReview`, `hasExistingReview`, `orderId`; enforces one review per product per user via unique constraint `userId_productId`; client checks eligibility before showing form
- **Review visibility management**: Admin reviews page filters by `isHidden` status; toggle endpoint `PATCH /api/admin/reviews/[id]/visibility` manages visibility (default `false` = visible); product detail pages exclude hidden reviews from display (`where: { isHidden: false }`)
- **Admin review reply pattern**: Two-step pattern for admin replies: (1) form pre-populates with existing `adminReply` text if already replied, (2) `PATCH /api/admin/reviews/[id]/reply` updates reply text and sets `adminRepliedAt` timestamp; product display shows admin replies with timestamp (`adminRepliedAt` formatted relative to review creation)
- **Review deletion cascade**: `onDelete: Cascade` on Review foreign keys ensures reviews cascade-delete when user/product/order deleted; unique constraint prevents orphaned reviews; index on `isHidden` for fast visibility filtering
- **Review data structure**: Prisma Review model stores `rating` (1-5), `comment` (optional, max 2000 chars via schema validation), `isHidden` (boolean, default false), `adminReply` (optional, max 1000 chars), `adminRepliedAt` (timestamp); client interfaces extend with `user` details and computed fields (`averageRating`, `totalReviews`, `ratingDistribution`)
- **Product JSON-LD with reviews**: Single consolidated JSON-LD per product page generated by `getProductJsonLd()` in seo.ts; includes product details (name, description, price, image, brand) plus embedded review markup (author, ratingValue, reviewBody, datePublished) and aggregateRating (bestRating, worstRating, ratingValue, ratingCount) for Google Rich Results and voice search optimization
- **Newsletter double opt-in pattern**: Subscribe flow creates Subscriber record with PENDING status, generates crypto-random confirmation token (24-hour expiry), sends confirmation email via Resend; confirm endpoint validates token expiry and updates status to ACTIVE; race condition handling in subscribe endpoint via Prisma unique constraint catch (P2002 error code)
- **HMAC-based unsubscribe tokens**: Deterministic unsubscribe URLs use HMAC-SHA256 with NEXTAUTH_SECRET to prevent token forgery; token verifies subscriber ID ownership before allowing unsubscribe; no database storage required for unsubscribe tokens
- **Newsletter admin management**: Admin dashboard with search (email), status filter (PENDING/ACTIVE/UNSUBSCRIBED), pagination (20 per page), status toggle (activate/unsubscribe), delete functionality, and CSV export with formula injection prevention
- **Email normalization pattern**: Newsletter subscribe endpoint normalizes emails to lowercase and trims whitespace before database operations to prevent duplicate subscriptions with different casing
- **Seed data modularization**: Database seed split into domain modules in `prisma/seed-data/` (users, categories, products, orders, reviews, subscribers); seed.ts orchestrates imports and manages entity relationships via Map<string, string> for foreign keys; supports upsert operations for idempotent seeding. Since TASK-057 the catalog is the **Mirox Ukrainian clothing range** (8 products across 2 top-level + 6 sub categories, UAH-denominated prices, `brand: "Mirox"`; since TASK-037 the two hoodie colorways are linked via `Product.styleGroup`, the one-size cap uses «Один розмір», and since G14 variant names are the UA data values «Розмір»/«Колір» sourced from `src/lib/variant-names.ts` — prod was renamed in place by migration `20260815095848`, never re-seeded), with 4 test customers, 7 orders, 8 Ukrainian-language reviews, and 6 newsletter subscribers, for E2E testing and feature validation. **Destructive by design**: `main()` calls `assertLocalDatabase()` first and deletes the whole catalog/transactional tree (reviews, supplier orders, order items, orders, cart items, variants, images, products, categories) before reseeding — refuses to run against a non-local `DATABASE_URL` host unless `SEED_ALLOW_REMOTE=1` is explicitly set, reserved for a deliberate, user-approved production re-seed
- **UAH price display**: `formatPrice()` in `src/lib/format.ts` is the only sanctioned money formatter (per the Ukraine payments decision doc §7.4) — `Intl.NumberFormat("uk-UA", …)` with non-breaking-space thousands separators, comma decimals shown only for fractional amounts, and a `"грн"` suffix joined by a non-breaking space (e.g. `"1 290 грн"`); every customer-facing price render (ProductCard, PDP, cart, checkout summary, account orders) uses it — never hand-roll a price string. Stripe still charges test-mode `currency: "usd"` on the same numeric amount until TASK-048; this is a documented, deliberate mismatch, not a bug
- **Conservative dependency updates**: During freeze periods or stability phases, update only patch/minor versions within semver ranges (`npm update`); defer major version upgrades requiring migration guides; explicitly document packages kept at older versions with reasoning; verify all checks pass after updates (lint, typecheck, tests, build)
- **Stripe API version sync**: Stripe SDK minor updates can change expected `apiVersion` type string in stripe.ts; after updating `stripe` package, check TypeScript errors in stripe.ts and update `apiVersion` to match SDK expectations (e.g., 2025-12-15 → 2026-01-28 when upgrading stripe 20.1→20.3)
- **Vitest API test pattern**: `createNextRequest()` helper builds NextRequest with method/body/searchParams for testing API routes; `createRouteParams()` wraps params as Promise for Next.js 14 dynamic route handlers; all API tests mock `@/lib/auth` and `@/lib/db` via `vi.mock()` before imports
- **Mock setup conventions**: Test files declare all `vi.mock()` calls at top before any imports (hoisting); use `beforeEach(() => vi.clearAllMocks())` for isolation; mock Prisma methods as `vi.fn()` with `.mockResolvedValue()` for async returns
- **Test organization**: Describe blocks use full endpoint paths as titles (`GET /api/admin/newsletter`); test names describe HTTP status and scenario (`returns 401 when not authenticated`); helpers section defines reusable session fixtures and mock functions
- **Validation testing**: API tests verify Zod validation with invalid inputs (missing fields, out-of-range values, type mismatches) and expect 400 status; test both required field omissions and constraint violations
- **Auth testing pattern**: Mock `auth()` with `null` for 401 tests, customer session for 403 tests, admin session for authorized tests; use helper functions like `mockAuth(session)` for readability
- **Prisma query assertions**: Tests verify Prisma was called with correct `where`, `skip`, `take`, `orderBy` via `expect.objectContaining()` pattern; allows partial matching of complex query objects
- **Environment-dependent tests**: Tests that depend on `process.env` store `originalEnv` in module scope, set values in `beforeEach`, restore in `afterEach`; prevents cross-test pollution
- **Next.js 14 params testing**: Dynamic route tests use `createRouteParams({ id: 'x' })` which returns `{ params: Promise<{ id: 'x' }> }` matching Next.js 14 async params convention
- **Test coverage targets**: Unit tests cover validation errors, auth/authorization failures, Prisma query construction, success paths with mocked data, and edge cases (e.g., email normalization, status filtering)
- **Query param validation pattern**: API routes parse numeric filters with `parseInt(value, 10)` returning NaN for invalid input, then validate with `!isNaN(num) && num >= min && num <= max`; spreads validated value into query object with conditional spread (`...(valid ? { field: num } : {})`); avoids throwing errors on malformed user input
- **Type serialization pattern**: Server components fetch Prisma types with Date objects; client components receive serialized interfaces with dates as strings (e.g., `ReviewWithUser` extends Review with `createdAt: string`, `adminRepliedAt: string | null`); pattern documented in `src/types/index.ts` with "Serialized" prefix in interface names
- **Client-side eligibility checking**: Components that conditionally render forms based on user state fetch eligibility via API in `useEffect` hook on mount; store eligibility state (`canReview`, `hasExistingReview`, `orderId`) in local state; silently fail fetch errors (form just doesn't render); pattern used in ReviewSection for verified purchase validation
- **Schema refinement split pattern**: Separate base schema (ZodObject) from refined schema (ZodEffects) to enable `.partial()` usage; `productBaseSchema` defines fields, `productSchema` adds cross-field validation via `.refine()`; allows admin update routes to use `productBaseSchema.partial()` without type errors; example: comparePrice validation requires `comparePrice > price`
- **Cross-field validation pattern**: Use Zod `.refine()` for validations requiring multiple fields; comparePrice must exceed price if provided; validation message targets specific field via `path` option; enforced on both server (API routes) and client (form validation)
- **API error handling pattern**: API routes use `try/catch` with `apiError()` helper for consistent error responses; no `console.error()` calls in API routes (removed during TASK-029 cleanup); catch blocks with unused error variables use bare `catch` syntax without error parameter (ESLint recommended pattern from TASK-031); structured error responses via `NextResponse.json()` with appropriate status codes
- **Bare catch syntax**: When catch block doesn't use error variable, use bare `catch` without parameter (e.g., `} catch {` instead of `} catch (error) {`); pattern enforced by ESLint and applied across API routes, client components, server pages, and utilities during TASK-031 code quality sweep
- **Coded API outcomes**: newsletter routes (`api/newsletter/{subscribe,confirm,unsubscribe}`), the register 409 (`api/auth/register`), and `api/feedback` (`FEEDBACK_SENT`/`VALIDATION_ERROR`/`SEND_FAILED`, G8) return a machine `code` alongside English prose; clients map `code` → locale copy via each namespace's own `byCode` object in `messages/{uk,ru}.json` (`newsletter.confirm.byCode`, `newsletter.unsubscribe.byCode`, `newsletter.signup.byCode`, `feedback.byCode`), guarded by next-intl's `t.has(key as never)` before rendering a dynamic key, with a namespace `fallback` string when the code has no catalog entry (TASK-039 G9 superseded the G2 `create-order`/G4/G8-era `src/content/{newsletter,feedback}.ts` byCode maps — both files deleted)
- **Transactional email pattern** (G5): all emails (order confirmation, newsletter double opt-in, feedback notification — the last added in G8) render on the shared dark Mirox table-based shell (`src/lib/email-templates/layout.ts` — `renderEmailShell`/`renderPanel`/`renderButton`, `lang="uk"`, bgcolor attrs for Outlook); UA copy sourced from `src/content/emails.ts`, never inlined; brand name resolved at render time via `getStoreName()` (`env NEXT_PUBLIC_STORE_NAME || BRAND_NAME`) — a module-scope const would freeze the env value at import and break env-dependent tests; every interpolated free-text user/DB string passes through `escapeHtml` (item names, variant info, address fields, subscriber email); order CTA is guest-aware (`OrderEmailData.hasAccount`) — guest COD orders have no `/account/orders` to link to, so the button renders only for signed-in customers (G2 confirmation-page ruling); tax row renders only when `tax > 0` (COD is always 0); contact links pull from `brand.ts` `SOCIALS`/`WHATSAPP_HREF`, so WhatsApp stays hidden until the client supplies a real number; **route sends are `await`ed** — an unawaited fire-and-forget dies when the serverless function freezes after responding, so prod never sent (regression-tested by the create-order race test)
- **Cookie-mode i18n via next-intl** (TASK-039): UA is the default and SEO-canonical locale; RU is a pure client-preference toggle stored in a `NEXT_LOCALE` cookie (`src/i18n/config.ts` — `LOCALES`, `DEFAULT_LOCALE`, `resolveLocale()` never trusts the wire value). No URL routing — every route keeps the same path in both locales, deliberately (a toggle, not a routing migration). `src/i18n/request.ts` (`getRequestConfig`) resolves the cookie server-side and deep-merges `messages/ru.json` over `messages/uk.json` (`src/i18n/merge.ts`'s `deepMerge`), so a missing or shape-mismatched RU key silently falls back to the UA value — partial RU coverage never breaks the UI. `LocaleSwitcher` (`src/components/common/LocaleSwitcher.tsx`, mounted in Header) calls the `setLocale` server action (`src/i18n/actions.ts`), which sets the cookie and lets router-cache invalidation re-render the tree in the new locale. **Component rule**: non-async components/functions call `useTranslations(namespace)`; async functions (SEO metadata helpers, any Server Component that awaits before rendering) call `await getTranslations(namespace)` instead — `src/lib/seo.ts`'s 6 metadata helpers (`getDefaultMetadata`, `getProductMetadata`, `getHomeMetadata`, `getProductsListingMetadata`, `getCategoriesListingMetadata`, `getAuthMetadata`) and the root `src/app/layout.tsx`'s `generateMetadata()` are all async and use `getTranslations` (the one former sync holdout, `getCategoryMetadata`, was deleted with the `/categories/[slug]` page in G12). **byCode guard pattern**: `t.has(key as never) ? t(key as never) : t("fallback")` before rendering a dynamic coded-outcome key (next-intl v4.13.6) — see the Coded API outcomes pattern above. **Verification**: `scripts/i18n-byte-diff.mjs` diffs `src/**/*.{ts,tsx}` against `main`, extracts every Cyrillic string-literal fragment on a removed line, and fails if it isn't present verbatim in `messages/uk.json` — catches transcription corruption (the «цінує»→«цінює» class); deliberate rewrites (e.g. UA dev comments translated to English) are allowlisted one fragment per line in `scripts/i18n-byte-diff-allow.txt`. **Tests**: `tests/helpers/render-with-intl.tsx`'s `renderWithIntl()` wraps RTL renders in `NextIntlClientProvider` with the real `uk.json` messages, so component tests assert against actual catalog strings, not mocks. **Admin namespace shipped (G13)**: `admin.*` is populated and catalog-driven — admin chrome (sidebar, page titles, forms, tables, dialogs, toasts) renders in Ukrainian; status badges (orders, products, reviews, suppliers) source their labels from the catalog instead of raw enum values (`account.orderStatus`/`account.paymentStatus` reused for order/payment badges; supplier order status via `admin.supplierOrderStatus`). **UA-only by decision** (2026-08-16): RU deliberately has no `admin.*` keys — the deep-merge fallback renders UA for RU-toggled admins, since admin is an internal tool, not customer-facing. **Provider split**: the root `src/app/layout.tsx` strips the `admin` namespace out of the messages object before handing it to the storefront's `NextIntlClientProvider` (so `admin.*` strings never reach the public client payload); the `(admin)` route group's own layout re-provides the full unfiltered catalog via a nested `NextIntlClientProvider`. One deliberate residual: `ProductForm.tsx` keeps three literal «грн» currency-unit suffixes next to price inputs — a currency symbol, not translatable copy, so it stays hardcoded regardless of locale. The former `content/account.ts` label duplicate was deleted in PR #37 review round 2 — it had no production consumers.

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: git-insights -->

## Git Insights

- **Commit style**: Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`) with optional scope (`feat(seo):`, `feat(perf):`, `fix(ci):`, `fix(e2e):`, `feat(deploy):`)
- **Branch naming**: `feat/task-NNN-description` pattern
- **Recent focus**: Project freeze completed (2026-02-09 to 2026-02-12) with all stability and cleanup tasks finished; code quality sweep (ESLint warnings → 0, dead code removal), documentation finalization (16 files updated), test coverage improvement (246 tests, 89.82% coverage), technical debt cleanup, dependency audit (30 packages updated, 1 HIGH vulnerability fixed); post-freeze code review added 2 backlog items (DONE.md statistics accuracy, precise test counts in docs)
- **Known challenges**: Prisma + Vercel serverless requires Neon adapter; Next.js 14/React 18 pinned for stability (React.cache not available in React 18); NextAuth requires `AUTH_TRUST_HOST=true` in CI E2E tests; E2E tests need seeded database with categories and active products; a container-wide `NODE_ENV=development` (devcontainer `containerEnv` + `.env.example`'s own line) silently corrupted every responsive (`sm:`/`md:`/`lg:`/`xl:`) Tailwind utility in a **local** `next build`'s compiled CSS (Vercel unaffected — the platform sets its own `NODE_ENV=production` first) — fixed by removing both (TASK-057); do not re-add a `NODE_ENV` line to either file; a third copy in `/etc/environment` corrupts local `next build` CSS the same way (found in G4) — dev server and Vercel unaffected; do not trust local prod-build visuals in this container until removed; separately, Tailwind v4 arbitrary values with nested commas (e.g. grid-template functions like `repeat(auto-fill,minmax(16rem,1fr))`) silently don't compile here — always verify against the compiled CSS, not just the className; an inline `style` is the sanctioned fallback (account overview precedent, G4); third silent-drop class (G8/PR #36): Tailwind v4's **production** build discards a bare `@media` block nested inside `@layer utilities` while dev keeps it (the reduced-motion resets never reached prod CSS from TASK-034 until PR #36) — author such resets un-layered at top level (they also win the cascade there), and "verify compiled CSS" means the `next build` output, never the dev server; Vercel's restored build cache can additionally serve byte-identical stale CSS across deploys (source changes don't bust it; `x-vercel-cache: MISS` on fresh HTML still referencing the old chunk hash) — after any CSS-affecting deploy verify the served chunk hash changed, and fix via dashboard Redeploy with build cache unchecked (or `VERCEL_FORCE_NO_BUILD_CACHE=1`)
- **CI improvements**: E2E infrastructure overhaul with global setup validation, separated build and test jobs, PostgreSQL 16 + Redis 7 services with health checks; deployment workflow with graceful secret validation, dual-target support (Vercel/VPS), conditional job execution, and comprehensive deployment documentation; JS files auto-formatted on commit via lint-staged; E2E tests run chromium + webkit in CI (webkit added in TASK-038a — CI was chromium-only, which is why a WebKit-only failure went unnoticed) with port 3000, pre-built app, and optimized timeouts
- **Deployment strategy**: Dual-path deployment via `DEPLOYMENT_TARGET` variable (vercel/vps); graceful degradation when secrets missing (skip with notice if unset, fail with error if explicitly set); Vercel path uses CLI for pull/build/deploy + migrations; VPS path uses SSH action with git pull + pm2 restart; both paths validate secrets before execution. **In practice the Actions Vercel job is a no-op (secrets unset); production is deployed by the Vercel Git integration, and migrations are applied by the `vercel-build` script (`scripts/vercel-build.sh` → `prisma migrate deploy` via `DIRECT_URL`), added in PR #22.** See the "Operative reality" note under Deployment pipeline above
- **Latest release**: v1.2.0 (2026-02-12, tag at commit 1ab109a) - Freeze complete with all MVP features (TASK-001 through TASK-016), post-MVP enhancements (TASK-017 through TASK-024), and freeze cleanup (TASK-027 through TASK-032) finished; project tagged and ready for post-freeze resumption
- **Project status**: Freeze period completed ahead of schedule (2026-02-09 to 2026-02-12, originally planned through 2026-02-13); all 32 tasks complete; TODO.md cleared, planning docs updated; see BACKLOG.md (~50+ enhancement ideas) and ROADMAP.md (post-freeze resumption guide) for future work
- **Freeze week results**: 6 tasks completed - TASK-027 (Dependency Audit), TASK-028 (Test Coverage - 158 new tests), TASK-029 (Technical Debt - 6 items resolved), TASK-030 (Documentation - 16 files), TASK-031 (Code Quality - 24 ESLint warnings → 0), TASK-032 (Finalization & Release Tag)
- **Active tasks**: v1.3 "Mirox Rebrand Demo" — TASK-034/035/036/037/057 shipped (PRs #19, #21/#23, #26, #27, #24); **TASK-039 i18n shipped 2026-08-15** (G9, PR #37 `2c93da7` — next-intl cookie mode, UA default + RU toggle; the RU catalog is a DRAFT pending client sign-off), **G13 admin-panel translation shipped 2026-08-17** (PR [#40](https://github.com/GoodAlex223/dropshipping-test/pull/40) merged `56328f0` — dashboard + all admin routes catalog-driven UA; the former EN/raw-enum admin chrome is gone; see the Admin namespace note above), **TASK-058/059 shipped 2026-08-14** (G8, PRs #35/#36 — feedback form + launch marquee); remaining v1.3: TASK-040 CI extensions, plus spawned TASK-055/056 (content/legal, client inventory) — see docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md for the Mirox Shop program (rebrand + Ukraine launch, milestones v1.3/v1.4/v2.0)

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: best-practices -->

## Best Practices

- Run `npm run typecheck` before committing to catch type errors early
- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format:check` to verify formatting before CI (matches CI job)
- Use `npm run test:run` for a single test pass (CI-style); use `npm run test:coverage` to generate coverage report
- Run `npm run db:seed` after database setup to populate test data required for E2E tests; seed data is modular and located in `prisma/seed-data/` for easy extension
- **Unit test pattern**: Create `*.test.ts` files in `tests/unit/`; mock external dependencies (`@/lib/auth`, `@/lib/db`, `@/lib/email`) at top before imports; use `createNextRequest()` helper for API route testing; verify both success paths and error handling (validation, auth, 404s)
- When modifying Prisma schema, run `npm run db:migrate` to create migration, then `npm run db:generate`
- **Seed data management**: Add new seed data by creating/editing files in `prisma/seed-data/` (users, categories, products, orders, reviews, subscribers); seed.ts automatically imports and processes data; maintain entity relationships by referencing slugs/SKUs/emails; use backdated timestamps via `daysAgo()` helper for realistic test data
- Always add Zod validation schemas for new API endpoints in `src/lib/validations/` (index.ts for core schemas, separate files for specialized domains like google-shopping.ts)
- Use `requireAdmin()` or `requireAuth()` for protected API routes, never roll custom auth checks
- Keep UI primitives in `src/components/ui/` unchanged by default (shadcn/ui managed — regenerate with the CLI rather than editing). Two sanctioned hand-edit classes, both of which must be **re-applied after any CLI regeneration**: `sonner.tsx`'s hardcoded theme (TASK-034 dropped `next-themes`), and the `React.forwardRef` + `displayName` wrapper on `button.tsx`, `input.tsx` and `textarea.tsx` — react-hook-form's `register()` ref has to reach the DOM node, and a plain function component silently swallows it. See `src/components/CLAUDE.md`
- **Docs freshness is enforced by a test** (`tests/unit/docs-freshness.test.ts`, G11): if you bump a doc's `**Last Updated**`, bump its `docs/README.md` index row in the same commit (and the index's own header, which must be ≥ every date it lists); every `.md` in an indexed directory needs an index row; relative links must resolve; `prettier --write` must be idempotent. Design specs under `docs/superpowers/specs/` carry `**Date**:` (authoring date, never edited, never compared) — a file with no `**Last Updated**` is skipped, never failed. Archiving a plan is two edits: move the file _and_ move its index row.
- Environment variables: never commit `.env` files; use `.env.example` as reference; note Docker Compose port mappings (host 5433→container 5432 for Postgres, host 6380→container 6379 for Redis); Google OAuth, Meilisearch, and Sentry marked as NOT YET IMPLEMENTED
- Use `next/image` for all images; avoid native `<img>` tags (ESLint enforced)
- **Performance**: Add blur placeholders to all product/category images using `DEFAULT_BLUR_DATA_URL` and `IMAGE_SIZES` from `image-utils.ts`; Web Vitals are automatically tracked via `WebVitalsReporter` in providers
- **Deployment secrets**: Configure GitHub Actions secrets before deploying (see docs/deployment/setup.md); Vercel requires VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, DATABASE_URL, NEXTAUTH_SECRET; VPS requires VPS_HOST, VPS_USERNAME, VPS_SSH_KEY; missing secrets cause graceful skip or explicit failure depending on DEPLOYMENT_TARGET setting

<!-- END AUTO-MANAGED -->

<!-- MANUAL -->

## Custom Notes

Add project-specific notes here. This section is never auto-modified.

<!-- END MANUAL -->
