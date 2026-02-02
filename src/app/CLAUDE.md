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
│   ├── orders/            # Order management + detail view
│   ├── products/          # Product CRUD + new/edit
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
│   ├── categories/        # Category listing + detail (with [slug])
│   ├── checkout/          # Checkout + confirmation page
│   └── products/          # Product listing + detail
│       └── [slug]/        # Product detail page, client component, opengraph-image.tsx
├── showcase/              # Theme demo pages (bold, luxury, organic)
├── api/                   # API route handlers
│   ├── admin/             # Admin-only endpoints (guarded by requireAdmin)
│   ├── auth/              # NextAuth route handler
│   ├── cart/validate/     # Cart validation
│   ├── categories/        # Public category API
│   ├── checkout/          # Payment intent + order confirmation
│   ├── health/            # Health check endpoint
│   ├── orders/            # Customer order API
│   └── products/          # Public product API
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
- **Client components**: Form components and interactive pages use `"use client"` directive (e.g., `login-form.tsx`, `category-client.tsx`, `product-detail-client.tsx`)
- **API routes**: Export named HTTP method functions (`GET`, `POST`, `PUT`, `DELETE`)
- **API auth**: Admin endpoints call `requireAdmin()` first; customer endpoints call `requireAuth()`
- **Dynamic segments**: `[id]` for admin resources, `[slug]` for public-facing pages
- **Static export control**: Use `export const dynamic = "force-dynamic"` when routes need runtime data
- **Error handling**: Wrap API handlers in try/catch, return standardized error responses via `apiError()`
- **Async params**: Dynamic route params are Promise-based in Next.js 14; unwrap with `const { id } = use(params)` from `react`
- **List page structure**: Admin list pages follow pattern: Suspense wrapper → filters/search → debounced fetch → table/grid → pagination
- **OG image generation**: Use `opengraph-image.tsx` file convention for dynamic Open Graph images (exports `Image` component returning `ImageResponse`)

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: dependencies -->

## Key Dependencies

- `next` (v14) — Framework, routing, SSR/SSG
- `next-auth` (v5 beta) — Authentication, session, JWT
- `@prisma/client` — Database queries in API routes
- `stripe` — Server-side payment processing
- `zod` — Request validation in API routes
- `bullmq` — Queue job creation in checkout flow

<!-- END AUTO-MANAGED -->

<!-- MANUAL -->

## Notes

<!-- END MANUAL -->
