# TASK-039 i18n Foundation — Design (G9)

**Date**: 2026-08-14
**Status**: Approved (user, 2026-08-14 — extraction scope, RU authorship, SEO join, mechanism choice, and all three design sections)
**Source**: WEEKLY [G9](../../planning/WEEKLY.md) · TODO.md TASK-039 · program spec §v1.3 · [payments decision doc §7.4](2026-07-16-ukraine-payments-delivery-decision.md) · BACKLOG [2026-08-10] next-intl design input · BACKLOG [2026-08-09] EN SEO/metadata entry
**Branch**: `feat/task-039-i18n-foundation`

## Goal

Give the storefront real locale infrastructure — Ukrainian default, Russian toggle — and move
every customer-facing UI string out of hardcoded literals into locale catalogs, so G13 (admin
UA) and G14 (variant rename) land their strings once in the final mechanism. Verify
`formatPrice()` against decision-doc §7.4 as the third AC. The monobank UA-site prerequisite
(decision doc §4.2, escalated by TASK-038b) is satisfied by the UA default; payments itself
(TASK-048) stays client-gated.

## User rulings (2026-08-14, this brainstorm)

1. **Extraction scope — full sweep, phased.** The AC's wording ("content layer + inline
   homepage/header/footer strings") predates TASK-036/037, which hardcoded UA directly into
   ~34 more files (~230 Cyrillic-bearing lines: products domain, all 6 review components,
   categories pages, checkout page, lib label modules). G9 externalizes **all** customer-facing
   UI strings so the RU toggle is coherent; anything not yet translated ships under UA fallback
   (see §2 deep-merge). `category-client.tsx` is skipped (G12 retires it).
2. **RU authorship — agent draft + user gate review.** Full RU catalog drafted in-task, reviewed
   by the user at the G9 visual gate (same review channel as UA copy at every prior gate).
   Catalog carries a `DRAFT — pending client sign-off` flag; final client confirmation folds
   into the pre-launch week's TASK-056 round-trip. This is the weighed application of the
   BACKLOG [2026-08-10] guidance against agent-translated catalogs: nuanced strings (hero,
   testimonials, client claims) are individually flagged for that review.
3. **EN SEO/metadata layer — joins G9.** The ~8–12 user-visible EN metadata strings
   ("All Products", "Categories", "Sign In"/"Create Account" + auth descriptions,
   "Category Not Found", JSON-LD breadcrumb "Home"/"Categories") are converted to Ukrainian
   through the same catalog mechanism. Closes BACKLOG [2026-08-09]. Full-seo.ts i18n beyond
   this fixed set is NOT in scope.
4. **Mechanism — next-intl in cookie mode (no i18n routing).** Chosen over (B) a bespoke
   locale-dimension content layer (identical sweep cost + hand-rolled plumbing + bespoke
   mechanism for future groups) and (C) `[locale]` URL routing (every `app/` file moves,
   middleware composition with NextAuth v5 beta, sitemap/OG/E2E churn — days of work for RU SEO
   that is not a launch goal). Cookie mode upgrades to URL routing later on the same catalogs
   if RU SEO ever becomes a goal; `useExtracted` is an authoring-time workflow for
   inline-first codebases, not a fit for migrating ~1,000 existing strings.

## Scope boundaries (explicitly OUT of G9)

- **DB product/category data** (names, descriptions): no locale dimension exists in the
  schema. RU mode shows RU chrome over UA product data. Schema-level i18n is a separate,
  much larger task (none scheduled).
