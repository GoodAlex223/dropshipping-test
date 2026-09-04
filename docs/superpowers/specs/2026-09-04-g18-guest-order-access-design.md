# G18 — Guest Order Access & Hardening: Design Spec

**Date**: 2026-09-04
**Status**: Approved 2026-09-04 (brainstormed section-by-section, then the written spec reviewed and approved by the user the same day); implementation plan follows.
**Branch**: `feat/g18-guest-order-access` (from `main` @ `eef2e4e`)
**Source**: WEEKLY.md G18 (🔵 User, 2 members, 7 SP, 🏆 Weekly Challenge) — guest order tracking (🔵 [2026-08-07] G2 post-gate, "recommended before real launch") + the G2 confirmation-page ownership check (🟤 rider [2026-08-06], pinned "before real customer traffic"; independently confirmed 3/3 by the G17 panel as a MEDIUM finding, 2026-09-02)
**Program context**: `2026-07-14-mirox-shop-program-design.md` (Mirox rebrand + Ukraine launch). Closes the last pre-launch privacy item on the checkout surface. Does not depend on any TASK-056 client item, but note the email constraint in Problem §3.

## Problem

### 1. The confirmation page discloses full order PII to anyone holding an order number

`src/app/(shop)/checkout/confirmation/page.tsx` runs `prisma.order.findUnique({ where: { orderNumber } })` straight from the `?order=` query string and renders name, e-mail, delivery address, items and totals. The session is fetched, but only decides whether the «Історія замовлень» link renders — no authorization decision is made on the record. Order numbers are bearer capabilities that land in browser history, referrer headers and e-mails, and never rotate. `generateOrderNumber()` is `ORD-<ms timestamp, base36>-<4 chars from Math.random()>`: blind enumeration is impractical, but a leaked number is a permanent key.

### 2. A guest has no way to see an order after the confirmation page

Guest COD orders carry `userId: null`. They are invisible in `/account/orders`, the confirmation e-mail's account CTA is hidden for guests (G5 ruling), and no lookup surface exists anywhere in `src/`. After closing the tab, a guest customer has nothing but the e-mail — which, per §3, real customers do not currently receive.

### 3. Verification cannot depend on e-mail delivery

Production `EMAIL_FROM` is still `onboarding@resend.dev`, which delivers only to the Resend owner's inbox until TASK-056's domain item lands. A magic-link or OTP-by-e-mail design would therefore not work for a single real customer at launch. Verification has to be **knowledge-based**: the order number plus the e-mail the customer typed at checkout.

### 4. No throttle exists, and production has no Redis

A repository-wide search finds no rate-limiting implementation in `src/`. `/api/health` in production reports no Redis check, so `REDIS_URL` is unset there — a Redis-backed limiter is not available today. The G17 scan filed the general per-IP throttle as its own 🟤 entry; it needs a platform decision (Upstash via the Vercel Marketplace, or Vercel WAF rate-limit rules) that this group does not make.

### 5. Constraints carried in from WEEKLY

- Never look up by phone (or e-mail) alone — order-enumeration risk. Always the order-number + factor pair.
- The post-checkout redirect must still show the just-created order with no user action (one-time grant), while cold visits require verification.
- The existing guest COD E2E (`tests/e2e/checkout.spec.ts`) asserts the confirmation page after the redirect and must keep passing unchanged.
- The RU parity test (`tests/unit/i18n-catalogs.test.ts`) is hard: every new `uk.json` key needs an `ru.json` counterpart.

## Decisions

Rulings taken with the user during the 2026-09-04 brainstorm, in order:

