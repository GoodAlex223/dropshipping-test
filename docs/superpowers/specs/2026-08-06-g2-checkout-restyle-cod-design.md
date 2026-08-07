# G2 — Checkout Restyle + No-Prepayment COD Flow — Design

**Date**: 2026-08-06
**Status**: Approved (brainstorm 2026-08-06; user approved all sections)
**Group**: WEEKLY 2026-08-03 G2 (originally "Checkout Restyle [batch]", 5 SP → **~8 SP after scope change**)
**Reference**: `docs/design/design_handoff_mirox/Mirox Checkout.dc.html`
**Audit input**: `docs/planning/audits/2026-08-04-storefront-staleness-audit.md` (§G2 definitive scope)

---

## 1. Scope change (client steer, 2026-08-06)

Mid-brainstorm the user relayed a new client request:

> "Don't set up payment processing on the site; we'll operate without prepayment for now. We'll
> collect cash on delivery at the post office. We can write 'We operate without prepayment,' and
> when a customer wants to purchase an item — 'If you wish to pay the full price of the item, a
> card will be displayed,' and next to that, 'For questions, please contact the manager directly'
> — with links to Instagram, WhatsApp and Telegram."

This **supersedes** the WEEKLY G2 framing "Stripe rails, step logic and order creation stay
untouched". Ruled decisions (all user-confirmed in the brainstorm):

| #   | Decision                 | Ruling                                                                                                                                                                        |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Form layout fidelity     | **Regroup per handoff**: step 1 = contacts only, step 2 = NP methods + city + branch/address                                                                                  |
| 2   | Omitted address fields   | **Ukraine-fixed slim form**: country hidden (`"UA"` always submitted), postalCode dropped from form + made optional in schema; company/line2/state stay in schema, unrendered |
| 3   | Payment step             | **COD folded into G2** (client steer): no Stripe in checkout; Stripe code stays dormant in repo                                                                               |
| 4   | Optional full prepayment | **Content-gated card block**: renders bank-card details from content config; contact-the-manager fallback while `null`                                                        |
| 5   | Guest checkout           | **Allowed**: `/checkout` removed from auth-required middleware; orders link to account when signed in                                                                         |
| 6   | API shape                | **New `POST /api/checkout/create-order`**; dormant Stripe routes untouched                                                                                                    |

Consequences recorded elsewhere (see §10): WEEKLY scope note, payments decision doc addendum
(affects TASK-048 framing), TASK-056 content-ask additions.

## 2. Checkout flow (3 steps, regrouped per handoff)

Route: `src/app/(shop)/checkout/page.tsx` (client component; 3-step state machine kept).
Shell styling per handoff: black page, `#0d0d0d` cards with `#1a1a1a` border and 20px radius,
white CTA buttons with letter-spaced uppercase labels, numbered-circle step nav (active = white
bg / black numeral, completed = white border, upcoming = `#333` border).

- **Step 1 «Контакти»**: Ім'я (single `shippingAddress.name` input — the handoff's separate
  Ім'я/Прізвище stay one field; schema has one `name`), Телефон (**required** — see §7),
  Email (required). CTA «ДАЛІ — ДОСТАВКА».
