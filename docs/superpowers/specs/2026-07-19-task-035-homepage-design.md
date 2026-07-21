# TASK-035 — Homepage Rebrand

**Status**: Design approved · ready for implementation plan
**Date**: 2026-07-19
**Task**: [TASK-035] Homepage rebrand (v1.3, Priority High, Effort L)
**Depends on**: TASK-034 (design system & rebrand foundation, merged PR #19)
**Program**: Mirox Shop rebrand → Ukraine launch — see `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md`
**Branch**: `feat/task-035-homepage-rebrand`

---

## 1. Purpose

Rebuild the customer homepage on the Mirox design system delivered by TASK-034. The homepage is the first page the client will judge the rebrand by, and the brief's stated goal is that a visitor should want to buy **within the first 10 seconds**. This task turns a generic template page into the Mirox storefront: dark typographic hero, benefit strip, two product rails backed by real data, a trust block, testimonials, social links, and a rebranded footer.

TASK-034 shipped tokens and shared chrome. This task is the first page-level consumer of that system, and the first consumer of its motion primitives.

### Success criteria (from TODO.md acceptance criteria)

- [ ] First screen matches brief: slogan, subtitle, two CTAs
- [ ] Benefit cards and "Why choose us" blocks present
- [ ] Social section (Instagram, TikTok, Telegram) present
- [ ] Top announcement banner slot (free delivery/promo text) — client list #2 item 13
- [ ] Hero uses real model photography (client to supply; placeholder until then) — item 14
- [ ] Social follower counters only if real numbers supplied — item 16

---

## 2. Approved decisions

Five decisions were settled during brainstorming. They are binding for this task.

| #   | Decision          | Choice                                                                                                                                                                                                                               |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Copy language** | **English now, extraction-ready.** Every string lives in `src/content/`, giving TASK-039 a single extraction point. Ukrainian translation is TASK-039's job, not this task's.                                                        |
| 2   | **Hero**          | **Typographic-complete, photo slot additive.** The hero reads as finished with no photograph. An AI-generated placeholder fills the slot under three guardrails (§5.2).                                                              |
| 3   | **Trust claims**  | **Config-driven, populated with the client's own figures, attributed to them.** Claims render only when configured. They never feed `aggregateRating` structured data.                                                               |
| 4   | **Product rails** | **Featured + real bestsellers computed from `OrderItem`**, backfilled from newest arrivals when order history is too thin. Testimonials come from real `Review` rows. The bestseller definition is shared with TASK-036's sort.      |
| 5   | **Footer scope**  | Copy, social links, and benefit strip. Dead links removed. The seven missing content pages become a **spawned task**, because three of them are gateway-onboarding prerequisites requiring client/legal copy we cannot invent (§10). |

---

## 3. Source-of-truth risk (addressed in this task)

The client brief exists **only inside a Claude Code session transcript** (`~/.claude/projects/-workspaces-dropshipping/2565949a-….jsonl`, lines 44 and 654). Every repository document that cites "client list #2 item 13" is a second-hand paraphrase pointing at that file. The concept screenshot `photo_2026-07-13_13-23-08.jpg` sits untracked in the repo root — not gitignored, merely never added.

The entire rebrand program's requirements therefore depend on one file on one disk, with no backup and no review history.

**This task fixes that**: brief list #1 and list #2 are transcribed verbatim (original Russian, with English translation) into `docs/reference/client-brief.md`, and the concept screenshot moves to `docs/reference/mirox-concept-screenshot.jpg`. Both are committed and indexed in `docs/README.md`. This is cheap, and TASK-035 is the first task whose correctness depends directly on the brief's exact wording.

---

## 4. Architecture

### 4.1 Problem with the current page

`src/app/(shop)/page.tsx` is 255 lines holding two inline Prisma queries, an inline `features` array, and inline JSX for five sections. The rebuilt page has eight sections plus a richer data layer; left inline it would exceed 600 lines and mix data access, copy, and markup in one file.

### 4.2 Target structure

```
src/content/
├── site.ts                 # brand, social links, client-supplied claims, announcement
└── home.ts                 # homepage copy

src/components/home/            # homepage-only sections
├── Hero.tsx                # typographic hero, optional photo slot
├── ProductRail.tsx         # shared rail: heading + view-all + product grid
├── WhyChooseUs.tsx         # policy claims + config-gated client claims
├── Testimonials.tsx        # real review excerpts
└── index.ts                # barrel export (repo convention)

src/components/common/         # shared chrome — used by homepage AND Footer/layout
├── AnnouncementBar.tsx     # dismissible top banner (mounted in (shop)/layout.tsx)
├── BenefitStrip.tsx        # 4 benefit items, content via prop
└── SocialLinks.tsx         # Instagram / TikTok / Telegram

src/lib/product-queries.ts  # getFeaturedProducts / getBestsellers / getNewArrivals
```

**Placement rule**: `home/` holds sections only the homepage renders; `common/` holds anything a second surface consumes. `BenefitStrip` and `SocialLinks` both appear in the footer as well as the homepage, and `AnnouncementBar` mounts in the shop layout, so all three are shared chrome. Putting them under `home/` would force `Footer.tsx` to import from a page-specific directory.

This placement has a second benefit: `src/components/common` is **already** in the colour guard's `SCAN_PATHS`, so those three components are covered from the moment they exist (§8).

`page.tsx` becomes composition only — roughly 60 lines of section ordering and data plumbing.

### 4.3 Why these boundaries

- **`src/content/` is a new top-level convention**, and it earns its place twice over: it is the single file set TASK-039 must externalize for i18n, and the single place the spawned client-inventory task must read to enumerate what the client still owes. Copy currently scattered inline across `page.tsx` and `Footer.tsx` cannot serve either purpose.
- **Two content modules, not one.** `site.ts` is consumed by the `Footer` as well as the homepage (social links, claims, brand voice); `home.ts` is page-specific. Merging them would force the Footer to import homepage copy.
- **`product-queries.ts` lives in `src/lib/`, not `src/components/home/`**, because **TASK-036 reuses `getBestsellers()` for its "popular" sort order**. Both tasks face the identical "what does popular mean" question; this settles it once, in a shared, tested helper. Putting it under `home/` would guarantee a duplicate definition later.

---

## 5. Page composition

Top to bottom. Surface column indicates the TASK-034 token surface.

| #   | Section         | Surface | Notes                                               |
| --- | --------------- | ------- | --------------------------------------------------- |
| 1   | AnnouncementBar | dark    | Site-wide, in `(shop)/layout.tsx`                   |
| 2   | Hero            | dark    | Full-bleed; the first screen                        |
| 3   | BenefitStrip    | dark    | Inside the hero surface, per the concept screenshot |
| 4   | ProductRail     | light   | Featured                                            |
| 5   | ProductRail     | light   | Bestsellers                                         |
| 6   | WhyChooseUs     | light   | Policy claims + config-gated client claims          |
| 7   | Testimonials    | light   | Real reviews; omitted entirely when none qualify    |
| 8   | SocialLinks     | dark    | Instagram / TikTok / Telegram                       |
| 9   | Footer          | dark    | Existing component (TASK-034), new copy + socials   |

### 5.1 AnnouncementBar

Rendered **site-wide** in `src/app/(shop)/layout.tsx`, above `<Header />`. The header is `sticky top-0 z-50`; the bar is deliberately **not** sticky, so it scrolls away and does not permanently consume viewport height on mobile. Dismissal persists in `localStorage`.

No conflict with `CookieConsent`, which is bottom-anchored — the two overlays cannot stack, which was the recorded objection to the discount-wheel popup.

Copy comes from `site.announcement`; setting it to `null` removes the bar entirely. The admin-managed version of this banner remains **TASK-047**.

### 5.2 Hero

`data-surface="dark"`, full-bleed. Contents, per brief list #1:

- Eyebrow: `NEW COLLECTION`
- Headline: `STYLE.` / `QUALITY.` / `CONFIDENCE.` — three lines, Manrope, large, tight tracking
- Subtitle: "Mirox Shop — modern clothing for those who value quality and minimalism."
- Primary CTA: **Shop the Catalog** → `/products`
- Secondary CTA (outline): **New Arrivals** → `/products?sort=newest`

**CTA label ambiguity resolved.** The brief contains two conflicting versions: the homepage section says `Перейти в каталог` / `Смотреть новинки`, while the image-generation prompt in the same document says `Перейти в каталог` / `Новинки`. TODO.md's "two CTAs" criterion does not say which wins. This design takes the **homepage section** as authoritative, since it describes the page rather than a mockup, and renders it in English per decision 1.

**One component, two layouts.** When `home.hero.image` is `null`, the hero renders centered and typographic. When set, it renders two-column — text left, image right — matching the concept screenshot. The layout is complete and intentional in both states, so removing the image is a one-line config change, not a redesign.

**AI placeholder guardrails.** The slot is filled with a generated image under three constraints:

1. **No fabricated Mirox logo on the garment.** An AI-rendered brand mark on AI clothing depicts merchandise that does not exist, which crosses from mood photography into product photography of a fake product. Plain unbranded black clothing only.
2. **Filename marks it as a placeholder** (`hero-placeholder-ai.*`), so it is not later mistaken for a client asset.
3. **Client signs off before production.** AI imagery on a brand whose stated goal is "look more expensive than most Ukrainian shops" is a brand decision, not an engineering one.

The image is served through `next/image` with `priority`, a blur placeholder from `DEFAULT_BLUR_DATA_URL`, and explicit `sizes` — it is the LCP element and the brief demands PageSpeed 95+.

### 5.3 BenefitStrip

Four items, matching both the brief and the concept screenshot: fast delivery, size exchange, premium quality, 24/7 support. Rendered inside the hero's dark surface as a horizontal strip, per the concept.

### 5.4 ProductRail (×2)

One shared component, two instances: **Featured** and **Bestsellers**. Each renders a heading, a "view all" link, and a responsive grid of the existing `ProductCard`. `ProductCard` is unchanged in this task — its hover/quick-view/quick-buy treatment is **client list #2 item 19, owned by TASK-036**.

"View all" targets: Featured → `/products?featured=true` (the existing link), Bestsellers → `/products?sort=newest` as an interim target, because no "popular" sort exists on the catalog **until TASK-036 adds one**. When TASK-036 lands its sort, this link is repointed to it — recorded there as a follow-up so the interim target is not left behind.

### 5.5 WhyChooseUs

The brief's `Почему выбирают нас` block is a **10-item** list. Not all ten are the same kind of statement, and they are split accordingly:

**Seven render as static copy** — policy statements true by construction, plus unfalsifiable brand voice:

| Brief item | Copy                               |
| ---------- | ---------------------------------- |
| 4          | Fast delivery across Ukraine       |
| 5          | Every item checked before shipping |
| 6          | Size exchange                      |
| 7          | Support seven days a week          |
| 8          | Quality clothing only              |
| 9          | Secure payment                     |
| 10         | Trusted by returning customers     |

**Three are config-gated client claims**, read from `site.claims` and rendered only when set:

| Brief item | Claim                 | Config key        |
| ---------- | --------------------- | ----------------- |
| 1          | 300+ sales on OLX     | `olxSales`        |
| 2          | 100+ Instagram orders | `instagramOrders` |
| 3          | High customer rating  | `customerRating`  |

**Refinement to note at spec review.** The approved design said "6 qualitative + up to 2 config-driven numeric". Two items moved on closer reading of the brief: item 3 ("высокий рейтинг покупателей") joined the config-gated group because it is _checkable against our own review data_ and a claimed rating contradicting on-site reviews is a real inconsistency; item 10 ("нам доверяют постоянные клиенты") stayed static because it makes no falsifiable claim, sitting in the same register as "quality clothing only". Net: seven static, three gated.

The config block carries a provenance comment recording that these are client-supplied, unaudited, and dated. **None of these values may feed `aggregateRating` JSON-LD** — the site emits real review structured data via `seo.ts`, and Google's structured-data policy prohibits aggregate ratings that do not correspond to on-site reviews.

### 5.6 Testimonials

Real `Review` rows: `isHidden: false`, `rating >= 4`, non-empty `comment`, newest first, capped at six. Shows reviewer name, rating, excerpt, and the product reviewed.

The concept screenshot includes this block, and unlike the trust numbers it is backed by genuine data, so it ships. When no reviews qualify — the state of a new store — the section does not render.

### 5.7 SocialLinks

Instagram, TikTok, Telegram, with the brief's subtitle ("follow to hear about new arrivals first"). URLs come from `site.socials` and are client-supplied placeholders until confirmed.

**Follower counters render only when a real number is configured** (`followers: null` by default). This satisfies TODO.md's "only if real numbers supplied" criterion and matches the no-fabricated-social-proof principle already established for TASK-051. Live counter APIs are out of scope.

### 5.8 Footer

TASK-034 already made the footer a dark surface with the Mirox `<Logo/>`. What remains:

- Replace generic copy ("Your one-stop shop for quality products at great prices") with Mirox brand voice from `site.ts`
- Add the social section, reusing `SocialLinks` (§5.7) rather than a second implementation
- Add the benefit strip shown in the concept's footer — **the same `BenefitStrip` component as §5.3**, which is why it takes its items as a prop rather than reading `home.ts` directly. The concept shows delivery/returns/payment/support in the footer against delivery/exchange/quality/support in the hero, so the two instances differ in content but not in structure.
- **Remove the dead links.** All seven current targets — `/contact`, `/faq`, `/shipping`, `/returns`, `/about`, `/privacy`, `/terms` — are 404s; none of those routes exist. Links return as those pages land (§10).

---

## 6. Data layer

`src/lib/product-queries.ts` exposes three functions.

### 6.1 `getFeaturedProducts(limit)`

Existing behavior, extracted from `page.tsx` unchanged: `isActive && isFeatured`, newest first.

### 6.2 `getNewArrivals(limit)`

`isActive`, `createdAt` descending. Also the backfill source for bestsellers.

### 6.3 `getBestsellers(limit, windowDays = 90)`

Groups `OrderItem` by `productId`, summing `quantity`, restricted to orders whose status is `CONFIRMED`, `PROCESSING`, `SHIPPED`, or `DELIVERED`. `PENDING` is excluded because the sale is not real yet; `CANCELLED` and `REFUNDED` because it did not stick. Restricted to `order.createdAt >= now - windowDays` so the rail reflects current demand rather than lifetime totals. Resulting products are loaded and filtered to `isActive`.

**Thin-history fallback.** When fewer than `limit` products qualify — the normal state of a new store — the result is backfilled from `getNewArrivals()`, deduplicated against what the order data already returned. The function returns `{ products, source: "orders" | "backfilled" | "mixed" }` so callers can tell what they received rather than silently presenting new arrivals as bestsellers.

This is the definition **TASK-036 will import for its "popular" sort**.

### 6.4 Schema change

`OrderItem` currently declares only `@@index([orderId])`. `productId` is a foreign key to
`Product`, and Postgres does not auto-create an index on FK referencing columns (only on PK/unique
constraints), so deleting or updating a `Product` forces a sequential scan of `order_items` to
check for references. That is the real reason to add:

```prisma
@@index([productId])
```

Confirmed via `EXPLAIN (ANALYZE, BUFFERS)` against the real local Postgres: the bestseller
`groupBy` itself does **not** use this index — its plan is driven by the selective
`orders.status`/`orders.createdAt` filter joined through the pre-existing `orderId` index, with the
small grouped result sorted in memory. A composite `Order(status, createdAt)` index is what would
actually speed that query if it ever becomes a bottleneck.

One migration via `npm run db:migrate`.

### 6.5 Rendering strategy

The homepage currently declares `export const dynamic = "force-dynamic"`, so every visit runs four queries against serverless Postgres before first byte. Against a PageSpeed 95+ target this is the wrong default for a page whose content changes slowly.

Proposed: `export const revalidate = 300` (ISR, five minutes).

**Flagged for verification, not assumed.** The change is validated against the Neon adapter and a production build before it is kept; if ISR interacts badly with the Prisma serverless setup, the page stays dynamic and the decision is recorded. `force-dynamic` was not obviously deliberate — no comment explains it — but that is not proof it was accidental.

### 6.6 Empty states

Every data-backed section renders nothing when its query returns empty, following the existing conditional-category-section pattern. A brand-new store gets a shorter but coherent page rather than empty rails with skeleton placeholders.

---

## 7. Design system consumption

All color, spacing, radius, and motion come from TASK-034 tokens. No new tokens are introduced.

**First consumers of the motion primitives.** TASK-034 shipped `<FadeIn>`, `.animate-fade-up`, and `.hover-lift` with **zero consumers**, which DONE.md records honestly. This task wires them: sections reveal via `<FadeIn>`, product and benefit cards use `.hover-lift`. This both delivers the brief's "smooth appearance" requirement and puts the primitives under real use for the first time.

**Motion budget.** The client suggested GSAP (list #2 item 15). No animation library is added — the token-driven CSS primitives already cover fade-in, hover, and transition, and a library conflicts with the PageSpeed 95+ budget recorded in BACKLOG. Parallax is not implemented.

**Inheritance trap.** TASK-034 established that `[data-surface="dark"]` redefines tokens but does not re-assert inherited `color`, and that any descendant using `bg-background` collapses invisibly into the surface. Every child of the dark hero, benefit strip, and social section is audited on that basis — not just the wrappers.

---

## 8. Regression guard extension

`tests/unit/no-bright-colors.test.ts` deliberately excludes the homepage from `SCAN_PATHS`, with this instruction:

> Within `src/app/(shop)`, only home / catalog / product / cart (`page.tsx` et al.) are deliberately NOT in this list — they're rebuilt by TASK-035 / 036 / 037 / 043 … **do not add the deferred (shop) page routes above without a corresponding cleanup task landing first.**

**TASK-035 is that task for home.** This task therefore:

1. Adds `src/app/(shop)/page.tsx`, `src/components/home`, and `src/content` to `SCAN_PATHS`
2. Rewrites the comment to move home from the deferred list to the covered list, leaving catalog / product / cart deferred with their owning tasks

Leaving this undone would let the homepage — the most visible page in the rebrand — remain the one page where a bright utility could be reintroduced without failing the build.

---

## 9. Testing

### 9.1 Automated

**Unit** (`tests/unit/`):

- `product-queries.ts` — bestseller status filtering (`PENDING`/`CANCELLED`/`REFUNDED` excluded), window filtering, quantity ordering, and the backfill path: thin history backfills from new arrivals, deduplicates, and reports the correct `source`.
- `WhyChooseUs` — gated claims **do not** render when config is unset, **and do** render when set. Both directions asserted; a test that only checks absence would pass against a component that renders nothing at all.
- `SocialLinks` — counters suppressed when `followers` is `null`, shown when a number is set.
- `AnnouncementBar` — hidden when `site.announcement` is `null`; dismissal persists.

**Guard**: extended `SCAN_PATHS` (§8). The existing non-vacuity assertion (`files.length` greater than zero) must continue to hold, and the new paths must demonstrably contribute files — a `SCAN_PATHS` entry pointing at a nonexistent directory should fail loudly rather than silently scan nothing.

**E2E** (`tests/e2e/`): homepage smoke — hero headline renders, both CTAs navigate to the right routes, sections present, announcement bar dismisses and stays dismissed across navigation.

**Gates**: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run format:check`, plus the existing 336 unit tests staying green.

### 9.2 Manual (per POLICIES/manual-testing.md)

- Hero renders correctly **with and without** `home.hero.image` set
- Dark sections legible — no black-on-black, no descendant collapsing into the surface (§7)
- Reduced-motion OS setting disables `<FadeIn>` reveals and hover lift
- Empty-data behavior: no featured products / no reviews / no orders each degrade to a coherent page
- Ukrainian characters and `₴` render without fallback in the announcement copy
- Mobile: announcement bar scrolls away, sticky header behaves, no overlay stacking with cookie consent

### 9.3 Acceptance-criteria mapping

| AC                                       | Satisfied by                                                    |
| ---------------------------------------- | --------------------------------------------------------------- |
| First screen: slogan, subtitle, two CTAs | §5.2 Hero                                                       |
| Benefit cards + "Why choose us"          | §5.3 BenefitStrip, §5.5 WhyChooseUs                             |
| Social section (IG/TikTok/Telegram)      | §5.7 SocialLinks                                                |
| Top announcement banner slot             | §5.1 AnnouncementBar                                            |
| Hero real photography (placeholder OK)   | §5.2 — additive photo slot, AI placeholder under guardrails     |
| Follower counters only if real           | §5.7 — `followers: null` default, counters gated on real values |

---

## 10. Spawned tasks

Two tasks are created from this design rather than absorbed into it.

**A. Content & legal pages.** The seven routes the footer links to do not exist. Three of them — public offer/terms, privacy policy, return policy — are named in the TASK-038b decision doc §5.3 as **gateway onboarding prerequisites**; LiqPay and monobank both require them before approving acquiring. They need client and legal copy that cannot be invented, so stub pages with placeholder text would be worse than none: a Privacy Policy with lorem text is a liability, not a placeholder. Scoped separately, carrying the payments dependency.

**B. Client content inventory.** Requirements for client-supplied content are currently scattered across BACKLOG "Content dependencies", WEEKLY "Preparation Needed", the payments §5.3 checklist, and now `src/content/`. This task consolidates them into one fill-in document the client can complete in a sitting: hero photography, logo vector, social URLs and real follower counts, the claim figures, announcement copy, contact details, size charts, and legal-page content. The `src/content/` modules are designed to make this enumerable — every client-owed value sits in one of two files with a provenance comment.

---

## 11. Scope boundaries

| ✅ In TASK-035                                    | ⏭️ Deferred (owning task)                 | 🚫 Out of scope                      |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| Homepage rebuild, all sections (§5)               | Product-card hover / quick-view → **036** | Ukrainian translation → **039**      |
| `src/content/` copy modules                       | Catalog page → **036**                    | Admin-managed banner → **047**       |
| `product-queries.ts` incl. bestseller definition  | Product page → **037**                    | Discount wheel (held pending client) |
| `OrderItem` `productId` index                     | Cart → **043**                            | Live follower-count APIs             |
| Footer copy, socials, benefit strip, link cleanup | Content/legal pages → **spawned A**       | Real photography (client-supplied)   |
| Colour-guard extension (§8)                       | Client asset chase → **spawned B**        | GSAP / parallax (§7)                 |
| Brief + concept screenshot into repo (§3)         |                                           | Homepage A/B testing                 |

---

## 12. Risks & mitigations

| Risk                                                    | Mitigation                                                                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Client rejects the AI hero image                        | Hero is designed complete without it (§5.2); removal is a one-line config change, not a redesign.                                              |
| Design files (Figma) arrive after this ships and differ | Token-driven components mean a re-skin, not a rebuild — the hedge TASK-034 was built for. Section structure follows the client's own concept.  |
| Bestseller rail looks arbitrary on a new store          | Explicit backfill with a reported `source` (§6.3); the rail never silently misrepresents new arrivals as bestsellers.                          |
| ISR change breaks Prisma/Neon behavior                  | Verified against a production build before keeping; reverts to `force-dynamic` with the decision recorded (§6.5).                              |
| Client claim figures go stale or are disputed           | Config-gated with provenance comment and date; never fed to structured data (§5.5).                                                            |
| Bright color reintroduced on the homepage later         | Guard extension (§8) makes the homepage fail the build, closing the last unguarded customer page.                                              |
| Homepage LCP regresses from the hero image              | `priority`, blur placeholder, explicit `sizes`; no animation library added (§7). PageSpeed budget enforcement itself is **TASK-040**.          |
| `src/content/` diverges from what TASK-039 expects      | Modules are plain typed objects with no logic — the shape any i18n library can consume. Structure reviewed against next-intl's message format. |

---

## 13. Open questions

None blocking. Two items resolve during implementation rather than design:

1. **ISR vs dynamic** (§6.5) — decided by measurement against a production build.
2. **Exact AI hero image** — generated during implementation, subject to the §5.2 guardrails and client sign-off before production.
