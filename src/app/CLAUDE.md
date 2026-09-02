# Module: App Router

<!-- AUTO-MANAGED: module-description -->

## Purpose

Next.js 14 App Router directory containing all pages, layouts, API routes, and middleware. Organized into route groups `(admin)`, `(auth)`, `(shop)`, and `showcase` for layout isolation without URL impact.

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: architecture -->

## Module Architecture

```
app/
├── (admin)/admin/         # Admin panel (requires ADMIN role)
│   ├── layout.tsx         # Admin layout with sidebar
│   ├── page.tsx           # Dashboard
│   ├── categories/        # Category CRUD
│   ├── customers/         # Customer list
│   ├── newsletter/        # Newsletter subscriber management
│   │   └── page.tsx       # Subscriber list with search/filter/pagination/export
│   ├── orders/            # Order management + detail view
│   ├── products/          # Product CRUD + new/edit; the [id] edit page mounts
│   │                      #   ProductImagesSection + ProductVariantsSection (G16)
│   ├── reviews/           # Review management (list, reply, hide/show, delete)
│   ├── settings/          # Admin settings
│   └── suppliers/         # Supplier management + detail
├── (auth)/                # Authentication pages
│   ├── layout.tsx         # Centered auth layout
│   ├── error.tsx          # Auth error page
│   ├── login/             # Login page + form component
│   └── register/          # Register page + form component
├── (shop)/                # Customer storefront
│   ├── layout.tsx         # Shop layout (Header + Footer)
│   ├── page.tsx           # Homepage
│   ├── account/           # User account + order history
│   ├── cart/              # Cart page
│   ├── categories/        # Category index; [slug] is a thin 307 to the catalog (G12)
│   ├── checkout/          # Checkout + confirmation page
│   ├── feedback/          # /feedback page + co-located client form (guest-capable, G8)
│   └── products/          # Product listing + detail
│       └── [slug]/        # Product detail page, client component, opengraph-image.tsx
├── newsletter/            # Newsletter public pages
│   ├── confirm/           # Email confirmation landing page
│   │   └── page.tsx       # Token validation and activation UI
│   └── unsubscribe/       # Unsubscribe landing page
│       └── page.tsx       # HMAC token validation and unsubscribe UI
├── showcase/              # Theme demo pages (bold, luxury, organic)
├── api/                   # API route handlers
│   ├── admin/             # Admin-only endpoints (guarded by requireAdmin)
│   │   ├── newsletter/    # Admin newsletter management
│   │   │   ├── route.ts   # GET (list with search/filter/pagination)
│   │   │   ├── [id]/route.ts  # PATCH (update status), DELETE
│   │   │   └── export/route.ts  # GET (CSV export)
│   │   ├── products/      # Product CRUD; [id]/variants (G16) — GET/POST list, PATCH/DELETE [variantId]
│   │   │                  #   ownership-scoped via findFirst({id, productId}); coded outcomes
│   │   │                  #   (PRODUCT_NOT_FOUND / VALIDATION_ERROR / DUPLICATE_VARIANT /
│   │   │                  #   VARIANT_NOT_FOUND / VARIANT_REFERENCED)
│   │   └── reviews/       # Admin review API ([id], [id]/reply, [id]/visibility)
│   ├── auth/              # NextAuth route handler
│   ├── cart/validate/     # Cart validation
│   ├── categories/        # Public category API
│   ├── checkout/          # create-order (guest COD, live) + dormant payment-intent/confirm-order (Stripe, since G2)
│   ├── feedback/          # Public feedback POST (coded outcomes, honeypot silent drop, awaited FEEDBACK_EMAIL send — failed send = 500, G8)
│   ├── health/            # Health check endpoint
│   ├── newsletter/        # Public newsletter endpoints
│   │   ├── subscribe/route.ts    # POST (create subscriber, send confirmation)
│   │   ├── confirm/route.ts      # GET (validate token, activate subscription)
│   │   └── unsubscribe/route.ts  # POST (verify HMAC token, unsubscribe)
│   ├── orders/            # Customer order API
│   ├── products/          # Public product API
│   │   └── [slug]/reviews/  # Product-specific review list
│   └── reviews/           # Customer review API (create, update, delete, eligibility check)
├── feed/                  # Product feeds for external services
│   └── google-shopping.xml/  # Google Shopping RSS 2.0 feed (hourly revalidation);
│                             #   filters excludeFromFeed and resolves image_link against
│                             #   siteConfig.url (G16 — relative paths fail z.string().url()
│                             #   and were silently dropped, keeping the feed empty)
├── layout.tsx             # Root layout (providers, metadata)
├── error.tsx              # Global error boundary
├── not-found.tsx          # 404 page
├── middleware.ts          # Auth middleware (route protection)
├── robots.ts              # Dynamic robots.txt
└── sitemap.ts             # Dynamic sitemap generation
```

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: conventions -->