1. **Throttling scope: per-order lockout only.** Two columns on `Order` (failed-attempt count + locked-until). Five wrong e-mails against one order number lock it for 15 minutes; success resets. This covers the realistic attack — guessing the e-mail for a leaked order number. Per-IP limits stay on the G17 🟤 entry.
2. **Verified guests land on a dedicated status page** (`/track/[orderNumber]`), not on the confirmation page. `PurchaseTracker` dedupes only within one render (a `useRef`), so reusing the confirmation page would fire a GA4 `purchase` on every tracking visit, and it would say «Замовлення прийнято!» forever with no status or tracking number.
3. **No claim-by-e-mail at registration.** `POST /api/auth/register` performs no e-mail verification and no verification flow exists anywhere in `src/`, so auto-linking `userId: null` orders by e-mail match would let anyone register with a stranger's address and read their order history and delivery address. Deferred behind an e-mail-verification flow (BACKLOG rider, see Out of scope).
4. **Grant mechanism: a signed per-order httpOnly cookie** (over a DB access token in the URL, which re-creates the bearer-URL leak class, and over a server-side guest-session table, which adds a table, cleanup and a read per render for a threat that does not warrant it at launch scale).
5. **Grant TTL 24 hours** (user accepted the proposed value; a knob, not a principle).
6. **Header untouched.** The entry points are the footer and the confirmation e-mail; header chrome stays stable per the 2026-08-20 pre-launch ruling.

## Design

### §1 Authorization rule and the grant

One pure helper module, `src/lib/order-access.ts`, is the single place the rule lives; both pages call it.

**Rule** (evaluated in this order, first match wins):

1. A session whose `user.id` equals the order's `userId` → allowed.
2. A valid grant cookie for that exact order number → allowed.
3. Otherwise → not allowed. Pages `redirect("/track?order=<orderNumber>")`. No order data is emitted on this path. ADMIN gets no bypass (admins use `/admin/orders`).

**Pages are not existence oracles.** An absent order and a not-allowed visitor produce the same redirect; neither page answers 404 for a well-formed number. This matches the lookup route's uniform `ORDER_NOT_FOUND`.

**Grant cookie**

| Aspect     | Value                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Name       | `og_<orderNumber>` (e.g. `og_ORD-MF2K1X9Q-A7B3`)                                                                                          |
| Value      | `<expiry unix seconds>.<hex HMAC-SHA256>`                                                                                                 |
| HMAC input | `order-grant:<orderNumber>:<expiry>`, keyed with `NEXTAUTH_SECRET` (the key the unsubscribe token already uses — `src/lib/newsletter.ts`) |
| Verify     | parse both parts; reject if `expiry <= now`; recompute and compare with `crypto.timingSafeEqual` on equal-length buffers                  |
| Attributes | `httpOnly`, `sameSite: "lax"`, `path: "/"`, `maxAge: 24 * 60 * 60`, `secure: request.nextUrl.protocol === "https:"`                       |

The `secure` rule mirrors how NextAuth derives `useSecureCookies` from the URL protocol: a Vercel request gets a Secure cookie, CI's `http://localhost:3000` E2E (chromium + webkit) does not, so nothing breaks in CI or on WebKit, which does not treat `http://localhost` as a secure context for cookies.

**Order-number gate.** Before an order number is used in a cookie name, a query or a redirect, it must match `^ORD-[A-Z0-9]+-[A-Z0-9]{4}$` (upper-cased, trimmed). Anything else is treated as "no order" (confirmation page → its existing not-found screen; status page → `notFound()`; lookup route → `VALIDATION_ERROR`).

