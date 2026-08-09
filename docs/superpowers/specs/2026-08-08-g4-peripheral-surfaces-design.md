# G4 — Peripheral Surfaces Sweep — Design

**Date**: 2026-08-08
**Status**: Approved (brainstorm 2026-08-08; user approved all sections)
**Group**: WEEKLY 2026-08-03 G4 ("Peripheral Surfaces Sweep [batch]", 5 SP → **~8–9 SP under the audit-definitive scope**, same in-task-growth pattern as G2)
**Reference**: none — no design handoff exists for any G4 surface; "Mirox alignment" is **derived** from shipped siblings (cart/checkout/PDP), not matched to a mockup
**Audit input**: `docs/planning/audits/2026-08-04-storefront-staleness-audit.md` (§"G4 definitive scope")

---

## 1. Scope

The WEEKLY checkboxes list 3 items (auth, account, newsletter+error). The G1 staleness audit
defined a broader "G4 definitive scope". **Ruled: design to the audit boundary, plus the one
surface the audit could only exclude because it 500'd at the time** (G3 fixed it 2026-08-08).

In scope:

| Surface                                              | Files                                                                                     | Note                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Auth: login, register, auth error boundary           | `src/app/(auth)/login/login-form.tsx`, `register/register-form.tsx`, `error.tsx`          | includes `LoginFormSkeleton` (duplicates title/description) and Zod field messages (§4.1)    |
| Account: layout, overview, orders list, order detail | `src/app/(shop)/account/**`                                                               | `orders/[id]` newly unblocked by G3 (410 lines); dead links removed (§3)                     |
| Newsletter pages + signup toast                      | `src/app/newsletter/confirm`, `unsubscribe`, `src/components/common/NewsletterSignup.tsx` | server-copy problem solved by coded responses (§2.3)                                         |
| System: 404, root error boundary, cookie banner      | `src/app/not-found.tsx`, `src/app/error.tsx`, `src/components/common/CookieConsent.tsx`   | banner shows English on every route incl. the ✅ ones                                        |
| Categories chrome                                    | `src/app/(shop)/categories/page.tsx`, `[slug]/category-client.tsx`                        | 🟠 rows in the audit; H1/subtitle/counts/sort/filters/empty states                           |
| Header residuals                                     | `src/components/common/Header.tsx`                                                        | «Увійти», «Меню», search dialog, sr-only labels, mobile «Категорії» link, signed-in dropdown |
| Newsletter API response codes                        | `src/app/api/newsletter/{subscribe,confirm,unsubscribe}/route.ts`, `src/lib/api-utils.ts` | enables client-side Ukrainian (§2.3)                                                         |

Explicitly **out of scope**: admin surfaces (standing exclusion), showcase routes, building
`/account/addresses` + `/account/settings` (links removed instead, §3), products↔categories
sort-set **unification** (behavior change → BACKLOG, §8), transactional emails (G5).

## 2. Ruled decisions

All user-confirmed during the 2026-08-08 brainstorm:

| #   | Decision            | Ruling                                                                                                                                                                                                |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Scope boundary      | **Audit-definitive + G3 unblock** (not WEEKLY-literal): categories chrome, CookieConsent, Header residuals, `orders/[id]`, newsletter API strings all in                                              |
| 2   | Restyle depth       | **Derived alignment**: UA copy + align to shipped design language (button weights, uppercase primary CTAs, card/border treatment, spacing, empty-state pattern). No re-layout, no new page structures |
| 3   | Dead account links  | **Remove** Addresses/Settings from sidebar nav + overview quick-links (Footer precedent: omit + code comment naming the owning task); BACKLOG entry to restore when built                             |
| 4   | Newsletter API copy | **Coded outcomes, client copy**: API responses gain machine `code`s; pages map code → UA via content layer (G2 `create-order` pattern). API prose stays English (logs/consumers)                      |
| 5   | Visual sign-off     | **Consistency gate vs shipped siblings**: screenshot every surface/state, present beside an approved sibling; user judges consistency (no mockup exists to judge fidelity)                            |
| 6   | Structure           | **Domain content modules + shared `StatusScreen`**: 4 new content modules mirroring the per-domain split; one shared component for the 5 near-identical status screens                                |

## 3. Architecture

### 3.1 Content layer (4 new modules + 1 extension)

Plain typed literals, extraction-ready for TASK-039 (established `src/content/` pattern):

| Module                      | Owns                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `src/content/auth.ts`       | login, register, auth error boundary copy                                                     |
| `src/content/account.ts`    | sidebar nav, overview, orders list/detail, **order status labels**, **payment status labels** |
| `src/content/newsletter.ts` | confirm + unsubscribe screens, signup toast, and the `code → copy` map                        |
| `src/content/system.ts`     | 404, root error boundary, cookie consent banner                                               |
| `src/content/site.ts`       | _(extend)_ new `header` key for Header residuals                                              |

