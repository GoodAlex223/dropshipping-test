# Module: Components

<!-- AUTO-MANAGED: module-description -->

## Purpose

Shared React components organized by domain: admin panel, analytics tracking, checkout flow, common layout, product display, shop interactions, multi-theme showcase, theme configuration, and shadcn/ui primitives.

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: architecture -->

## Module Architecture

```
components/
├── admin/                 # Admin panel components
│   ├── AdminSidebar.tsx   # Navigation sidebar (collapsible)
│   ├── ImageUploader.tsx  # S3 image upload with drag-and-drop
│   ├── ProductForm.tsx    # Product create/edit form (react-hook-form + zod, includes "Product Identifiers" card with brand/barcode/MPN fields)
│   ├── ProductImportDialog.tsx  # CSV import dialog (supports brand/barcode/MPN columns)
│   └── index.ts           # Barrel exports
├── analytics/             # Analytics tracking components
│   ├── PurchaseTracker.tsx  # One-time purchase event tracker (useRef pattern)
│   └── WebVitalsReporter.tsx  # Core Web Vitals tracking to GA4 (dynamic import, client-only)
├── checkout/
│   ├── PaymentForm.tsx    # Stripe Elements payment form
│   └── index.ts
├── common/
│   ├── Header.tsx         # Site header with nav, cart, auth
│   ├── Footer.tsx         # Site footer
│   ├── CookieConsent.tsx  # GDPR cookie consent banner + GTM loader (Zustand persisted)
│   ├── ResourceHints.tsx  # Resource hints (preconnect/dns-prefetch for third-party domains)
│   └── index.ts
├── products/
│   ├── ProductCard.tsx    # Product card with blur placeholders and responsive sizes
│   ├── SocialShareButtons.tsx  # Social media sharing buttons (Facebook, Twitter, Pinterest, WhatsApp, Telegram, copy link, native share)
│   └── index.ts
├── reviews/               # Review components
│   ├── ReviewSection.tsx  # Main review section with stats and eligibility check
│   ├── ReviewForm.tsx     # Customer review submission form with star rating
│   ├── ReviewList.tsx     # Paginated list of reviews
│   ├── ReviewItem.tsx     # Individual review display with admin reply
│   ├── ReviewStats.tsx    # Average rating and distribution visualization
│   ├── StarRating.tsx     # Star rating input component
│   └── index.ts
├── shop/
│   ├── CartDrawer.tsx     # Slide-out cart drawer (Sheet) with view_cart tracking
│   └── index.ts
├── showcase/              # Multi-theme showcase system
│   ├── bold/              # Bold theme components (Hero, Features, Categories, ProductGrid, CTA)
│   ├── luxury/            # Luxury theme components (same structure)
│   ├── organic/           # Organic theme components (same structure)
│   ├── types.ts           # Shared showcase types
│   ├── data-fetchers.ts   # Server-side data fetching for showcase
│   └── index.ts
├── theme/
│   ├── theme-config.ts    # Theme configuration and variants
│   ├── theme-switcher.tsx # Theme toggle component
│   └── index.ts
├── ui/                    # shadcn/ui primitives (DO NOT modify directly)
│   ├── button.tsx, card.tsx, dialog.tsx, form.tsx, input.tsx, ...
│   └── (20+ Radix-based components with Tailwind styling)
└── providers.tsx          # App-wide context providers (theme, auth, toast, cookie consent, web vitals)
```

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: conventions -->

## Module-Specific Conventions

- **Naming**: PascalCase for component files (`ProductCard.tsx`), kebab-case for non-component files (`data-fetchers.ts`, `theme-config.ts`)
- **Client directive**: Interactive components use `"use client"` at file top
- **Barrel exports**: Each subdirectory has `index.ts` re-exporting public components
- **UI primitives**: `ui/` directory contains shadcn/ui components — regenerate with CLI rather than editing directly
- **Styling**: Tailwind CSS classes with `cn()` utility for conditional class merging (clsx + tailwind-merge)
- **CVA**: Class Variance Authority for component variants (button, badge, etc.)
- **Forms**: react-hook-form + @hookform/resolvers/zod for form state and validation
- **Icons**: lucide-react for all iconography
- **Showcase pattern**: Each theme variant (bold, luxury, organic) has identical component structure: Hero, Features, Categories, ProductGrid, CTA
- **Analytics tracking**: Use `useRef` to track events once (prevent re-render duplication), call tracking functions from `@/lib/analytics`
- **Cookie consent**: Zustand store with `persist` middleware, GTM loads conditionally when consent status is "accepted"
- **Social sharing**: Platform-specific URL builders in `share-utils.ts`, Web Share API detection with fallback to clipboard copy, native share button uses CSS hiding (`sm:hidden`) to avoid hydration mismatch
- **Custom icons**: Use lucide-react for icons; for platforms without lucide support (e.g., Pinterest), create custom SVG components
- **Web Vitals**: `WebVitalsReporter` uses dynamic import (`ssr: false`) to ensure client-only execution; captures CLS, LCP, FCP, TTFB, INP via `web-vitals` library; reports to GA4 via GTM dataLayer with dataLayer clearing pattern (`{ ecommerce: null }`) for consistency; console logs in development
- **Resource hints**: `ResourceHints` component exports `PRECONNECT_DOMAINS` (Stripe, GTM), `DNS_PREFETCH_DOMAINS` (Google Analytics, Google Fonts), and helper function `getResourceHintTags()` for server-side rendering
- **Image optimization**: `ProductCard` uses `DEFAULT_BLUR_DATA_URL` and `IMAGE_SIZES.productCard` from `@/lib/image-utils` for optimized loading with blur placeholders
- **Deferred font loading**: Theme-specific fonts (Playfair Display, Lora) loaded in root layout with `preload: false` and `display: swap` for optimal performance; saves ~60-80KB on initial load for users on default theme
- **Review eligibility pattern**: `ReviewSection` handles eligibility checking client-side; fetches `/api/reviews/eligibility?productId=xxx` on mount to determine if form should render; displays form only if user has delivered order containing product and hasn't already reviewed it

<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: dependencies -->

## Key Dependencies

- `react`, `react-dom` (v18) — Core UI library
- `@radix-ui/*` — Headless UI primitives (dialog, dropdown, select, tabs, etc.)
- `class-variance-authority` — Component variant system
- `clsx` + `tailwind-merge` — Conditional class composition
- `lucide-react` — Icon library
- `react-hook-form` + `@hookform/resolvers` — Form management
- `zustand` — Cart state (CartDrawer, Header), cookie consent state (CookieConsent)
- `@stripe/react-stripe-js` — Payment form elements
- `react-dropzone` — File upload (ImageUploader)
- `sonner` — Toast notifications
- `next-themes` — Dark/light theme switching
- `next/script` — Script component for GTM loading (CookieConsent)
- `web-vitals` — Core Web Vitals measurement library (WebVitalsReporter)

<!-- END AUTO-MANAGED -->

<!-- MANUAL -->

## Notes

<!-- END MANUAL -->