**Who sets it.** `POST /api/checkout/create-order` sets the grant on its 200 response (the post-checkout one-time grant — the browser stores the same-origin fetch response's cookie before `router.push` navigates, which the existing E2E already exercises end to end). `POST /api/orders/lookup` sets it after a verified pair. Routes set cookies on the `NextResponse` object (`response.cookies.set`), never through `next/headers`, so unit tests assert the `Set-Cookie` header without mocking. Pages read through `cookies()` from `next/headers` (synchronous on Next 14, per the G3 lesson).

One cookie per order: a guest with several orders accumulates several, each bounded by its own 24h expiry. A signed-in customer still receives the grant (harmless; their order also carries `userId`).

**Helper surface** (all pure except the cookie writer):

- `isValidOrderNumber(value: string): boolean`
- `createOrderGrant(orderNumber: string, now?: Date): string` — throws if `NEXTAUTH_SECRET` is unset. (Deliberately stricter than `generateUnsubscribeToken`, which falls back to a `"development-secret"` — a forgeable grant is worse than a 500. `src/lib/auth.ts` already refuses to boot without the secret, so production never reaches this path.)
- `verifyOrderGrant(orderNumber: string, cookieValue: string | undefined, now?: Date): boolean` — never throws; a missing secret reads as "no grant".
- `orderGrantCookieName(orderNumber: string): string`
- `setOrderGrantCookie(response: NextResponse, orderNumber: string, request: NextRequest): void`
- `canAccessOrder(order: { orderNumber: string; userId: string | null } | null, session: Session | null, cookieValue: string | undefined): boolean` — the rule above; a `null` order (no such number) is never allowed.

### §2 Lookup API — `POST /api/orders/lookup`

Public route, no auth guard. Coded outcomes per the project pattern (`code` beside EN prose; clients map `code` → catalog copy).

**Request** `{ orderNumber: string, email: string }`, Zod: `orderNumber` trimmed, upper-cased, must pass the order-number gate; `email` trimmed, lower-cased, `z.string().email()`. A malformed JSON body is a `400 VALIDATION_ERROR` (the G20 residue pattern), not a bare 500.

**Flow**

1. `prisma.order.findUnique({ where: { orderNumber }, select: { id, email, lookupFailedAttempts, lookupLockedUntil } })`.
2. Not found → `404 { error: "Order not found", code: "ORDER_NOT_FOUND" }`.
3. `lookupLockedUntil > now` → `429 { error: "Too many attempts", code: "TOO_MANY_ATTEMPTS", retryAfterSeconds }` with a `Retry-After` header.
4. Compare `order.email.trim().toLowerCase()` with the normalised input via `timingSafeEqual` (compare fixed-length SHA-256 digests of both so lengths never differ). Stored data is never mutated — `create-order` stores the e-mail as typed.
5. Mismatch → `update({ lookupFailedAttempts: { increment: 1 } })`; if the new count reaches **5** → set `lookupLockedUntil = now + 15 min` and reset the count to 0. Respond with the identical `404 ORDER_NOT_FOUND` as step 2 — nothing reveals which half failed.
6. Match → reset `lookupFailedAttempts = 0`, `lookupLockedUntil = null`, set the grant cookie, respond `200 { orderNumber }`. The client navigates to `/track/<orderNumber>`.
7. Any other error → `500 { error: "Lookup failed", code: "LOOKUP_FAILED" }`. No `console.error` (TASK-029 convention).

**Accepted disclosure.** A 429 reveals that the order number exists — but only to a caller who has already sent five wrong e-mails against it, and a customer who typo'd five times needs to be told to wait rather than shown a 404. Recorded as a deliberate trade.

### §3 Schema

Two additive columns on `Order`, one migration `add_order_lookup_lockout`:

```prisma
lookupFailedAttempts Int       @default(0)
lookupLockedUntil    DateTime?
```

No index (both are read by primary-key lookup only). Additive with defaults, so it is safe against the production rows that now include real orders; the Vercel Git-integration build applies it through the existing `scripts/vercel-build.sh` → `prisma migrate deploy` path. The Actions "Deploy to Vercel" job remains a no-op and is not relied on.

### §4 Pages and entry points

**`/checkout/confirmation?order=N`** (modified). Loads the order as today, then applies §1. Unauthorized **or absent** → `redirect("/track?order=N")` — the current `notFound()` for an unknown number goes away, since it was an existence oracle. A missing or gate-failing `order` param keeps the existing «Замовлення не знайдено» screen, which gains a link to `/track`. Everything else — copy, `PurchaseTracker`, the guest-aware account CTA — is unchanged. (A Server Component `redirect()` renders as 200 + meta refresh, per the G12 lesson; that is fine here because the page emits no order data on that path — the redirect is UX, the authorization rule is the boundary.)

**`/track`** (new, `src/app/(shop)/track/page.tsx` + `track-form.tsx`). Server page shell in the feedback page's shape (EN `metadata` like the feedback page — the UA-metadata sweep is its own BACKLOG item); a `"use client"` form modelled on `feedback-form.tsx`: order-number input (prefilled from `?order=` via `useSearchParams`, so it sits inside the page's `<Suspense>`), e-mail input, one submit. On `!response.ok` map `data.code` → `track.byCode.*` through the `t.has(key as never)` guard, falling back to `track.fallback`; on 200 `router.push` to `/track/<orderNumber>`. No honeypot (the route has its own lockout and creates nothing).