- **Step 2 «Доставка»**: NP shipping radios (§3), «Місто» (`shippingAddress.city`),
  «Відділення / адреса» (`shippingAddress.line1`, placeholder «Відділення №12»), «Коментар до
  замовлення (необов'язково)» (`customerNotes`, kept from the current app; the handoff omits it).
  CTAs «← НАЗАД» / «ДАЛІ — ОПЛАТА».
- **Step 3 «Оплата»** (handoff's label kept; no payment processing):
  - Pre-selected, non-interactive «Оплата при отриманні» block — «Без передоплати · готівкою
    або карткою у відділенні» framing + «Працюємо без передоплати» copy.
  - **Prepay card block (content-gated)**: while `checkout.prepay.cardNumber` is `null`, renders
    «Хочете оплатити повну вартість наперед? Напишіть менеджеру — надішлемо реквізити.»; once
    the client provides details, renders the card number + holder with a «Питання — менеджеру»
    line. No code change to light up — one content field.
  - Manager contact links: Instagram + Telegram (existing `site.ts` socials), WhatsApp
    content-gated (`null` until the client provides a number → link hidden).
  - CTA «ПІДТВЕРДИТИ ЗАМОВЛЕННЯ — N ГРН» → `POST /api/checkout/create-order` → on success
    `clearCart()` + redirect to `/checkout/confirmation?order=<orderNumber>`.
- Hidden submits: `shippingAddress.country: "UA"` (no visible field). `postalCode` not rendered.
- Per-step validation triggers follow the regrouping: step 1 validates `email`, `name`, `phone`;
  step 2 validates `city`, `line1`, `shippingMethod`.
- Empty-cart state: Ukrainian («Кошик порожній» + catalog CTA), styled per Mirox.

### Order Summary sidebar («Ваше замовлення»)

Sticky card: item rows with 56×64 thumbnails, product name, **variant line in the handoff format
«Чорний · L · 1 шт»** (from `CartItem.color`/`size`/`quantity` — closes the audit §G2 item-4 seam;
segments missing a value are omitted), row price via `formatPrice()`. Totals: Товари / Доставка /
До сплати. **Tax row removed** (always 0, absent from handoff; DB still stores `tax: 0`).
`np-office` is pre-selected as the form default, so the Доставка row shows a concrete price
from step 1 on — no "calculated later" placeholder needed in checkout.

## 3. Shipping methods — new `src/lib/shipping.ts`

New module owning delivery options (checkout page + create-order route consume it):

```ts
{ id: "np-office",   name: "Нова Пошта — відділення", description: "1-3 дні",            price: 80  }
{ id: "np-courier",  name: "Нова Пошта — кур'єр",     description: "1-3 дні, до дверей", price: 120 }
{ id: "np-postomat", name: "Нова Пошта — поштомат",   description: "1-3 дні",            price: 70  }
```

- Prices are UAH numerics (NP published rates per the WEEKLY steer). With Stripe out of the
  checkout path there is **no currency mismatch anymore** — these are the real order amounts.
- Default method: `np-office`.
- **Label lookup helper** `getShippingMethodLabel(id)`: maps the NP ids _and_ the legacy ids
  (`standard`/`express`/`overnight`, present on pre-G2 orders) to display labels, falling back
  to the raw id. Used by the confirmation page (replaces the broken
  `.replace("_", " ") + " Shipping"` concat) and available to account order views.
- `SHIPPING_METHODS` in `src/lib/stripe.ts` stays untouched (dormant). `generateOrderNumber()`
  is imported from `stripe.ts` as-is (no move — the file stays untouched, and importing it does
  not initialize Stripe thanks to the lazy `getStripe()`).
- `src/content/cart.ts` `summary.shippingValue` flips from the neutral «Розраховується при
  оформленні» to «За тарифами Нової Пошти» — the flip G1's spec explicitly deferred to G2.

## 4. New API — `POST /api/checkout/create-order`

Guest-capable COD order creation (`src/app/api/checkout/create-order/route.ts`):

1. `auth()` — session optional; `userId: session?.user?.id ?? null`.
2. Validate body: updated `checkoutSchema` (§7) + `items[]` (productId/variantId/quantity),
   mirroring confirm-order's item schema.
3. Recompute subtotal server-side from DB prices (same product/variant logic as confirm-order —
   client prices are never trusted); shipping cost from `shipping.ts` by method id.
4. Transaction: create order + items, decrement stock (variant or product), with:
   `status: "PENDING"`, `paymentMethod: "cod"`, `paymentStatus: "PENDING"`,
   `paymentIntent: null`, `paidAt: null`, `orderNumber: generateOrderNumber()`.
   **No Prisma migration needed** — all fields nullable/defaulted today.
5. Fire `sendOrderConfirmationEmail()` non-blocking (`.catch(() => {})`, parity with confirm-order).
6. Return `{ orderId, orderNumber }`.

Error shape: `apiError()`-style JSON like sibling checkout routes; Zod errors → 400 with issues.

**Known accepted gaps** (BACKLOG'd, not built now): no server-side idempotency key (client
disables the submit button while processing — parity with today's double-submit posture); no
rate limiting (none exists on sibling routes); item-vanished-at-submit behavior stays parity
with confirm-order (missing product skipped from the order).

> **Superseded (PR #29 review round 4, 2026-08-07):** the silent-skip parity above was written
> when "item vanished" meant a rare hard delete. The round-2 `isActive` gate made routine
> deactivation the trigger, so silently skipping an item would routinely alter the total the
> customer approved. The route now rejects the whole order with a coded 400
> (`PRODUCT_UNAVAILABLE`, mapped to Ukrainian copy client-side); the idempotency/rate-limit
> gaps above still stand.

## 5. Dormant Stripe path

Untouched and unreferenced by the live checkout: `api/checkout/create-payment-intent`,
`api/checkout/confirm-order`, `src/components/checkout/PaymentForm.tsx`, `src/lib/stripe.ts`,
`src/lib/stripe-client.ts`. The checkout page drops all Stripe imports (`Elements`, `getStripe`,
`PaymentForm`, `clientSecret`/`paymentIntentId` state). TASK-048 may revive the path (LiqPay/card
decision now re-framed by the client steer — see §10). Existing unit tests covering the dormant
routes keep passing (routes unchanged).

**Middleware**: `/checkout` removed from the auth-required matcher; `/account` and `/admin`
protection unchanged.

## 6. Confirmation page + analytics

`src/app/(shop)/checkout/confirmation/page.tsx` — full Ukrainian + Mirox restyle:

- «Замовлення прийнято!» hero, «Дякуємо! Ми надіслали підтвердження на …», «Замовлення №…».
- Payment line for COD orders: «Оплата при отриманні у відділенні» (from `paymentMethod: "cod"`;
  legacy card orders show a card label).
- Shipping method via `getShippingMethodLabel()` (fixes the EN concat bug for all orders).
- Order details card: item lines with `variantInfo`, «N шт × ціна», totals Товари / Доставка /
  До сплати (tax row dropped from display here too), shipping address block (UA labels),
  confirmation-email card, CTAs «Продовжити покупки» / «Історія замовлень».
- «Замовлення не знайдено» / loading states in Ukrainian.
- `PurchaseTracker` unchanged (fires `purchase` off the order as today).

**GA4**: `begin_checkout` unchanged; `add_shipping_info` sends the NP method name;
`add_payment_info` fires with `"cod"` on entering step 3 (replaces the post-payment-intent
call site). All existing `item_variant: item.size` mappings kept.

## 7. Validation schema changes (`src/lib/validations/index.ts`)

`checkoutSchema` / `shippingAddressSchema` (shared client + new API route):

- `phone`: optional → **required** («Вкажіть номер телефону») — COD fulfillment runs on the
  phone (NP SMS, manager confirmation).
- `postalCode`: required → **optional** (NP branch number replaces it; form no longer renders it).
- `country`: unchanged in schema (required, min 2) — the client always submits `"UA"`.
- Error messages for rendered fields translated to Ukrainian (they surface under form fields).
- Dormant `confirm-order` route has its own inline schema — untouched.

## 8. Content layer — new `src/content/checkout.ts`

Same extraction-ready pattern as `cart.ts` (plain typed strings, TASK-039 extraction point):
step nav labels, all field labels/placeholders, CTA labels («ДАЛІ — ДОСТАВКА», «ДАЛІ — ОПЛАТА»,
«← НАЗАД», «ПІДТВЕРДИТИ ЗАМОВЛЕННЯ»), COD copy («Працюємо без передоплати», method framing),
prepay block copy + config (`prepay: { cardNumber: null, cardHolder: null }` — typed
`string | null`), contact links (`instagram`/`telegram` re-exported or referenced from
`site.ts`; `whatsapp: null` until a number arrives), order-summary strings, empty-cart strings,
error strings (order-creation failure, network), confirmation-page strings.

## 9. Testing & verification

- **Unit** (Vitest, existing API-test conventions — mock `@/lib/auth`, `@/lib/db`,
  `@/lib/email` at top): `create-order` route — 400 validation (missing phone, bad email,
  empty items), guest (`userId: null`) vs signed-in, COD field values on the created order,
  totals recomputed from mocked DB prices + NP shipping, stock decrement calls, missing-product
  parity; `shipping.ts` — lookups incl. legacy ids + fallback; `checkoutSchema` — phone
  required / postalCode optional.
- **E2E** (Playwright): new `checkout.spec.ts` — guest reaches `/checkout` without login
  redirect, walks steps 1→2→3 with UA locators, submits, lands on confirmation with the order
  number visible (real PENDING order against the seeded DB). Hydration-gate patterns apply
  (WebKit pre-hydration lesson). `cart.spec.ts` updated for the flipped shipping-row string.
- **Visual-fidelity gate** (standing prevention, binds this task): rendered screenshots vs
  `Mirox Checkout.dc.html` at desktop + mobile, human sign-off before merge.
- Standard gates: `typecheck`, `lint`, `test:run`, `build`, docs-README index manual check
  (both directions + neighbouring rows, per WEEKLY mitigation note).

## 10. Bookkeeping (completion workflow inputs)

- **WEEKLY**: G2 entry gets a dated scope-change note (client steer → COD flow folded in,
  5 SP → ~8 SP); status flips to `✅ PR #N` on merge as usual.
- **Payments decision doc** (`2026-07-16-ukraine-payments-delivery-decision.md`): dated
  addendum — client (2026-08-06) directs launching **without** payment processing; COD rail
  pulled forward as the only rail; LiqPay/card integration (TASK-048) deferred until the client
  asks. Frozen doc → superseded-note, not a rewrite.
- **TASK-056 / G7 client ask** gains: bank-card details (number + holder) for the prepay block;
  WhatsApp contact number.
- **BACKLOG**: create-order idempotency key; decision record on eventually retiring vs reviving
  the dormant Stripe path; (existing) Stripe-Elements-dark-theme note becomes moot for checkout —
  annotate rather than delete.
