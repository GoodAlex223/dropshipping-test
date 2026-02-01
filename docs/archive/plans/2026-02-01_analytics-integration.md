# TASK-018: Analytics Integration

**Status**: Complete
**Branch**: `feat/task-018-analytics-integration`
**Created**: 2026-02-01
**Completed**: 2026-02-01

---

## 1. Objective

Integrate Google Tag Manager (GTM) with GA4 e-commerce tracking across the storefront, gated behind a GDPR-compliant cookie consent banner.

## 2. Approach

**Chosen**: Minimal Change Architecture (2 new utility files, 1 new component, modifications to existing pages)

**Alternatives Considered**:

1. **Minimal Change** (chosen) — 3 new files, 9 modified, ~300 lines. Keeps analytics logic close to where events occur.
2. **Clean Architecture** — 8 new files, abstraction layer, ~600+ lines. Over-engineered for the current scope.

**Key Decisions**:

- GTM manages GA4 (not direct GA4 script) — flexible tag management
- Simple accept/decline cookie consent — not tiered/granular
- Full 9-event GA4 e-commerce standard set
- Storefront-only tracking (no admin panel)
- Confirmation page kept as server component with client child for purchase event

## 3. Implementation

### New Files

| File                                           | Purpose                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `src/lib/analytics.ts`                         | GA4 types, pushDataLayer helper, 9 event functions                  |
| `src/components/common/CookieConsent.tsx`      | Consent banner (Zustand + persist), GTM injection                   |
| `src/components/analytics/PurchaseTracker.tsx` | Client component for purchase event on server-rendered confirmation |

### Modified Files

| File                                                       | Changes                                               |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| `src/components/common/index.ts`                           | Barrel export for CookieConsent                       |
| `src/components/providers.tsx`                             | Render CookieConsent                                  |
| `.env.example`                                             | Added NEXT_PUBLIC_GTM_ID                              |
| `src/app/(shop)/products/products-content.tsx`             | view_item_list + select_item                          |
| `src/app/(shop)/categories/[slug]/category-client.tsx`     | view_item_list + select_item                          |
| `src/app/(shop)/products/[slug]/product-detail-client.tsx` | view_item + add_to_cart                               |
| `src/components/shop/CartDrawer.tsx`                       | view_cart                                             |
| `src/app/(shop)/cart/page.tsx`                             | view_cart                                             |
| `src/app/(shop)/checkout/page.tsx`                         | begin_checkout + add_shipping_info + add_payment_info |
| `src/app/(shop)/checkout/confirmation/page.tsx`            | purchase (via PurchaseTracker)                        |

### GA4 Events Implemented

1. `view_item_list` — product/category listing pages
2. `select_item` — clicking a product card
3. `view_item` — product detail page
4. `add_to_cart` — add to cart button
5. `view_cart` — cart drawer + cart page
6. `begin_checkout` — checkout page load
7. `add_shipping_info` — shipping step completed
8. `add_payment_info` — payment step reached
9. `purchase` — order confirmation page

## 4. Quality Review Fixes

Issues found by code review and fixed:

1. **XSS via GTM ID** — Added regex validation (`/^GTM-[A-Z0-9]{1,10}$/`)
2. **Duplicate view_item_list** — Added `useRef` to prevent re-firing on filter/sort/page changes
3. **Inconsistent select_item naming** — Fixed list name to match view_item_list
4. **Analytics resilience** — Added try/catch to pushDataLayer for ad blocker tolerance

### Review items noted but deferred:

- `add_payment_info` fires when step is reached, not when card details entered (acceptable for current scope)
- Hardcoded `"USD"` currency (extract to config when multi-currency needed)
- `view_cart` fires on every drawer open (acceptable — GA4 counts page views similarly)

## 5. Future Improvements

1. **Multi-currency support** — Extract hardcoded `"USD"` to `NEXT_PUBLIC_CURRENCY` env var when i18n is needed
2. **Enhanced e-commerce events** — Add `remove_from_cart`, `view_promotion`, `select_promotion` events
3. **Server-side tracking** — Implement GA4 Measurement Protocol for server-side purchase validation
4. **A/B testing integration** — Use GTM to inject A/B testing scripts (Optimizely, VWO)
5. **Analytics dashboard** — Build admin panel page showing conversion funnel from GTM data

## 6. Verification

- TypeScript typecheck: **PASS** (0 errors)
- ESLint: **PASS** (0 errors, 32 pre-existing warnings)