`ORDER_STATUS_LABELS` moves from `src/lib/order-status.ts` into `content/account.ts`;
`order-status.ts` keeps `getOrderStatusStyle`/`getOrderStatusLabel` and imports the map
(lib→content import direction already exists: `seo.ts` ← `content/brand`). Admin is unaffected —
it imports only the style map (verified: both admin orders pages import `getOrderStatusStyle`
only).

**Categories chrome is the deliberate exception**: its strings go **inline in the components**,
matching how the whole catalog domain shipped (TASK-036/037 put UA `SORT_OPTIONS` and PDP copy
inline). TASK-039 sweeps the domain together; forcing the newer convention on half a domain
creates asymmetry.

### 3.2 `StatusScreen` (new shared component)

`src/components/common/StatusScreen.tsx` — the five hand-rolled "centered icon + heading +
muted paragraph + button(s)" screens (`newsletter/confirm`, `newsletter/unsubscribe`,
`not-found.tsx`, root `error.tsx`, `(auth)/error.tsx`) render through it, so the Mirox
treatment is written once and verified once.

- Props: `icon` (LucideIcon), `tone` (`"neutral" | "success" | "error"` → token mapping, e.g.
  error → `text-destructive`), `title`, `description?`, `meta?` (the `Error ID: {digest}` line),
  `actions` (array).
- **No `"use client"` directive** — server-usable so `not-found.tsx` keeps server rendering.
  `actions` is a discriminated union: `{ label, href, variant? }` | `{ label, onClick, variant? }`.
  Server callers may only pass `href` actions (functions can't cross the server→client
  boundary); client callers may pass either. The type encodes this; the constraint is documented
  on the prop.
- Purely presentational: no hooks, no state, no data fetching.

### 3.3 Coded newsletter API

- `apiError(message, status)` in `src/lib/api-utils.ts` gains an **optional third param**
  `code?: string` → response body `{ error, code }` when given, `{ error }` unchanged when
  omitted (additive; zero call-site churn elsewhere).
- The three newsletter routes attach codes to **every** outcome, including 200s (via the
  existing `apiSuccess` payloads): `CONFIRMED`, `ALREADY_CONFIRMED`, `LINK_EXPIRED`,
  `INVALID_TOKEN`, `TOKEN_REQUIRED`, `SUBSCRIBER_NOT_FOUND`, `INVALID_UNSUBSCRIBE_LINK`,
  `UNSUBSCRIBED`, `ALREADY_UNSUBSCRIBED`, `CONFIRMATION_PENDING`, plus generic
  `CONFIRM_FAILED`/`UNSUBSCRIBE_FAILED`/`SUBSCRIBE_FAILED` on 500s. (Exact final set fixed at
  implementation; every branch in the three routes must carry one.)
- English prose stays in the API as log/consumer text — the exact convention G2's
  `create-order` documents in a code comment. Clients map `code` → Ukrainian via
  `content/newsletter.ts`, with a generic UA fallback for unknown/absent codes.

## 4. Surface-by-surface treatment

"Align" everywhere below = decision #2: same tokens/weights/CTA treatment as shipped siblings;
structure unchanged.

### 4.1 Auth

- Full UA copy via `content/auth.ts`: «Вхід» / «Реєстрація» titles, field labels, placeholders,
  loading states («Вхід…» / «Створення акаунта…»), error prose, cross-links («Немає акаунта?…» /
  «Вже є акаунт?…»). `LoginFormSkeleton` sources the same strings.
- **Zod field messages → Ukrainian in `src/lib/validations/index.ts`** (`loginSchema`,
  `registerSchema` only) — the exact G2 precedent (`shippingAddressSchema` messages are already
  UA in the same file). Side effect: the register API's validation errors turn UA — correct,
  customer-facing endpoint. Admin schemas untouched.
- Align: card border/radius per cart's summary card, uppercase primary CTA (per «ОФОРМИТИ
  ЗАМОВЛЕННЯ»), link hover per checkout.
- `(auth)/error.tsx` → `StatusScreen` (tone `error`; actions: retry `onClick` + «До входу» `href`).

### 4.2 Account

- **Layout**: «Мій акаунт»; nav shrinks to **Огляд + Замовлення**. Addresses/Settings entries
  removed with a code comment naming the BACKLOG restore entry (Footer precedent).