## Module-Specific Conventions

- **Route groups**: `(admin)`, `(auth)`, `(shop)` define separate layouts but don't appear in URLs
- **Page files**: `page.tsx` for routes, `layout.tsx` for nested layouts, `loading.tsx` for Suspense
- **Client components**: Form components and interactive pages use `"use client"` directive (e.g., `login-form.tsx`, `products-content.tsx`, `product-detail-client.tsx`)
- **API routes**: Export named HTTP method functions (`GET`, `POST`, `PUT`, `DELETE`)
- **API auth**: Admin endpoints call `requireAdmin()` first; customer endpoints call `requireAuth()`
- **Dynamic segments**: `[id]` for admin resources, `[slug]` for public-facing pages
- **Static export control**: Use `export const dynamic = "force-dynamic"` when routes need runtime data
- **Error handling**: Wrap API handlers in try/catch, return standardized error responses via `apiError()`; use bare `catch` syntax when error variable unused (ESLint pattern)
- **Dynamic-route params in client pages**: client-component dynamic pages read their segment via `useParams<{ id: string }>()!` from `next/navigation` (G3 fix — `use(params)` threw on Next 14.2.35 because client components receive plain-object params; Promise params is Next 15 behavior; the `!` is needed because the pages-router compat types referenced by `next-env.d.ts` make `useParams` nullable project-wide). The four `[id]` pages (`admin/orders`, `admin/products`, `admin/suppliers`, `(shop)/account/orders`) are prop-less. Server-component `[slug]` pages and API handlers keep Promise-typed `await params`. Regression: `tests/unit/dynamic-route-params.test.tsx`
- **List page structure**: Admin list pages follow pattern: Suspense wrapper → filters/search → debounced fetch → table/grid → pagination
- **OG image generation**: Use `opengraph-image.tsx` file convention for dynamic Open Graph images (exports `alt`, `size`, `contentType`, and default `Image` function returning `ImageResponse`)
- **OG image text truncation**: Server-side text truncation instead of CSS line clamp (Satori rendering engine limitations)
- **Async SEO metadata (TASK-039)**: the root `src/app/layout.tsx` now exports `generateMetadata()` (async, replacing a static `export const metadata`), and 6 of `src/lib/seo.ts`'s metadata helpers are `async` and call `await getTranslations(namespace)` — `getDefaultMetadata`, `getProductMetadata`, `getHomeMetadata`, `getProductsListingMetadata`, `getCategoriesListingMetadata`, `getAuthMetadata` (the one former sync holdout, `getCategoryMetadata`, was deleted with the `/categories/[slug]` page in G12). Any new metadata export that needs translated copy must follow suit: the exported function (or the helper it calls) becomes `async` and uses `getTranslations`, never the non-async `useTranslations` hook (request-scoped, server-only outside a render — see the cookie-mode i18n Detected Pattern in the root `CLAUDE.md`)
- **Feed routes**: XML/RSS feeds in `feed/` directory; use `export const dynamic = "force-dynamic"` and `export const revalidate = 3600` for hourly updates
- **XML escaping**: Feed routes must escape special characters (&, <, >, ", ') using dedicated `escapeXml()` helper to prevent malformed XML
- **Feed opt-out (G16)**: the Google Shopping route selects `where: { isActive: true, excludeFromFeed: false }` — an explicit per-product boolean, not a brand allowlist, so trademark-bearing imagery cannot reach the feed whatever the text fields say. Because the route filters on `validateFeedItemSafe`, **an item that fails validation is dropped without any error** — that is how a missing `image_link` resolution kept the feed at zero items from the first seeded catalog until 2026-09-01. Any new required field in the feed schema must be checked against what the seed actually writes, not against a hand-made fixture
- **Feed validation**: Use strict Zod schemas (e.g., `google-shopping.ts`) to validate feed items before XML serialization; enforce title/description length limits, price format, GTIN format, and enum values
- **Performance optimizations**: Root layout includes resource hints (preconnect/dns-prefetch) in `<head>`; Web Vitals reporter integrated via providers; deferred theme font loading with `preload: false` and `display: swap`; shop pages (home, product detail, category) use blur placeholders for images
- **Query param validation**: API routes parse numeric filters with `parseInt(value, 10)` which returns NaN for invalid input; validate with `!isNaN(num) && num >= min && num <= max`; spread validated value conditionally into Prisma query (`...(valid ? { field: num } : {})`); pattern avoids throwing on malformed user input (e.g., rating filter in `/api/products/[slug]/reviews`)
- **Coded newsletter/feedback outcomes**: `api/newsletter/{subscribe,confirm,unsubscribe}` attach a machine `code` to every response (`apiError()`'s third arg on error paths, a `code` key inside the `apiSuccess()` payload on success paths — e.g. `ALREADY_SUBSCRIBED`, `LINK_EXPIRED`, `CONFIRMED`); `error`/`message` prose stays English for logs/consumers, while the `newsletter/confirm`, `newsletter/unsubscribe` pages and the `/feedback` form (`FEEDBACK_SENT`/`VALIDATION_ERROR`/`SEND_FAILED`, G8) map `code` → locale copy via each namespace's own `byCode` object in `messages/{uk,ru}.json`, guarded by `t.has(key as never)` (TASK-039 G9 superseded the G2 `create-order`/G4/G8-era `src/content/{newsletter,feedback}.ts` byCode maps — both files deleted)
- **Account + newsletter pages render via next-intl**: `(shop)/account/**` (client components) call `useTranslations("account")`; `newsletter/{confirm,unsubscribe}` call `useTranslations("newsletter.confirm"/"newsletter.unsubscribe")` — no inline literals, no `src/content/` copy modules (TASK-039 G9 superseded G4's `src/content/{account,newsletter}.ts` copy sourcing; both files are now deleted — `account.ts`'s label maps proved consumer-less in PR #37 review round 2: admin status badges now source labels from the catalog via `admin.*` since G13, reusing `account.orderStatus`/`account.paymentStatus`). The account layout nav intentionally omits «Адреси»/«Налаштування»: `/account/addresses` and `/account/settings` don't exist yet, so the links (and their overview cards) were dropped rather than left dead; restoring them is BACKLOG'd until those pages are built

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: dependencies -->

## Key Dependencies

- `next` (v14) — Framework, routing, SSR/SSG
- `next-auth` (v5 beta) — Authentication, session, JWT
- `@prisma/client` — Database queries in API routes
- `stripe` — Server-side payment processing
- `zod` — Request validation in API routes
- `bullmq` — Supplier-order queue (jobs enqueued manually from admin; NOT wired into checkout — see BACKLOG TASK-031 item)
- `next/og` — Open Graph image generation (`ImageResponse`)

<!-- END AUTO-MANAGED -->

<!-- MANUAL -->

## Notes

<!-- END MANUAL -->
