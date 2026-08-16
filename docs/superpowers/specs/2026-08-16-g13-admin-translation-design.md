# G13 — Admin Translation & Alignment: Design Spec

**Date**: 2026-08-16
**Status**: Approved (user, 2026-08-16) — pending implementation plan
**Branch**: `feat/g13-admin-translation` (from `main` @ `8e12a66`)
**Source**: WEEKLY.md G13 (🔵 User, 8 SP, Fri→weekend spill accepted) — user steer 2026-08-11: "we have not finished with translations of pages (Admin pages)"
**Program context**: `2026-07-14-mirox-shop-program-design.md` (Mirox rebrand + Ukraine launch); builds on G9 / TASK-039 (PR #37) which shipped next-intl cookie-mode i18n and formally reserved the `admin.*` namespace for this task.

## Problem

The admin panel is 100% hardcoded English (~555 source literals across 18 files; zero
next-intl imports), status badges render raw enum values (`PARTIALLY_REFUNDED`), and
three Mirox alignment residuals are scheduled into this group (bright
`PAYMENT_STATUS_COLORS` chips ×2 pages, missing `supplier-order-status` module, settings
"$" labels). Additionally discovered during design (premise corrected 2026-08-16 after
reading the hook): `src/hooks/use-toast.ts` is not the shadcn store hook but a 22-line
wrapper delegating to the mounted sonner toaster — its toasts do display. However it
recreates `toast` on every render (plain function in the hook body, no memoization),
and that unstable reference causes the BACKLOG'd infinite re-fetch loop on the
Customers and Categories pages (confirmed live 2026-08-16; exactly those two dependency
arrays). Also in scope: 6 admin files format dates with `toLocaleDateString("en-US")` —
user-visible English that switches to `"uk-UA"` with the sweep.

## Decision log (user, 2026-08-16)

1. **UA-only** — `admin.*` goes into `uk.json` only; RU-toggled admins see UA via the
   deep-merge fallback. No RU draft growth ahead of TASK-056 sign-off.
2. **Loop bug in scope** — superseded by decision 5 (class fix, not instance fix).
3. **Client-only translation** — server-originated text (API-echoed `data.message`,
   admin-exclusive Zod schemas in `src/lib/validations/index.ts`) stays English;
   a 🟤 BACKLOG entry records admin API i18n (coded outcomes) as follow-up.
4. **Split provider** — storefront client payload must not grow; see §2.
5. **Toast unification on sonner** — migrate the 3 `use-toast` files, delete the dead
   hook; loop bug fixed by construction.

## Design

### 1. Catalog (`messages/uk.json`)

One `admin.*` namespace (~380–420 keys), sub-namespaced per UI domain:

`admin.layout` (header) · `admin.nav` (sidebar + "Back to Store") · `admin.common`
(Save/Cancel/Delete/Edit/Loading/empty states/"Try adjusting…" — extract first, it
deduplicates the most) · `admin.dashboard` · `admin.products` · `admin.productForm`
(incl. its local Zod messages) · `admin.productImport` · `admin.imageUploader` ·
`admin.categories` · `admin.customers` · `admin.orders` (list + detail, incl.
`STATUS_OPTIONS` + `ORDER_TIMELINE` labels) · `admin.reviews` · `admin.newsletter` ·
`admin.suppliers` (list + detail) · `admin.settings` · `admin.supplierOrderStatus`
(7 lowercase keys: pending/submitted/confirmed/shipped/delivered/cancelled/failed).

- **No status-label duplication**: admin order/payment badges read the existing
  `account.orderStatus` / `account.paymentStatus` keys (single source; per the standing
  ruling "sourcing status labels from the catalog").
- Count strings ("N image(s) uploaded", "N product(s) imported") become ICU plurals
  with all four branches (one/few/many/other) per catalog convention.
- Ternary toast strings (e.g. "Review is now visible" / "Review hidden") get two keys.
- Keys camelCase; namespaces mirror UI domains (catalog conventions unchanged).
- `messages/README.md` updated: `admin.*` populated, **UA-only by decision** (RU
  deliberately absent), provider-split note.
- `ru.json` untouched.

### 2. Provider split (client payload)

The root layout's zero-prop `NextIntlClientProvider` serializes the whole catalog into
every page's HTML; adding `admin.*` would nearly double that embed on storefront pages
for strings only admins use (program has a PageSpeed-95+ budget).

- `src/app/layout.tsx`: `const messages = await getMessages()`; strip `admin`;
  pass the rest via the `messages` prop. Storefront pages carry exactly the same
  message keys as today.
- `src/app/(admin)/layout.tsx`: nested `NextIntlClientProvider` with the **full**
  catalog (admin client components need `account.*` status keys too; the inner
  provider replaces the outer context, so it must be complete).
- Server components (`getTranslations`) read the server request config — unaffected.

### 3. Component sweep

- 15 client files → `useTranslations(namespace)`; 3 server files (`(admin)/layout.tsx`,
  `admin/page.tsx` dashboard, `admin/products/new/page.tsx`) → `await getTranslations`.
- Biggest-first order: suppliers list (72) → categories (57) → ProductForm (53) →
  reviews (50) → settings (48) → orders/[id] (46) → suppliers/[id] (42) → remaining.
- Server-echoed `toast.success(data.message)` / `err.message` passthroughs stay as-is;
  every client-side fallback literal is translated.
- ProductForm's three «грн» input adornments stay literal (currency symbol, not copy)
  but get the BACKLOG'd `pl-7` crowding fix (Cyrillic «грн» wider than "$") in passing.
- Dashboard revenue already uses `formatPrice()` — no currency work.
- The 6 `toLocaleDateString("en-US", …)` call sites in admin (customers, newsletter,
  orders list + detail, reviews, suppliers detail) switch to `"uk-UA"`.

### 4. Alignment residuals (Mirox monochrome policy)

- **Payment chips**: delete the two verbatim-duplicated bright `PAYMENT_STATUS_COLORS`
  maps (`admin/orders/page.tsx`, `admin/orders/[id]/page.tsx`); extend
  `src/lib/order-status.ts` with monochrome `PAYMENT_STATUS_STYLES` +
  `getPaymentStatusStyle()` mirroring the existing `ORDER_STATUS_STYLES` pattern.
  Badges render catalog labels (`account.paymentStatus`) instead of raw enums.
- **Supplier statuses**: new `src/lib/supplier-order-status.ts` — monochrome style
  lookup for the lowercase vocabulary. `SupplierOrder.status` is a plain Prisma
  `String` (convention-only, written by `supplier.service.ts`), so label resolution
  uses a `t.has` guard over `admin.supplierOrderStatus` and falls back to the raw
  value for unknown statuses. Replaces the local `STATUS_COLORS` map in
  `suppliers/[id]/page.tsx`.
- **Settings**: the three "Free/Standard/Express Shipping ($)" labels become «(грн)»
  via their catalog keys (note: 3 labels, not the 2 the WEEKLY entry estimated).
- **Doc propagation in the same PR** (not deferred to close-out): the
  `order-status.ts` docstring ("admin renders raw enum values until G13") and the
  root `CLAUDE.md` claims about the EN/raw-enum admin gap become false with this
  change and are corrected in the PR.

### 5. Toast unification

- categories/customers/settings migrate to the direct sonner API used by the other
  10 admin files. Behavior-preserving mapping (matches what the wrapper did):
  `toast({ title, description, variant: "destructive" })` → `toast.error(title, { description })`;
  any other `toast({ title, description })` → `toast.success(title, { description })`.
- Delete `src/hooks/use-toast.ts` (after migration nothing imports it; it was only
  an unstable-identity indirection over sonner). Correct the root `CLAUDE.md` hooks
  line that names it.
- The Customers/Categories infinite loop dies by construction: no hook, no unstable
  dependency. Their fetch callbacks keep only stable deps
  (pagination/search/filter state).

### 6. Testing & verification

Existing gates: `typecheck`, `lint`, `format:check`, `test:run`, `next build`.

New tests:

- **Loop regression**: render the customers page with mocked fetch; assert it settles
  at exactly one list fetch (red on the old `toast`-dep code, green after migration).
- **Style/label lookups**: unit tests for `getPaymentStatusStyle()` and the
  supplier-order-status module (incl. unknown-status fallback).
- **Catalog smoke**: `renderWithIntl` test asserting a representative admin component
  (AdminSidebar) renders real `uk.json` strings (e.g. «Замовлення»).

Manual verification:

- Click-through of all 13 admin routes (dashboard; products list/new/[id]; categories;
  orders list/[id]; customers; suppliers list/[id]; reviews; newsletter; settings —
  seeded DB, admin login), screenshots via one
  Artifact page; includes RU-toggle spot-check (must show UA everywhere in admin).
- Storefront payload check: rendered storefront HTML contains no `admin.*` string.
- English-remnant grep over `src/app/(admin)/` + `src/components/admin/` post-sweep.

`scripts/i18n-byte-diff.mjs` deliberately does not gate this task: it guards removed
Cyrillic literals during relocation; G13 authors new UA copy from English sources. The
miss-risk here is untranslated remnants, covered by the grep + click-through above.

### 7. Out of scope (recorded)

- Admin API i18n (coded outcomes + `byCode` maps for admin routes) → new 🟤 BACKLOG
  entry at close-out. Includes the admin-exclusive Zod schemas' messages.
- RU translation of `admin.*` — deliberately absent (decision 1), noted in
  `messages/README.md`; no BACKLOG entry (fallback behavior is the design).
- `dark:` dead-variant cleanup, `next-themes` removal — untouched (existing BACKLOG).

## Delivery

Single PR from `feat/g13-admin-translation`. Implementation plan:
`docs/planning/plans/2026-08-16_g13-admin-translation.md` (per CLAUDE.md convention).
Estimated diff: ~20 component files, ~400 catalog lines, 1 extended + 1 new lib module,
2 layout files, 1 deleted hook, tests.