- **Overview**: welcome «З поверненням, {name}!» with fallback «Клієнт» (replaces "Customer");
  description UA; the two dead quick-link cards removed — **Orders card remains** in the same
  grid; «Дані акаунта» card (Ім'я / Email / «Не вказано»).
- **Orders list**: «Історія замовлень», status filter («Всі замовлення» + statuses from the
  shared labels), empty state, card labels («Дата замовлення», «Сума», «№ замовлення»,
  «Деталі», «К-сть: N», and «+N інших товарів» pluralized via `pluralizeUk`), pagination
  («Назад» / «Сторінка N з N» / «Далі»).
- **Order detail** (`[id]`, G3-unblocked): full sweep — headings, address/method/summary
  blocks, item lines. Must preserve the `useParams<{ id: string }>()!` pattern
  (`dynamic-route-params.test.tsx` guards it).
- **Order status labels** (canonical set, in `content/account.ts`): PENDING «Очікує
  підтвердження», CONFIRMED «Підтверджено», PROCESSING «Обробляється», SHIPPED «Відправлено»,
  DELIVERED «Доставлено», CANCELLED «Скасовано», REFUNDED «Повернуто».
- **Two audit-missed leaks (found in this brainstorm, in scope)**: both account pages format
  dates with `toLocaleDateString("en-US")` → `"uk-UA"`; order detail renders the **raw
  `paymentStatus` enum** in a badge (`page.tsx:383`) → customer label map in
  `content/account.ts` covering all five enum values: PAID «Оплачено», PENDING «Очікує
  оплати», FAILED «Не вдалася», REFUNDED «Повернуто», PARTIALLY_REFUNDED «Частково повернуто».

### 4.3 Newsletter

- Both pages → `StatusScreen`; copy from `content/newsletter.ts` keyed by API `code`; unknown
  code → generic UA fallback. Buttons «Продовжити покупки» (success) / «На головну» (error).
  All existing states preserved: confirm loading/success/error-by-code + missing-token;
  unsubscribe idle-prompt (with email interpolation)/loading/success/error/invalid-link.
- `NewsletterSignup` stops surfacing `data.error` (English) in its toast; maps `data.code`
  through the same module (fixes the sixth EN leak on ✅ pages).

### 4.4 System

- `not-found.tsx` → `StatusScreen` («404», «Сторінку не знайдено», «Повернутися на головну»);
  keeps `export const dynamic = "force-dynamic"` and server rendering.
- Root `error.tsx` → `StatusScreen` (tone `error`, «Щось пішло не так», digest via `meta`,
  «Спробувати ще раз» `onClick` + «На головну»).
- `CookieConsent`: banner text UA, «Відхилити» / «Прийняти». Zustand/GTM logic untouched.

### 4.5 Categories

- `/categories`: «Категорії», subtitle, per-card counts via `pluralizeUk`, empty state,
  «+N more» chip.
- `/categories/[slug]` (`category-client.tsx`, full-file sweep): breadcrumbs «Головна» /
  «Категорії», counts, filters sheet («Фільтри», «Ціна»…), «Товарів не знайдено», «Категорію
  не знайдено».
- **Sort dropdown translated in place** (6 options: «Новинки», «Найстаріші», «Ціна: за
  зростанням», «Ціна: за спаданням», «Назва: А–Я», «Назва: Я–А») — **not** unified with
  `/products`' 4-option set; unification changes URL params + fetch logic (behavior, not copy)
  → BACKLOG.
- Strings inline (§3.1 exception).

### 4.6 Header residuals

`site.ts` gains `header`: «Увійти», «Меню», search dialog title + placeholder «Пошук
товарів…», sr-only labels («Пошук (Ctrl+K)», «Кошик», «Відкрити меню»), mobile «Категорії»
link. The signed-in dropdown items are swept in implementation (not audited — audit ran mostly
signed out). `Header.tsx` consumes.

## 5. Testing

Updated:

| File                                 | Change                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `content.test.ts`                    | shape assertions for the 4 new modules + `site.header`                             |
| `order-status.test.ts`               | label expectations → UA; imports unchanged (accessors stay in `order-status.ts`)   |
| `newsletter-api.test.ts`             | every outcome asserts its `code` alongside the still-English `error`/`message`     |
| `api-utils.test.ts`                  | `apiError` with/without `code`; omitted code → **no** `code` key (backward compat) |
| `header.test.tsx`, `footer.test.tsx` | UA assertions where they grip changed copy                                         |
| `dynamic-route-params.test.tsx`      | no change expected — guards the `[id]` pattern the restyle must preserve           |

New (TDD, red first):

- `status-screen.test.tsx` — title/description/meta rendering; tone→token mapping; `href`
  actions render links, `onClick` actions render buttons.
- `newsletter-status-pages.test.tsx` — mocked-fetch RTL states: confirm (success code,
  `ALREADY_CONFIRMED`, `LINK_EXPIRED`, unknown code → fallback, missing token); unsubscribe
  (idle→confirm flow, success, invalid link).

Guards: `no-bright-colors.test.ts` needs **zero** edits — every touched path is already in
`SCAN_PATHS`, so `StatusScreen` and the new content modules are scanned automatically.

E2E: `home.spec.ts` cookie-button names ×2 → «Відхилити»/«Прийняти»; `navigation.spec.ts`
mobile «Категорії» link ×3; implementation sweeps all five specs for any other gripped string.
No new e2e specs — the auth/login E2E helper stays the existing G3 BACKLOG item.

Expected unit growth: ~15–25 tests from 636.

## 6. Verification (consistency gate) & pre-PR checks

- Playwright capture script in the session scratchpad (G1-audit style, not committed), at
  1440×900 + 390×844, of every surface/state: login, register, `/account`, orders list, order
  detail (seeded id), both category pages, newsletter confirm ×3 (minted tokens: PENDING
  subscriber with known token; expired via backdated expiry), unsubscribe ×3 (HMAC via
  `newsletter.ts` helpers), 404, both error boundaries (temporary forced throw, removed before
  commit), cookie banner.
- Auth: the audit's workaround — `NEXTAUTH_URL` matched to the dev port + `AUTH_TRUST_HOST=true`,
  shell-only, no `.env` edits.
- **Side-by-side sheet**: each surface beside an approved shipped sibling (login ↔ checkout
  card, account ↔ cart, StatusScreen ↔ confirmation page). **User sign-off on the sheet is the
  gate** — judged for consistency with shipped work, not fidelity to a nonexistent mockup.
- Pre-PR: `typecheck`, `lint`, `format:check`, `test:run`, local prod `build`, local runs of
  the two touched e2e specs.

## 7. Documentation & completion

- Root `CLAUDE.md`: content tree +4 modules, order-status label move, newsletter coded
  responses. `src/app/CLAUDE.md` + `src/components/CLAUDE.md`: StatusScreen, page conversions,
  CookieConsent UA. Propagation check per the completion workflow; docs-freshness manual
  README-index ↔ header check per the standing rule.
- WEEKLY G4 check-off at completion: Summary Table + Daily Schedule → `✅ PR #N`.

## 8. BACKLOG spawns (🟤, group `[2026-08-08] From: G4 brainstorm`)

1. Restore account Addresses/Settings nav links when those pages get built — pairs with the
   existing TASK-056 content-gap row (links removed by decision #3).
2. Products↔categories sort-set unification (shared options + `getSalesRanking()` on category
   pages) — behavior change deliberately deferred out of a copy/alignment task.
3. `AUTH_TRUST_HOST` local-dev documentation note (audit's environment note) — **only if** G1's
   completion didn't already file it (checked in-task before writing).

## 9. Risks

- **String-gripped tests beyond the mapped list** — mitigated by running the full unit + e2e
  sweep locally before PR, not just the named files.
- **`StatusScreen` server/client duality** — the discriminated-union action type prevents
  passing functions from server callers; `not-found.tsx` is the canary (build fails loudly if
  violated).
- **Label-map move ripples into admin** — verified it doesn't (admin imports styles only), and
  `order-status.test.ts` keeps guarding the accessors.
- **Hydration** on converted client pages — no new mount-gated state is introduced;
  CookieConsent's existing `mounted` gate is untouched.
- **TASK-039 scope grows** by the four new content modules — the designed trade, per WEEKLY's
  "TASK-039 interaction" note.

---

## Superseded notes (post-merge, 2026-08-09 — PR #31 `eb630f4`)

Frozen-spec corrections; the implementation record is the plan's Progress log and DONE.md.

1. **§5 "`dynamic-route-params.test.tsx` — no change expected" was falsified in execution**
   (plan Task 10): the test's `/account/orders/[id]` case asserts the page's not-found string,
   which the conversion changed — one assertion updated to «Замовлення не знайдено» (the three
   admin assertions stay English). The `useParams` pattern the row was really about is intact.
2. **§3.2/§9's `not-found.tsx` "canary" claim was overstated**: the `StatusAction` union permits
   `onClick` members from any caller — only the doc comment constrains server callers to `href`
   actions — and `not-found.tsx` is `force-dynamic`, so a violation would surface as a runtime
   error on request, not a loud build failure. Shipped code is correct; do not lean on that
   canary when editing StatusScreen consumers (final-review minor #5 on PR #31).
3. **§8 spawn 3 (`AUTH_TRUST_HOST` docs note) was correctly skipped as already filed** — and the
   visual gate added a nuance (scripted `signIn()` still MissingCSRF's under the documented
   workaround), recorded as a `[possible-dup-of]` extension in BACKLOG `[2026-08-09] From: G4
execution`.