- **Transactional emails** (`src/content/emails.ts` + `src/lib/email-templates/*`): stay
  UA-only, untouched — recipient locale is unknown at send time (orders don't store it).
  Preserves the lucide-free contract and all email tests.
- **Zod validation messages** (`src/lib/validations/index.ts`, 13 UA strings): stay UA.
  Locale-aware schemas need per-locale schema factories shared client/server — not worth it
  for G9. Known UA-in-RU-mode surface, recorded here.
- **Admin panel** (incl. `ProductForm.tsx`): G13 lands admin strings as an `admin.*`
  namespace in these same catalogs, after G9.
- **`category-client.tsx`** (~436 lines, 26 UA lines): G12 retires it via redirect. If G12
  slips, it stays hardcoded-UA — correct in the UA default, UA-shown in RU mode.
- **URL-based locale routing / RU SEO / hreflang**: ruled out (ruling 4). Crawlers carry no
  cookie → always index the UA default, which the language law requires anyway.
- **§7.5 cash rounding**: amount computation, not display — belongs to the payments tasks.

## 1. Locale infrastructure

- **Dependency**: `next-intl@^4.8.3`. Peer-verified against the pinned stack: `next ^14.0.0`,
  `react ^18.0.0`, `typescript ^5.0.0` (from the v4.8.3 package.json).
- **`next.config.mjs`**: wrapped with `createNextIntlPlugin()` (binds the request config
  below). `output: "standalone"` and the existing config are preserved; `next build` is a
  required verification step.
- **`src/i18n/config.ts`**: `LOCALES = ["uk", "ru"] as const`, `Locale` type,
  `DEFAULT_LOCALE = "uk"`, cookie name `NEXT_LOCALE` (next-intl's own routing convention, so
  a future URL-routing upgrade reads the same cookie).
- **`src/i18n/request.ts`**: `getRequestConfig` — read `NEXT_LOCALE` cookie → validate
  against `LOCALES` → fall back to `uk`. Messages: `uk.json` always loads; for `ru`, RU
  deep-merges **over** UA so a missing RU key silently renders Ukrainian (the phasing valve
  of ruling 1). Deep-merge is a small hand-rolled util (no new dependency), unit-tested.
- **`src/i18n/actions.ts`**: `setLocale(locale)` server action — validate against `LOCALES`,
  `cookies().set("NEXT_LOCALE", locale, { maxAge: 1y, path: "/" })`. Cookie writes in server
  actions invalidate the router cache; no manual refresh plumbing.
- **Root layout** (`src/app/layout.tsx`): becomes async; `const locale = await getLocale()`;
  **`<html lang={locale}>` replaces the incorrect hardcoded `lang="en"`** (uk default / ru
  toggled; emails already declare `lang="uk"`). `NextIntlClientProvider` (server wrapper —
  auto-inherits locale + messages from request config) wraps `<Providers>`.
- **Client bundle**: the full active-locale catalog ships to the client (~tens of KB
  pre-gzip). Accepted for G9; namespace-scoped client messages are the recorded optimization
  if bundle metrics complain later.
- **Locale toggle** (`Header.tsx`): compact `UA | RU` control, active locale highlighted,
  desktop header + mobile menu, calls `setLocale`. Gets a `data-testid`; Mirox chrome styling
  reviewed at the visual gate.
- **Deliberately unchanged**: NextAuth-wrapped `src/middleware.ts`, all URLs, sitemap/robots,
  OG image routes, checkout flow. The app is already `force-dynamic`, so `cookies()` in the
  request config changes no rendering mode. Admin/auth/showcase inherit the infra
  automatically.

## 2. Message catalogs & extraction rules

- **Files**: `messages/uk.json` + `messages/ru.json`. Namespaces mirror the content domains:
  `header`, `footer`, `home`, `brand`, `cart`, `checkout`, `account`, `auth`, `products`,
  `reviews`, `categories`, `newsletter`, `feedback`, `system`, `shipping`, `seo`; `admin`
  reserved for G13.
- **ICU replaces function-strings**: `itemsCount(n)` →
  `{count, plural, one {# товар} few {# товари} many {# товарів}}` (CLDR uk/ru rules replace
  `pluralizeUk` for catalog strings; `pluralizeUk` itself survives only if a non-catalog
  consumer remains — emails keep their own copy path); `viewAll(q)` →
  `Всі результати для «{query}»` interpolation.
- **Type safety**: `global.d.ts` augmentation types all `t()` keys against `uk.json` — a
  typo'd key across the ~70 touched files is a compile error.
- **The extraction law — byte-identical**: every existing UA string moves verbatim. A
  scripted byte-diff compares extracted catalog values against the pre-migration literals
  (the «цінує»→«цінює» transcription lesson). This is also what keeps every existing E2E
  locator green.
- **Config/string split — what stays in TS**:
  - `brand.ts`: `BRAND_NAME` (proper noun, locale-invariant), `SOCIALS`, `WHATSAPP_HREF`
    stay; tagline / hero subtitle / meta suffix / description move to `brand.*` keys.
  - `site.ts`: announcement `id`/`href`/`marquee` gating, client `claims` values,
    `footerBenefits` icons stay — **with their retraction-ruling comments**; display strings
    move.
  - `checkout.ts`: COD block config + CLIENT-SUPPLIED-pending manager contacts stay; copy
    moves.
  - `shipping.ts`, `product-badges.ts`, `product-display.ts`, `order-status.ts`/`account.ts`
    label maps: prices/logic/enum keys stay; labels become catalog keys looked up by enum
    value.
  - `newsletter.ts`/`feedback.ts` `byCode` maps: become catalog namespaces keyed by API
    outcome code; coverage tests keep asserting every emitted code has a translation
    (non-vacuous, per the guards-need-teeth rule).
- **Deletion policy**: pure-string modules (`cart.ts`, `home.ts`, `auth.ts`, `system.ts`,
  `feedback.ts`, page-copy portions of `newsletter.ts`) are deleted once consumers migrate —
  no shim layer. Modules with config residue survive trimmed. `emails.ts` survives whole.

## 3. Consumer migration

- Client components: `useTranslations("<ns>")`; server components:
  `await getTranslations("<ns>")`; `generateMetadata`: `getTranslations`.
- Sweep surface: 37 content-consuming files + ~34 inline-string files (biggest:
  `filter-bar.tsx` 33 lines, `product-detail-client.tsx` 26, `ProductCard.tsx` 12,
  `SizePicker.tsx` 10, review components ~24 across 6 files). Skips per rulings:
  `category-client.tsx`, `ProductForm.tsx`, emails, Zod messages.
- **SEO fixed set** (ruling 3): `getAuthMetadata` titles + descriptions, "All Products",
  categories listing title, "Category Not Found" (`categories/[slug]/page.tsx`), JSON-LD
  breadcrumb "Home"/"Categories" → UA via `seo.*` keys through `getTranslations`. Crawlers
  see UA; RU-cookie users get RU tab titles for free. The exact string inventory is
  enumerated at implementation and recorded in the plan.

## 4. RU catalog (ruling 2)

Full RU draft authored in-task **after** the UA extraction stabilizes (drafted once).
`ru.json` header comment: `DRAFT — agent-translated, pending client sign-off (TASK-056,
pre-launch week)`. Individually flagged for gate review: hero copy, testimonials (quoted
customer voices — placeholder demo content, but tone matters), claims copy, announcement
text. Gate review walks at least one full RU page; the pre-launch week's client ask includes
RU sign-off as a rider.

## 5. formatPrice §7.4 verification (AC 3)

`src/lib/format.ts` already delegates grouping/decimals to `Intl.NumberFormat("uk-UA")` and
appends «грн». Verification makes compliance proven, not asserted:

- **Axis-named unit tests** added to `format.test.ts`: non-breaking-space thousands
  (` ` U+00A0, asserted by code point), comma decimal, «грн» after the amount joined by NBSP, no trailing period
  (ДСТУ 3582:2013), exactly two kopiyka digits whenever fractional, grouping boundary
  (999 vs 1 000).
- **Two documented compliance rulings** (recorded here; the deviation is from §7.4's letter,
  not its intent):
  1. Whole amounts render without «,00» («1 290 грн») — deliberate display convention since
     TASK-057. §7.4's "always two digits" governs kopiykas _when shown_ (never «1 290,5»).
  2. «грн» suffix instead of `style: "currency"`'s «₴» — §7.4 explicitly allows either
     symbol; the separator logic §7.4 warns against hand-rolling is fully delegated to
     `Intl.NumberFormat("uk-UA")`. A node repro against `style: "currency"` output goes in
     the plan's verification record.
- **Locale-invariance ruling**: `formatPrice` stays uk-UA-formatted in RU mode («грн» is
  standard in RU-language Ukrainian commerce; the number conventions are identical). One
  sanctioned formatter, unchanged — the §7.4 architecture is not forked per locale.

## 6. Testing

- **Unit**: new `tests/helpers/render-with-intl.tsx` (RTL render wrapped in
  `NextIntlClientProvider` with the real `uk.json`); the 26 RTL component test files swap to
  it mechanically. `content.test.ts` re-points at catalogs. New tests: request-config
  fallback (bad/absent cookie → uk; ru merges over uk), deep-merge util, `setLocale`
  validation, §5's format axes.
- **E2E** (chromium + webkit in CI): toggle → a key page renders RU → toggle back;
  `html[lang]` assertion. Existing locators stay green via the byte-identical law; the
  toggle is additive UI. Sweep check anyway per the PR #31 lesson: grep all spec files for
  any string the diff _removes_.
- **Visual gate**: toggle chrome + one full RU page walk; screenshots via Artifact
  (standing convention); `rm -rf .next` before every gate round (stale-cache lesson).
- **Build**: `next build` + full CI must pass with the plugin wrap (standalone output).
  No CSS work in this group, so the Tailwind-prod-CSS gotchas don't apply.

## 7. Sequencing & pressure valves

1. Infra (§1) + test helper — **this alone unblocks G13's planning premise**.
2. Content-layer domains (mechanical, typed): cart / checkout / home / auth / account /
   newsletter / feedback / system / site / header.
3. Inline sweep by domain: products → reviews → categories page + checkout page + lib labels.
4. SEO fixed set (§3).
5. RU draft catalog (§4).
6. §7.4 verification tests (§5) — independent, interleaves anywhere.

**Valve** (ruling 1): if the week jams, any not-yet-extracted inline domain ships later under
UA fallback without breaking the toggle; the RU draft can trail the UA extraction into the
gate. Today is Thursday of a 40-SP week — the valve is expected to matter.

## 8. Group interactions

- **G13 (admin)**: lands as `admin.*` namespace in these catalogs; needs only §1 + the
  consumer patterns landed. — **G14 (variant rename)**: seed/DB-side, independent; its
  shared variant-name constant is code-side, not catalog. — **G12**: owns
  `category-client.tsx`'s fate; G9 skips it either way. — **TASK-056 (pre-launch)**:
  inherits RU client sign-off as a rider. — **TASK-048 (payments)**: the monobank UA-site
  prerequisite is satisfied by this group's UA default.

## 9. Success criteria (AC mapping)

- [ ] Locale infrastructure: UA default + RU toggle (WEEKLY G9 item 1) — §1 shipped, toggle
      live, `html[lang]` correct, middleware/URLs untouched.
- [ ] Hardcoded customer strings externalized (WEEKLY G9 item 2, per ruling 1's full-sweep
      scope) — §2/§3 shipped; byte-diff clean; UA fallback covers any phased remainder.
- [ ] `formatPrice()` §7.4 verified (WEEKLY G9 item 3) — §5 tests green + rulings recorded;
      EN SEO/metadata ruling made (ruling 3: joined) and the fixed set converted.
- [ ] Unit + E2E + build + CI green; visual gate signed off (toggle + RU walk).