**`/track/[orderNumber]`** (new, `src/app/(shop)/track/[orderNumber]/page.tsx`, Server Component, `force-dynamic`). Gate the segment (`notFound()` only when it fails the order-number regex); `findUnique` with `items`; apply §1 — absent **or** not allowed → `redirect("/track?order=N")`, uniformly. Renders:

- «Замовлення №N» + creation date (`getFormatter` from `next-intl/server`) + a status `Badge` — label from `account.orderStatus.<status>` (existing keys, reused as the admin does), style from `getOrderStatusStyle`.
- Item lines in the confirmation page's format (name, `variantInfo`, `summary.qty × price`, line total) and the Товари / Доставка / До сплати totals.
- Delivery method through the same `shipping` catalog lookup with the `getShippingMethodLabel` legacy fallback; the address block; the COD payment line; `customerNotes` when present.
- Tracking number and `trackingUrl` (as an external link) when the admin has set them — the one thing a returning customer actually wants and the confirmation page cannot show.
- Two actions: «Продовжити покупки» → `/products`; «Перевірити інше замовлення» → `/track`.
- No `PurchaseTracker`, no session-dependent CTA.

**Entry points**

- Footer: `shopLinks` gains `{ key: "track", href: "/track" }` → `footer.links.track` = «Статус замовлення».
- Order-confirmation e-mail: a guest CTA «СТАТУС ЗАМОВЛЕННЯ» → `${NEXT_PUBLIC_APP_URL}/track?order=<N>`, rendered only when `hasAccount === false`; the signed-in «ІСТОРІЯ ЗАМОВЛЕНЬ» CTA is unchanged. New string `emails.order.guestCta` in `src/content/emails.ts` (UA content layer, not the catalog — e-mails are untouched by TASK-039 by design).
- Header: untouched (Decision 6).

**Routing and crawl.** No middleware change — both `/track` routes are public. `src/app/robots.ts` gains `/track/` in `disallow` (excludes the status pages; the `/track` form page stays crawlable because the trailing slash does not match it).

### §5 Catalog

