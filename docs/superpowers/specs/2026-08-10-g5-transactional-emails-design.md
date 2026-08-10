# G5 — Transactional Emails (Ukrainian, dark Mirox) — Design

**Date**: 2026-08-10
**Status**: Approved (brainstorm 2026-08-10; user approved all sections)
**Group**: WEEKLY 2026-08-03 G5 "Transactional Emails [solo] 🏆" (3 SP, stretch)
**Reference**: no email design handoff exists — styling follows the shipped-siblings consistency
gate (checkout confirmation page, `Mirox Checkout.dc.html` shell vocabulary)
**Backlog inputs**: `NEXT_PUBLIC_STORE_NAME` entry (code side), 🔵 "Verify prod email config"
(names G5 as natural home)

> **⚠️ Superseded in part (visual gate, 2026-08-10 — user rulings during PR #33):**
> (1) §5/§8's address composition **dropped the `country` line** — the shipped confirmation page
> renders no country and checkout always submits `"UA"`, so the raw code diverged from the sibling
> surface (commit `deb907d`; `OrderEmailData.country` stays a required field mirroring the stored
> order address, deliberately unrendered). (2) §5's contact block gained **WhatsApp**, null-gated
> on `brand.ts` `WHATSAPP_HREF` per the PR #29 no-dead-links ruling — hidden until the client
> supplies a real number, then lights up checkout + emails together (commit `df43878`).

---

## 1. Ruled decisions (user-confirmed in the brainstorm)

| #   | Decision          | Ruling                                                                                                                                                                              |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Visual direction  | **Dark Mirox**: mirror the site (#000 bg, #0D0D0D panels, white text/CTA), table-based with bgcolor fallbacks; fully-dark is also the most stable under client dark-mode transforms |
| 2   | Prod email config | **In scope, verify + report**: check Vercel prod env for `RESEND_API_KEY` / `EMAIL_FROM`; missing values become client action items; code ships regardless                          |
| 3   | Code structure    | **Shared layout + content module**: `src/content/emails.ts` (all UA copy incl. subjects) + shared shell in `src/lib/email-templates/`; order template moves out of `email.ts`       |

## 2. Current state (exploration findings)

Two email surfaces, both English, generic gray-on-white styling, branded
`process.env.NEXT_PUBLIC_STORE_NAME || "Store"`:

- **Order confirmation** — HTML generator inline in `src/lib/email.ts`; sent by
  `POST /api/checkout/create-order` (live COD path) and `POST /api/checkout/confirm-order`
  (dormant Stripe path). Already uses `formatPrice()` (UAH) and `getShippingMethodLabel()`
  (Ukrainian NP names for post-G2 orders, English legacy labels for pre-G2 ids).
- **Newsletter double-opt-in** — `src/lib/email-templates/newsletter-confirmation.ts`; sent by
  `POST /api/newsletter/subscribe`. Escapes the email address; has a © footer + optional
  unsubscribe link the order email lacks (shell duplication already diverging).

Defects found in exploration, fixed in-task:

1. **Unescaped interpolation (HTML injection)** — order email injects `productName`,
   `variantInfo`, and every `shippingAddress` field raw into email HTML. Checkout address
   fields are unauthenticated user input.
2. **Guest-hostile CTA** — "View Order Status" links `/account/orders`; guest COD orders
   (`userId: null`) can't see it. G2 hid the same CTA on the confirmation page for guests.
3. **False promise** — "We'll send you a shipping confirmation email" — no such email exists.
4. **`display: grid`** in the address/method block — unsupported in Outlook (and partially in
   Gmail).
5. **No `lang` attribute**, English `<title>`, English subjects.

A third `|| "Store"` site exists outside email: the admin settings label
(`src/app/(admin)/admin/settings/page.tsx:20`).

## 3. Scope

**In**

- Both email templates → Ukrainian copy + dark Mirox styling (shared shell).
- Brand routed through `BRAND_NAME` at all three `|| "Store"` sites; `NEXT_PUBLIC_STORE_NAME`
  still wins when set.
- Hardening: escape all interpolated user/DB strings; guest-aware CTA (`hasAccount`);
  drop the false shipping-email promise; tables instead of grid; `lang="uk"`; UA subjects.
- Prod email config verification + report (decision 2).

**Out** (recorded so reviewers don't re-flag)

- `variantInfo` renders seed-English «Size: M» inside order emails — separate 🟤 BACKLOG task
  («Розмір»/«Колір» rename: 12+ call sites + user-gated prod re-seed). The email renders
  whatever the order stored.
- Shipping-status / TTN emails — don't exist; nothing here promises them.
- react-email or any templating dependency (YAGNI for 2 emails).
- TASK-039 externalization — `src/content/emails.ts` **is** the extraction point, same as G1–G4
  content modules.
- Admin panel visuals; admin settings page stays English apart from the fallback fix.
- Legacy Stripe-era shipping labels stay English (`getShippingMethodLabel` fallback) — only
  pre-G2 orders reference them, and no email is ever re-sent for those.

## 4. Visual system — shared dark shell

Email-safe translation of the site tokens (`globals.css` Mirox `:root`):

| Element        | Treatment                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page           | outer 100%-width table, `bgcolor="#000000"` + inline style; inner 600px column                                                                         |
| Panels         | `#0D0D0D` bg, 1px `#1A1A1A` border, `border-radius: 14px` (degrades to square in old Outlook)                                                          |
| Text           | `#FFFFFF` primary · `#A3A3A3` muted · `#737373` faint                                                                                                  |
| Success accent | `#4ADE80` (site's sanctioned `--available` green) — ✓ mark on the order success panel                                                                  |
| CTA button     | white bg, black bold **uppercase** label, letter-spacing (site primary button vocabulary)                                                              |
| Font           | `'Manrope', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif` + Google-Fonts `<link>` for clients that honor it (Apple Mail); all others fall back |
| Header         | text wordmark — brand name, extrabold, white (Gmail strips `<svg>`; client logo vector still owed via TASK-056)                                        |
| Footer         | brand + © year; newsletter adds «Відписатися» when `unsubscribeUrl` present                                                                            |

Constraints: tables + stacked blocks only (no grid/flex), inline styles everywhere, `bgcolor`
HTML attributes alongside CSS for Outlook, no `<svg>`. The ✓ mark is a text glyph in a
`#4ADE80`-toned round-ish table cell, not an image.

## 5. Order-confirmation email

- **Subject**: `` `Замовлення ${orderNumber} прийнято — ${storeName}` ``
- **Body order**: success panel → order number panel → items → totals → address/method →
  contact block (+ CTA when `hasAccount`).
- Success panel: «Замовлення прийнято!» + «Дякуємо за замовлення!» (aligns with the
  confirmation page's `confirmation.title`).
- Order number panel: label «Замовлення №», value prominent.
- Items: escaped `productName` (bold), escaped `variantInfo` line (muted), quantity «× N»
  (muted), right-aligned line total via `formatPrice(totalPrice)`.
- Totals rows: «Товари» (subtotal) · «Доставка» (shippingCost) · «До сплати» (total, bold,
  bordered top) — same labels as the confirmation page. **«Податок» row renders only when
  `tax > 0`** (COD path is always 0; the confirmation page has no tax row at all; the dormant
  Stripe path may carry tax).
- Address + method: two stacked sections «Адреса доставки» / «Спосіб доставки» (no side-by-side
  grid); every address field escaped; method via `getShippingMethodLabel()`.
- **Contact block replaces the false promise**: «Питання щодо замовлення? Напишіть нам:» +
  Instagram/Telegram links (from the relocated socials — §7).
- **CTA**: «ІСТОРІЯ ЗАМОВЛЕНЬ» button → `${NEXT_PUBLIC_APP_URL}/account/orders`, rendered
  **only when `data.hasAccount`**. New `hasAccount: boolean` field on `OrderEmailData`, set to
  `Boolean(session?.user?.id)` in both `create-order` and `confirm-order` call sites — mirrors
  the G2 confirmation-page ruling.

## 6. Newsletter-confirmation email

- **Subject**: `` `Підтвердіть підписку на розсилку ${storeName}` ``
- Heading «Підтвердіть підписку»; body «Ви залишили цю адресу для підписки на розсилку
  {brand}: **{escaped email}**» + «Підтвердіть підписку — і ми надсилатимемо новинки та
  ексклюзивні пропозиції.»
- CTA «ПІДТВЕРДИТИ ПІДПИСКУ» → `confirmationUrl`.
- Safety note panel: «Не запитували підписку? Просто проігноруйте цей лист. Посилання дійсне
  24 години.» (matches the real 24-hour token expiry).
- Footer: © year + brand; «Відписатися» link only when `unsubscribeUrl` provided (unchanged
  conditional).

## 7. Code structure

| File                                                 | Change                                                                                                                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/emails.ts`                              | **New.** All UA email copy incl. subject builders. Imports only `./brand` — **must stay lucide-free** (it is bundled into API routes via `email.ts`)                                   |
| `src/content/brand.ts`                               | **Socials move in**: the `socials` array (pure strings: platform/label/href/followers — no icons) relocates here from `site.ts`. Adds no imports, honoring the file's import-free rule |
| `src/content/site.ts`                                | Re-exposes the relocated socials unchanged (`socials: SOCIALS`) so Footer/checkout consumers don't move                                                                                |
| `src/lib/email-templates/layout.ts`                  | **New.** Shell renderer (`<!DOCTYPE html><html lang="uk">`, header/footer), button + panel builders, color/font constants                                                              |
| `src/lib/email-templates/order-confirmation.ts`      | **New.** Order generator moves here from `email.ts` (symmetry with newsletter), rebuilt on the shell                                                                                   |
| `src/lib/email-templates/newsletter-confirmation.ts` | Rebuilt on the shell; keeps `escapeHtml(email)` and the conditional unsubscribe link                                                                                                   |
| `src/lib/email.ts`                                   | Slims to Resend wiring only; `storeName = process.env.NEXT_PUBLIC_STORE_NAME \|\| BRAND_NAME`; UA subjects from `content/emails.ts`; `OrderEmailData` gains `hasAccount: boolean`      |
| `src/app/api/checkout/create-order/route.ts`         | Passes `hasAccount: Boolean(session?.user?.id)`                                                                                                                                        |
| `src/app/api/checkout/confirm-order/route.ts`        | Same (dormant path kept correct)                                                                                                                                                       |
| `src/app/(admin)/admin/settings/page.tsx`            | Fallback `\|\| "Store"` → `\|\| BRAND_NAME`                                                                                                                                            |

`escapeHtml` stays where it lives (`src/lib/newsletter.ts`) and is imported by the order
template — server-only module, no weight concern.

Brand resolution happens **at render time** (a small helper, not a module-scope `const`):
today's module-scope `const storeName = process.env… || "Store"` is frozen at import, which
both breaks the env-dependent tests in §9 and ignores runtime env in tests generally.

## 8. Hardening

`escapeHtml` applied to **every** interpolated user/DB string in the order email:
`shippingAddress.{name,company,line1,line2,city,state,postalCode,country}`, `productName`,
`variantInfo`. (Order number, prices, and method labels are server-generated.) The newsletter
template already escapes its one user string.

> _Superseded note (2026-08-10 gate, `deb907d`): `country` left this list along with its rendering
> — see the header note. The remaining fields are escaped as specified._

## 9. Testing & verification

TDD — tests first, new `tests/unit/email-templates.test.ts`:

- Shell: `lang="uk"` present; dark shell markers (`bgcolor="#000000"`); brand renders
  «Mirox Shop» when `NEXT_PUBLIC_STORE_NAME` unset; env value wins when set
  (env-dependent-test pattern: store/restore `originalEnv`); **no "Store" string anywhere** in
  either rendered template.
- Order: UA headings; injection string in an address field (`<img src=x onerror=…>`) arrives
  escaped; CTA present when `hasAccount: true`, absent when `false`; «Податок» row hidden at
  `tax: 0`, shown at `tax > 0`; legacy shipping id still resolves via
  `getShippingMethodLabel`; `formatPrice` output present.
- Newsletter: `confirmationUrl` lands in the CTA `href`; email address escaped; unsubscribe
  link conditional on `unsubscribeUrl`; 24-hour note present.
- `email.ts`: UA subjects (subject builders asserted from `content/emails.ts`; send-path
  subject wiring covered with mocked `resend` + `RESEND_API_KEY` set, existing
  env-dependent-test pattern).

**Visual gate** (standing rule for design tasks): render both templates to static HTML files,
open in a real browser, screenshot, compare for consistency against the shipped confirmation
page, human sign-off before merge.

Manual: local dev checkout run confirms the no-API-key skip path still logs cleanly.

## 10. Prod email config verification (decision 2)

Verify `RESEND_API_KEY` and `EMAIL_FROM` exist in Vercel **prod** env (Vercel tooling or a
dashboard check with the user) and report findings in the task journal:

- Both present → note the sending domain and whether it's Resend-verified.
- Anything missing → concrete client action items (create Resend account, verify the sending
  domain's DNS, set both vars) routed to the TASK-056 ask / BACKLOG; the 🔵 BACKLOG entry
  closes with a pointer to wherever the follow-up landed.
- Known hazard recorded: the code fallback `noreply@yourdomain.com` hard-fails Resend on an
  unverified domain — receipts silently never send if only the API key is set.

## 11. Consequences / propagation (at completion)

- WEEKLY G5 → `✅ PR #N` (Summary Table + Daily Schedule) once merged.
- BACKLOG `NEXT_PUBLIC_STORE_NAME` entry: code side closes (all three `|| "Store"` sites
  routed through `BRAND_NAME`); the env-var-unset-in-prod observation narrows to
  config-optional (brand now correct without it).
- BACKLOG 🔵 "Verify prod email config" closes per §10.
- CLAUDE.md: architecture tree + conventions gain `content/emails.ts`, the email-templates
  shell, and the socials relocation note (brand.ts ↔ site.ts).
- TASK-056 ask: append email-domain items if §10 finds gaps (Resend account / DNS), and the
  standing logo-vector ask now also unlocks a real email header logo.