New `track` namespace in **both** `messages/uk.json` and `messages/ru.json` (RU drafted with the same "pending client sign-off" status as the rest of the RU catalog; `messages/README.md`'s nuance list gains the new strings):

- `track.page.title` / `track.page.description`
- `track.form.orderNumberLabel` / `orderNumberPlaceholder` / `emailLabel` / `emailPlaceholder` / `submit` / `submitting`
- `track.byCode.ORDER_NOT_FOUND` / `TOO_MANY_ATTEMPTS` / `VALIDATION_ERROR`, `track.fallback`
- `track.status.heading` / `dateLabel` / `statusLabel` / `trackingLabel` / `trackingLink` / `checkAnother`
- `footer.links.track`
- `checkout.confirmation.trackLink` (the new link on the not-found screen)

Labels reused, not duplicated: `account.orderStatus.*`, `shipping.*`, `checkout.summary.qty`, `checkout.confirmation.{subtotalLabel,shippingLabel,totalLabel,addressHeading,methodHeading,notesHeading,paymentLabel,paymentCod,continueShopping}`. Reuse is by key reference from the status page, so a future copy change lands in one place.

### §6 Verification

**Unit (Vitest), new files**

- `tests/unit/order-access.test.ts` — `createOrderGrant`/`verifyOrderGrant`: valid; expired; tampered signature; wrong order number; missing secret (create throws, verify returns false). `canAccessOrder`: session owner; grant; neither; session for a different user + no grant; `null` order → false regardless of session or grant. `isValidOrderNumber`: accepts seeded/generated shapes, rejects lowercase, path-ish and empty input.
- `tests/unit/orders-lookup-api.test.ts` — 400 on schema failure and on malformed JSON; 404 unknown number; 404 wrong e-mail and `update` called with `increment`; fifth failure sets `lookupLockedUntil` ≈ now + 15 min and resets the counter; locked order → 429 with `Retry-After`; success resets both fields and the response carries `Set-Cookie: og_<N>=…; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` (no `Secure` on an http test request; `Secure` present on an https one); case/whitespace normalisation of both inputs.

**Unit, extended**

- `checkout-create-order-api.test.ts` — the 200 response carries the grant cookie for `json.orderNumber`.
- `email-templates.test.ts` — guest CTA present (and pointing at `/track?order=`) when `hasAccount: false`; absent when `true`; the account CTA assertions unchanged.
- `i18n-catalogs.test.ts` byCode block — `track.byCode` covers every code `src/app/api/orders/lookup/route.ts` emits (same discovery shape as the newsletter blocks).

**E2E (Playwright, `tests/e2e/checkout.spec.ts`)**

- The existing "guest can place a COD order end-to-end" test passes **unchanged** — it is the proof the post-checkout grant works.
- New: after the order, `context.clearCookies()`, revisit the confirmation URL → `waitForURL(/\/track\?order=ORD-/)` and the number is prefilled; submit a wrong e-mail → the `ORDER_NOT_FOUND` toast; submit `guest-e2e@example.com` → `waitForURL(/\/track\/ORD-/)`, the page shows the order number and «Очікує підтвердження».
- Standing rule: any string change sweeps every E2E locator type; the specs that do not run locally run in CI (chromium + webkit).

**Visual gate** — `/track` (empty, prefilled, error) and `/track/[orderNumber]`, desktop + mobile, delivered as one artifact URL per round per the standing screenshot rule; user sign-off before the PR.

**Gates** — `npm run typecheck`, `lint`, `format:check`, `test:run`, `scripts/i18n-byte-diff.mjs`, the docs-freshness test (spec indexed in `docs/README.md` at authoring time), `prisma migrate dev` locally then `prisma generate`.

**Post-deploy check (G19's smoke script may absorb it)** — verify the _rejection_, not just the render: on production, `POST /api/orders/lookup` with a real order number and a wrong e-mail must return 404; with the owner's own order + correct e-mail it must return 200 with a `Secure; HttpOnly` cookie; a cold `GET /checkout/confirmation?order=<real>` must land on `/track` without order data in the response body.

## Out of scope (recorded)

- **Claim-by-e-mail at registration** — deferred behind an e-mail-verification flow (Decision 3). BACKLOG rider to file at close-out: "link `userId: null` orders on registration **only after** the registering address is verified".
- **Per-IP / per-e-mail throttling** on `create-order`, `feedback`, `newsletter/subscribe` and this lookup — stays on the G17 🟤 entry; needs the Upstash-vs-WAF platform decision (production has no Redis).
- **CSPRNG order-number suffix** — stays on its volume trigger in the G2 hardening bundle; it lives in the dormant Stripe file (`stripe.ts` carve-out), and the pair check + lockout make number guessability far less valuable.
- **Phone as a verification factor** — checkout requires e-mail, the confirmation shows it, and phone formats vary; possible later extension of the same route.
- **Dormant `confirm-order` route** — gets no grant; unreferenced by the live checkout (its parity debt is already BACKLOG'd against TASK-048).
- **Header link** — Decision 6.
- **UA metadata** for the new pages — the existing BACKLOG'd sweep.

## Risks & open items

- **`Secure` on production must be verified after deploy**, not assumed: the protocol-derived rule is the right one, but `request.nextUrl.protocol` behind Vercel's proxy is what the post-deploy check above exists to confirm.
- **Cookie accumulation** is bounded by TTL only; a guest placing dozens of orders in a day would carry dozens of small cookies. Acceptable at launch scale; a single JSON-array cookie is the fallback if it ever matters.
- **The 5/15-min lockout is a customer-facing wall as well as a control** — the 429 copy must say how long to wait (`retryAfterSeconds` is surfaced for that).
- **Migration against real production data** — additive with defaults; verified by the migration running on the local DB first and by the Vercel build log after merge.
- Effort: booked at 7 SP (5 tracking + 2 ownership check). The ownership-check half is small once §1 exists; the tracking half carries the two new pages, the catalog work in two locales, the E2E extension and the visual gate. No revision proposed at spec time.
