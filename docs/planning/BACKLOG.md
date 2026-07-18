# Backlog

Ideas and tasks not yet prioritized for active development.

**Last Updated**: 2026-07-18

---

## Overview

This is the holding area for:

- Feature ideas
- Enhancement suggestions
- Technical debt items
- Research topics
- "Someday/maybe" tasks
- **Marketing & advertising tasks** (require real business)

Items here are **not committed** — they're candidates for future TODO.md promotion.

---

## Marketing & Advertising (Requires Real Business)

These tasks from the advertising/promotion plan require a registered business, real products, or advertising budget.

### Google Advertising & Presence

| Task                   | Description                                | Requirements                                  | Value | Effort |
| ---------------------- | ------------------------------------------ | --------------------------------------------- | ----- | ------ |
| Google Ads Campaigns   | Set up PPC campaigns for product promotion | Business verification, ad budget              | High  | High   |
| Google Maps Listing    | Register business on Google Maps           | Real business address, verification           | High  | Low    |
| Google Merchant Center | Activate Google Shopping product listings  | Merchant Center account, product verification | High  | Med    |
| Google My Business     | Complete business profile setup            | Business registration documents               | Med   | Low    |

### Social Media Marketing

| Platform  | Tasks                                       | Requirements               | Value | Effort |
| --------- | ------------------------------------------- | -------------------------- | ----- | ------ |
| Instagram | Create business account, set up ads manager | Business verification      | High  | Med    |
| Facebook  | Create business page, configure ads         | Meta Business verification | High  | Med    |
| TikTok    | Create business account, set up TikTok Ads  | Business verification      | Med   | Med    |
| YouTube   | Create channel, upload product videos       | Content creation resources | Med   | High   |
| Telegram  | Create channel for promotions               | Content strategy           | Low   | Low    |

### Classifieds & Marketplaces

| Platform           | Description                             | Requirements                  | Value | Effort |
| ------------------ | --------------------------------------- | ----------------------------- | ----- | ------ |
| OLX Listings       | Post products on OLX marketplace        | Real products, seller account | Med   | Low    |
| Other Marketplaces | Expand to additional local marketplaces | Varies by platform            | Med   | Med    |

### Content Marketing

| Task                  | Description                              | Requirements                       | Value | Effort |
| --------------------- | ---------------------------------------- | ---------------------------------- | ----- | ------ |
| AI Video Content      | Create promotional videos with AI tools  | Video creation tools, brand assets | Med   | Med    |
| Blog/Content Strategy | SEO-focused content for organic traffic  | Content writer, keyword research   | Med   | High   |
| Email Marketing       | Set up email campaigns (Mailchimp, etc.) | Email list, campaign content       | High  | Med    |

### CRM Integration

| CRM Platform | Description                        | Value | Effort | Notes                                  |
| ------------ | ---------------------------------- | ----- | ------ | -------------------------------------- |
| HubSpot      | Free CRM with marketing automation | High  | Med    | Good for startups, free tier available |
| Pipedrive    | Sales-focused CRM                  | Med   | Med    | Better for sales pipelines             |
| Zoho CRM     | Full-featured affordable CRM       | Med   | Med    | Good value, many integrations          |
| Salesforce   | Enterprise CRM                     | Low   | High   | Overkill for small business            |

**Integration tasks when ready:**

- [ ] Choose CRM platform based on business needs
- [ ] Set up CRM account and configure pipelines
- [ ] Integrate customer data sync (new customers → CRM contacts)
- [ ] Connect order data to CRM deals/opportunities
- [ ] Set up automated workflows (abandoned cart, follow-ups)
- [ ] Configure email integration with CRM

---

## Post-MVP Features (Moved from TODO)

### [TASK-013] - Enhanced Features (Post-MVP)

**Priority**: Low
**Dependencies**: Deployment complete
**Moved from TODO**: 2026-01-22

**Description**: Additional features for future releases.

**Sub-tasks**:

- [x] Customer reviews and ratings → Completed as TASK-023
- [ ] Wishlist functionality
- [ ] Advanced search (Meilisearch)
- [ ] Product recommendations
- [ ] Discount codes and promotions

---

### [TASK-014] - Additional Integrations (Post-MVP)

**Priority**: Low
**Dependencies**: Deployment complete
**Moved from TODO**: 2026-01-22

**Description**: Additional third-party integrations.

**Sub-tasks**:

- [ ] Additional payment methods
- [ ] Multiple supplier API integrations
- [ ] Automated inventory sync
- [ ] Shipping rate calculators

---

### [TASK-015] - Growth Features (Post-MVP)

**Priority**: Low
**Dependencies**: Enhanced Features
**Moved from TODO**: 2026-01-22

**Description**: Features for scaling the business.

**Sub-tasks**:

- [ ] Multi-currency support
- [ ] Internationalization (i18n)
- [ ] Customer loyalty program
- [x] Email marketing integration → Completed as TASK-024
- [ ] Analytics dashboard

---

## Deferred Tasks (Moved from TODO)

### Manual Testing Plan

**Moved from TODO**: 2026-01-22
**Reason**: Deprioritized in favor of marketing preparation tasks

- [ ] Develop comprehensive manual testing plan for the website

---

## Feature Ideas

### Authentication & Security

| Idea                   | Description                                                     | Value | Effort | Source                  |
| ---------------------- | --------------------------------------------------------------- | ----- | ------ | ----------------------- |
| Email verification     | Verify user email addresses before allowing full account access | High  | Med    | Phase 5.4 deployment    |
| Password reset         | Allow users to reset forgotten passwords via email              | High  | Med    | Phase 5.4 deployment    |
| OAuth providers        | Add Google, GitHub, etc. social login options                   | Med   | Med    | Phase 5.4 deployment    |
| Rate limiting          | Protect auth endpoints from brute force attacks                 | High  | Med    | Phase 5.4 deployment    |
| Session timeout        | Configure explicit session expiration (24h recommended)         | Med   | Low    | Phase 5.4 deployment    |
| 2FA/MFA support        | Two-factor authentication for enhanced security                 | Med   | High   | Security best practices |
| Login attempt tracking | Track failed logins, implement account lockout                  | Med   | Med    | Security best practices |

### User Experience

| Idea                          | Description                                   | Value | Effort | Source               |
| ----------------------------- | --------------------------------------------- | ----- | ------ | -------------------- |
| Cart operation error handling | Show toast notifications for cart errors      | Med   | Low    | Phase 5.4 deployment |
| Better network error messages | Distinguish network errors from server errors | Low   | Low    | Phase 5.4 deployment |

---

## Enhancements

Improvements to existing functionality.

| Enhancement                           | Area           | Value | Effort | Notes                                    |
| ------------------------------------- | -------------- | ----- | ------ | ---------------------------------------- |
| Standardize toast usage               | UI             | Med   | Low    | Use Sonner consistently across all forms |
| Add loading states to cart operations | Cart           | Med   | Low    | Prevent double-clicks, show feedback     |
| Improve error boundary UI             | Error handling | Low   | Low    | More helpful error pages                 |

### [2026-01-22] From: TASK-017 SEO Technical Setup

**Origin**: docs/archive/plans/2026-01-22_seo-technical-setup.md

- [ ] Replace placeholder SEO assets with branded images — OG image, favicons are simple placeholders
- [ ] Add dynamic OG image generation — Use `opengraph-image.tsx` for product-specific social images
- [ ] Add category metaTitle/metaDesc fields — Similar to Product model, for category SEO
- [ ] Implement proper i18n with hreflang — Current setup is preparation only (`en`)

### [2026-02-01] From: TASK-018 Analytics Integration

**Origin**: docs/archive/plans/2026-02-01_analytics-integration.md

- [ ] Extract hardcoded `"USD"` currency to `NEXT_PUBLIC_CURRENCY` env var for multi-currency support
- [ ] Add additional e-commerce events: `remove_from_cart`, `view_promotion`, `select_promotion`
- [ ] Implement GA4 Measurement Protocol for server-side purchase validation
- [ ] Build admin analytics dashboard showing conversion funnel from GTM data

### [2026-02-02] From: TASK-020 Google Shopping Feed Preparation

**Origin**: TASK-020 implementation on feat/task-020-google-shopping-feed branch

- [ ] Seed demo products with brand/barcode/MPN data to test feed with realistic content
- [ ] Validate feed output with Google Merchant Center feed validation tool
- [ ] Add additional feed formats (Facebook Catalog, Pinterest) if needed — current architecture is easy to extend
- [ ] Add `google_product_category` field mapping to Google's product taxonomy
- [x] Add cross-field validation for comparePrice > price in admin ProductForm → Completed in TASK-029

### [2026-02-02] From: TASK-019 Social Sharing Enhancement

**Origin**: docs/archive/plans/2026-02-02_task-019-social-sharing.md

- [ ] Add dynamic OG images for category pages — branded images with category name and product count
- [ ] Add share count tracking/display — track shares per platform, optionally show social proof
- [ ] Add email sharing option — `mailto:` link with pre-filled subject and body
- [ ] Preview OG images in admin panel — show social preview on product edit page
- [ ] Replace site-level placeholder OG image — products now have dynamic OG, but default is still placeholder

### [2026-02-04] From: TASK-026 Fix Vercel Deploy in CI

**Origin**: docs/archive/plans/2026-02-04_task-026-fix-vercel-deploy-ci.md

- [ ] Add Vercel deploy preview on PRs — deploy preview for pull requests (separate from production deploy on main)
- [ ] Add deploy status badge to README.md — workflow status badge for deployment visibility
- [ ] Implement Slack/Discord notifications in deploy notify job — currently just echo, add real delivery
- [ ] Add explicit default for `deployed` job output when validation skips — currently relies on bash `[ "" = "true" ]` evaluating false; an explicit `deployed: "false"` output in the skip path would be clearer
- [ ] Refine notify job `if` condition to skip when both deploy jobs are skipped — `if: always()` runs even when neither deploy path triggers; could use `needs.deploy-vercel.result != 'skipped' || needs.deploy-vps.result != 'skipped'`

### [2026-02-05] From: TASK-023 Customer Feedback & Review System

**Origin**: feat/task-023-customer-reviews branch

- [x] Extract shared Review interfaces to `src/types/index.ts` — duplicated across ReviewList, ReviewItem, ReviewSection, admin page → Completed in TASK-029
- [x] Add unit tests for review API routes — create, eligibility, admin reply, visibility toggle → Completed as TASK-028
- [ ] Add E2E tests for review submission flow — verified purchase review lifecycle
- [ ] Add review sorting options (newest, highest rated, most helpful) to public reviews list
- [ ] Add database-level CHECK constraint for rating 1-5 — defense in depth beyond Zod validation
- [ ] Seed demo reviews for products in `prisma/seed.ts` — enables testing and demo presentation
- [x] Merge `getReviewsJsonLd()` into `getProductJsonLd()` — currently two separate `@type: Product` JSON-LD schemas on product pages → Completed in TASK-029
- [x] Validate `parseInt()` result for rating query params in review API routes — `parseInt('abc', 10)` returns `NaN` → Completed in TASK-029

### [2026-02-05] From: TASK-024 Email Newsletter Subscription

**Origin**: feat/task-024-email-newsletter branch

- [ ] Document integration with email marketing platforms (Mailchimp, SendGrid, etc.) — deferred from original task scope
- [x] Add unit tests for newsletter API routes — subscribe, confirm, unsubscribe, admin endpoints → Completed as TASK-028
- [ ] Add E2E tests for newsletter subscription flow — signup, confirm email, unsubscribe
- [ ] Add bulk actions to admin newsletter page — bulk delete, bulk status change
- [ ] Add subscriber analytics to admin — signup rate over time, confirmation rate, churn rate
- [ ] Add rate limiting on subscribe endpoint — prevent email bombing/abuse
- [ ] Implement streaming CSV export for large subscriber lists — current implementation loads all records into memory; use `ReadableStream` with chunked Prisma queries for scalability
- [ ] Add GA4 analytics events for newsletter actions — `newsletter_subscribe`, `newsletter_confirm`, `newsletter_unsubscribe` events following established dataLayer pattern in `analytics.ts`

### [2026-02-04] From: TASK-025 Fix E2E Test Infrastructure

**Origin**: TASK-025 implementation on feat/task-025-fix-e2e-tests branch

- [ ] Migrate `package.json#prisma.seed` to `prisma.config.ts` — deprecated in Prisma 7 (currently on 6.x)
- [ ] Add per-worker database isolation for E2E tests — use `$TEST_WORKER_INDEX` for parallel test isolation
- [ ] Add error handling in `tests/global-setup.ts` for Prisma connection failures — currently throws raw Prisma errors; wrap with user-friendly message suggesting `docker-compose up -d` or checking DATABASE_URL
- [ ] Add E2E test coverage for checkout and auth flows — current navigation.spec.ts only covers storefront browsing and category navigation

### [2026-02-10] From: TASK-030 Documentation Finalization

**Origin**: docs/archive/plans/2026-02-10_task-030-documentation-finalization.md

- [ ] Automated doc freshness check — Script to compare doc "Last Updated" dates with git file timestamps to identify stale documentation
- [ ] API docs generation — Auto-generate endpoints.md from route files or OpenAPI spec to prevent docs drifting from code
- [ ] Schema docs generation — Auto-generate schema.md from prisma/schema.prisma to keep database docs in sync
- [ ] Link checker in CI — Add CI step to validate internal doc links are not broken after documentation changes
- [ ] Repo file reference validation — Verify that documentation references to actual repo files (e.g., `next.config.mjs` in PROJECT.md) match real filenames; caught `next.config.ts` typo in TASK-030 code review

### [2026-02-11] From: TASK-031 Code Quality Sweep

**Origin**: feat/task-031-code-quality-sweep branch

- [ ] Implement tax calculation in checkout confirm-order route — currently hardcoded to `0` in `src/app/api/checkout/confirm-order/route.ts`
- [ ] Queue supplier order creation after checkout — integrate BullMQ job dispatch in confirm-order route for automated supplier forwarding

### [2026-02-10] From: TASK-029 Technical Debt Cleanup

**Origin**: feat/task-029-technical-debt-cleanup branch

- [ ] Add structured logging library (e.g., pino/winston) to replace removed console.error — API routes now silently catch errors; production needs observability
- [ ] Add comparePrice cross-field validation to admin product PUT route — currently `productBaseSchema.partial()` skips the `.refine()` check; partial updates could set invalid comparePrice
- [ ] Add E2E test for comparePrice validation in admin ProductForm — client-side validation added but not tested end-to-end

**Origin**: feat/task-028-test-coverage branch

- [ ] Add integration tests for review/newsletter flows with real database — current tests mock Prisma; integration tests would catch ORM misuse
- [ ] Fix `getPagination()` NaN propagation — `parseInt("abc")` returns NaN which passes through `Math.max(1, NaN)`; should default to safe values
- [ ] Add unit tests for remaining untested API routes — products CRUD, categories CRUD, orders, checkout endpoints
- [ ] Test Prisma P2002 unique constraint error handling in subscribe route — `instanceof` check can't be properly unit tested with mocks; needs integration test
- [ ] Fix P2002 test in `reviews-api.test.ts` — currently asserts status 500 (generic catch) instead of 409 (P2002 handler) because mock error fails `instanceof` check; convert to `it.todo()` or use proper `PrismaClientKnownRequestError` instantiation

### [2026-02-09] From: TASK-027 Dependency Audit & Security Patches

**Origin**: docs/archive/plans/2026-02-09_task-027-dependency-audit.md

- [ ] Upgrade Next.js 14 → 16 + React 18 → 19 — Required to fix 2 HIGH security vulnerabilities (DoS via Image Optimizer, HTTP deserialization). Major effort (~1-2 days) due to breaking changes.
- [ ] Migrate Prisma 6 → 7 — Follow major version upgrade guide. Includes migrating `prisma.seed` from `package.json` to `prisma.config.ts`.
- [ ] Add automated dependency monitoring (Dependabot or Renovate) — Automated PR creation for dependency updates to catch vulnerabilities early.

### [2026-02-12] From: Code Review of TASK-032

**Origin**: PR #15 code review

- [ ] Verify DONE.md statistics table accuracy — February task count (13) may undercount actual entries; audit all `### [2026-02-xx]` headings and reconcile with statistics row
- [ ] Use precise test counts in planning docs — TASK-032 DONE.md entry uses "245+" while actual count is 246; prefer exact numbers from `npm run test:run` output in completion records

### [2026-02-09] From: Code Review of TASK-027

**Origin**: PR #10 code review

- [ ] Clarify branch naming convention in CLAUDE.md — currently only documents `feat/task-NNN-description` pattern; should specify whether `chore/`, `fix/` prefixes are valid for non-feature branches
- [ ] Distinguish package.json vs lockfile updates in dependency audit docs — plan docs list all 30 packages as "updated" without clarifying 28 were lockfile-only resolutions within existing semver ranges; future audits should separate explicit version bumps from `npm update` lockfile resolutions

### [2026-02-06] From: TASK-022 Demo Content Enhancement

**Origin**: Code review of feat/task-022-demo-content-enhancement branch

- [x] Simplify type assertions in subscriber seeding — replace `"prop" in s ? (s as { prop: T }).prop : null` with optional chaining → Completed in TASK-029
- [ ] Add DELIVERED status validation in review seeding — add runtime check `if (orderData.status !== 'DELIVERED')` before creating reviews to enforce eligibility pattern programmatically
- [ ] Standardize user upsert patterns — admin uses `update: {}` while customers use `update: { name }` without password; make consistent (either both update all fields or both update none)

### [2026-07-15] From: Client Improvement List #2 (user-raised)

Client's 20-item improvement list, mapped against the Mirox program spec. 15/20 already covered by planned tasks (see enrichment notes); genuinely new items below.

- **Floating support buttons**: site-wide floating Instagram / Telegram / manager-chat buttons. Small, v1.3/v1.4 candidate. (Med value, S effort)
- **Discount wheel popup** (5–15% after 15s on site): ⚠️ **held pending client confirmation — do not promote without it.** Claude's recorded doubts (2026-07-15):
  1. _Brand contradiction_: the client's own brief mandates "premium, minimal, looks more expensive than most Ukrainian shops"; spin-to-win popups are a discount-store pattern and undermine exactly the trust/prestige the rebrand is buying. The two goals conflict; the client must pick.
  2. _UX cost_: an interrupting popup 15s into the first session harms the "buy within 10 seconds" goal from the same brief, hurts Core Web Vitals interaction metrics, and on mobile competes with the cookie-consent banner (two overlays stacking).
  3. _Margin math unmodeled_: an automatic 5–15% giveaway to every visitor needs margin analysis first — nobody has defined who absorbs it.
  4. _Hard dependency_: requires promo-code backend [TASK-046] (single-use code generation, expiry) — cannot ship before v1.4 regardless.
  5. _If the client insists after seeing 1–3_: build the restrained variant — trigger on exit-intent or second visit (not a 15s timer), once per user (localStorage + cookie), never over the consent banner, monochrome styling per design system, honest odds disclosed. (Value questionable, M effort)
- **Guest order tracking**: track order by order number + phone. Privacy constraint: never lookup by phone alone (order enumeration risk) — require order#+phone pair or OTP. v1.4/v2.0 candidate, Track B. (High value, M effort)
- **Top announcement banner** (free shipping / promos): static version folds into [TASK-035]; admin-managed version belongs to [TASK-047]. (Med value, S effort)
- **Content dependencies — client-supplied assets (blocking, not code)**: Claude's recorded notes (2026-07-15): several accepted items cannot be finished with code alone, and placeholders directly contradict the "premium" goal (client list #2 item 14 complains about SVG placeholders — the fix is their assets, not our markup). Required from client, ideally before TASK-035 starts: (a) hero model photography in Mirox clothing, high-res, dark-background per concept screenshot; (b) real customer photos w/ consent for the gallery + review photos [TASK-044]; (c) final logo files (vector); (d) real social follower counts or API access — fabricated counters are out, same principle as [TASK-051] social proof; (e) per-product size charts for the size table [TASK-037] and size assistant [TASK-045]; (f) Figma design files (promised, still pending). Each missing asset degrades its feature to placeholder state; track chasing in WEEKLY Preparation. (Blocking dependency, zero code effort)
- **Enrichments to already-planned tasks** (apply when promoting each): TASK-041 wishlist → header counter, heart animation, add-toast; TASK-042 search → explicit typo tolerance; TASK-043 → restyle existing CartDrawer; TASK-044 reviews → delivery-time field, gallery needs real client photos; TASK-034 → animation library decision must respect PageSpeed-95+ budget (client suggested GSAP); TASK-051 unchanged (real-data-only stands). Items 1,3–6,9,10,12,14–20 tagged `[covered-by: TASK-034..053]` — no separate entries.

### [2026-07-15] From: TASK-033 Post-Merge Verification

- [x] ~~**Add `sharp` dependency**: CI E2E web-server logs flood with `'sharp' is required to be installed in standalone mode`; `sharp` is absent from package.json. Vercel production unaffected (own image service), but `next/image` optimization is broken on the self-hosted/VPS deploy path and the noise can bury real E2E errors. Fix: `npm install sharp` + one validation run. (Med value, Low effort)~~ — **RESOLVED in TASK-038a.** `sharp ^0.35.3` added to `dependencies` (not `devDependencies` — `next.config.mjs` sets `output: "standalone"`, which needs it at serve time). Verified: native binary loads, build succeeds, standalone-mode warning no longer appears in E2E web-server logs.
- **Actions Deploy-to-Vercel job is a validated no-op**: with Vercel secrets unset in GitHub, the job runs only "Validate Vercel configuration" and reports green; actual production deploys come from the Vercel Git integration. A green "Deploy" badge without the integration would ship nothing. Either document this as the intended setup or wire the secrets; fold into [TASK-040] CI extensions. (Med value, Low effort) `[relates-to: TASK-040]`

### [2026-07-14] From: TASK-033 Completion

- [x] ~~**Gitignore Playwright artifacts**: `playwright-report/` and `test-results/` are git-tracked generated outputs; every local E2E run dirties the tree (observed throughout TASK-033). Add both to `.gitignore` and remove from tracking.~~ — **RESOLVED 2026-07-18.** Both directories added to `.gitignore` and untracked via `git rm -r --cached` (9 + 1 files); local copies preserved on disk. `.prettierignore` already covered them since `b91b332` (entry below). (Med value, Low effort)
- **`.env` hygiene**: deduplicate the two `DATABASE_URL` keys (second points at a live-looking Neon DB alongside Vercel tokens); confirm rotation with owner. Note: `.env` is gitignored and never committed — local-file hygiene, not repo exposure. (High value, Low effort)
- [x] ~~**Add `.superpowers/` to `.prettierignore`**: session scratch files trip `npm run format:check` locally.~~ — **RESOLVED in TASK-038a.** Commit b91b332 added `.superpowers`, `playwright-report`, and `test-results` to `.prettierignore`; `npm run format:check` passes locally again. (Low value, Low effort)
- **CLAUDE.md E2E docs scope**: testing docs list only `navigation.spec.ts`; `cart.spec.ts` and `products.spec.ts` exist. Correct at next CLAUDE.md refresh. (Low value, Low effort)

### [2026-07-14] From: TASK-033 Resumption Audit

**Origin**: docs/planning/plans/2026-07-14_task-033-resumption.md (Task 2 security & dependency audit, feat/task-033-resumption branch)

- [ ] Upgrade Next.js 14 → 16 to clear 14 HIGH advisories against `next@14.2.35` — npm audit fix requires `next@16.2.10` (breaking); advisories include DoS via Image Optimizer (GHSA-9g9p-9gw9-jx7f), HTTP request smuggling in rewrites (GHSA-ggv3-7p47-pfv8), middleware/proxy redirect cache poisoning (GHSA-3g8h-86w9-wvmq), XSS via CSP nonces (GHSA-ffhc-5mcf-pf4q), RSC cache poisoning (GHSA-wfc6-r584-vfw7), SSRF via WebSocket upgrades (GHSA-c4j6-fc7j-m34r), plus 8 further DoS/XSS/cache advisories. Also clears the nested MODERATE `postcss <8.5.10` XSS (GHSA-qx2v-qp2m-jg93) bundled inside `node_modules/next`. Deferred per conservative-update policy (Next.js 14 / React 18 pinned). `[possible-dup-of: [2026-02-09] From: TASK-027 "Upgrade Next.js 14 → 16 + React 18 → 19" — that entry predates most of these advisories; reconcile on promotion]`
- [ ] Monitor @auth/core / next-auth for a release depending on `nodemailer >= 9.0.1` — 6 HIGH nodemailer advisories (SMTP command injection GHSA-c7w3-x93f-qmm8, CRLF injection GHSA-vvjj-xcjg-gr5g and GHSA-268h-hp4c-crq3, file-access bypasses GHSA-wqvq-jvpq-h66f and GHSA-p6gq-j5cr-w38f, TLS validation GHSA-r7g4-qg5f-qqm2) are fixed only in nodemailer 9.0.1+, but `@auth/core@0.41.2` (via `next-auth@5.0.0-beta.31` and `@auth/prisma-adapter@2.11.2`) pins `nodemailer@^7` — no non-breaking fix exists (npm's only "fix" is a downgrade to next-auth@1.x). Practical exposure is low: transactional email goes through Resend (`src/lib/email.ts`); no next-auth email/SMTP provider is configured, so nodemailer is never invoked. Re-run `npm audit` when next-auth v5 GA or a new @auth/core lands.
- [x] ~~Fix WebKit/Mobile Safari-only E2E failure in `tests/e2e/products.spec.ts` ("can filter products by search")~~ — **RESOLVED in TASK-038a.** Originally logged as a "pre-existing product bug" traced to the `handleSearch`/`updateFilters` flow in `src/app/(shop)/products/products-content.tsx`; that claim was **disproved by evidence** and is incorrect — the product code is correct and was never modified. Actual cause: a **test artifact**. The test called `searchInput.fill()` gated only on `isVisible()` (paint), not interactivity. On WebKit engines only, a programmatic `fill()` issued before React hydration produces an `input` event that never reaches React, so `search` state stays `""`; `handleSearch` then calls `updateFilters({ search: "" || null })`, whose falsy branch correctly deletes the (never-set) `search` key, producing `/products?page=1`. Chromium/Firefox/Mobile Chrome don't exhibit this because their pre-hydration synthetic `input` event is still observed by React; confirmed via CPU-throttled Chromium staying un-hydrated yet still passing, and via real (non-programmatic) typing on WebKit passing at all speeds — ruling out a timing race in the product code. Fix: `tests/e2e/products.spec.ts` now waits for `[data-testid='product-card']` (a hydration-only render signal — cards appear from a client-side `fetchProducts` effect that only runs post-hydration) before touching the search input. Verified: 3/3 pass on `webkit` with `--repeat-each=3`, pass on `Mobile Safari`, and reproducibly fails with the old `TimeoutError: page.waitForURL` on `webkit` when the fix is reverted (confirming the test still has teeth). No `src/` changes.
- [ ] Reconcile stale seed-count documentation — CLAUDE.md and older docs state "16 categories, 50+ products," but `prisma/seed-data/categories.ts` / `products.ts` currently define 15 categories / 21 products (seed output matches the seed files exactly; the seed pipeline itself is not broken, only the documented counts are stale). `[possible-dup-of: 2026-02-12 Code Review of TASK-032 entry]`

### [2026-07-16] From: TASK-038a

**Origin**: TASK-038a prework (feat/task-038a-prework branch) — diagnosing the WebKit search-filter E2E failure surfaced these adjacent findings. All 🟤 Auto-Generated (Claude-surfaced during investigation/verification, not user-raised).

- 🟤 **Other E2E tests share the same interact-before-interactive defect this task just fixed** — the WebKit search bug (`tests/e2e/products.spec.ts`) was a Playwright interaction landing before React hydration/re-render settled. The same causal mechanism is present, unexercised, and not currently reported flaky in: `tests/e2e/products.spec.ts` "can sort products" (clicks a Radix `combobox` that triggers `router.push`, no hydration wait); `tests/e2e/cart.spec.ts` "can update quantity in cart" and "can remove item from cart" (each waits for `[data-testid='product-card']` on `/products`, but then navigates to the product detail page and again to `/cart` with no further readiness signal before interacting there; "can update quantity in cart" already uses `page.waitForTimeout(500)` at line 91 — the exact anti-pattern this task replaced with a real readiness signal); `tests/e2e/navigation.spec.ts` "mobile menu works on small screens" (clicks a menu toggle button with no hydration wait). Consider applying the same `[data-testid='product-card']`-style hydration-signal wait pattern. (Med value, Low effort)
- 🟤 **`[chromium] navigation.spec.ts "can navigate to categories page"` is an intermittent dev-server cold-compile flake** — reproduced locally ~2/3 runs in isolation during TASK-038a verification; unrelated to any source change (navigation.spec.ts is byte-identical to main, `src/` untouched on this branch). CI runs a prebuilt `npm start`, not `next dev`, so exposure there is low but nonzero. (Low value, Low effort)
- 🟤 **`page.route`-based deterministic race testing is a reusable E2E pattern worth adopting more broadly** — delaying `**/api/products*` via `page.route` converted a WebKit-only timing flake into a reproducible, engine-independent experiment (proved the fill/hydration race directly rather than guessing from symptoms). Worth documenting as the default technique for diagnosing "works most of the time" E2E failures instead of ad hoc `waitForTimeout` tuning. (Med value, Low effort)
- 🟤 **`sharp`'s `@img/*` platform binaries declare `engines.node >= 20.9.0`; the project has no top-level `engines` field** — verified in `package-lock.json` (e.g. `@img/sharp-linux-x64@0.35.3` → `"engines": {"node": ">=20.9.0"}`). CI pins `NODE_VERSION: "20"` (resolves to a recent 20.x via `actions/setup-node`), so this isn't live today, but the new implicit Node floor from adding `sharp` (TASK-038a) is undocumented — a future local/VPS install on an older Node 20.x could fail silently on install. Add a top-level `"engines": {"node": ">=20.9.0"}` to `package.json`, or document the floor. (Low value, Low effort)
- 🟤 **CI runs `workers: 1`, so every added Playwright project costs a full serial pass** — adding `webkit` to the matrix in this task roughly doubles E2E wall-clock (chromium + webkit both run full-serial instead of in parallel). TASK-040 (CI extensions) is expected to broaden the matrix further (Lighthouse, preview deploys); parallelising Playwright workers or sharding by project should be evaluated before then to keep CI time bounded. (Med value, Med effort) `[relates-to: TASK-040]`
- 🟤 **Audit remaining BACKLOG entries for other unverified root-cause claims** — `:361` asserted a product bug without evidence, and that assertion shaped planning until TASK-038a disproved it. Other entries may carry similarly unverified root-cause claims that could misdirect future work; worth a pass to confirm each cited root cause is backed by evidence rather than assumption. (Med value, Med effort)
- 🟤 **`CLAUDE.md`'s `<!-- AUTO-MANAGED -->` sections have no regeneration story** — TASK-038a's PR review found two claims inside AUTO-MANAGED blocks ("chromium-only in CI" at `CLAUDE.md:253` and `:297`) falsified by that same PR's `ci.yml` change. The marker implies something regenerates these sections, but a repo-wide grep for `AUTO-MANAGED` across scripts/config finds **nothing that does** — so in practice they are hand-maintained by default and simply rot, while the marker discourages hand-editing. The two stale claims were corrected by hand in TASK-038a, but the underlying ownership question will keep recurring on every PR that changes build/CI/architecture facts. Decide: either wire up an actual regeneration step (e.g. `/init`-driven), or drop the AUTO-MANAGED markers so the sections are honestly hand-maintained and reviewers treat drift as a normal defect. (Med value, Low effort)

### [2026-07-17] From: TASK-038b Completion

**Origin**: docs/archive/plans/2026-07-16_task-038b-payments-delivery-spike.md — improvements extracted at completion. Client-facing prerequisites live in WEEKLY Preparation; these are the engineering/process follow-ups.

- 🟤 **Close the classic Nova Poshta status-webhook question** — unresolved because `developers.novaposhta.ua` is Cloudflare-blocked (403/530) from our network, and a keyless probe returns an identical `User is undefined` error for a known-fake method as for the claimed `subscribeToStatusUpdate` (auth gates before method resolution), so it cannot distinguish "absent" from "needs a key". **Gates TASK-049's polling design**; decision doc §6.6 says plan for polling and treat push as upside. Needs a human on an unblocked network, or the client's NP account. (High value, Low effort) `[relates-to: TASK-049]`
- 🟤 **Obtain sales quotes for the shortlisted gateways** — every §4 figure is the _published_ tariff, and all four viable candidates reserve individual pricing (LiqPay states the commission is set per merchant/MCC on contract; WayForPay "set individually depending on your turnover"; Portmone custom above ~500k UAH/month). The recommendation's economics are therefore indicative. Get written quotes once the legal entity is known. (Med value, Low effort) `[relates-to: TASK-048]`
- 🟤 **Re-evaluate Fondy only on written proof of a licensed route** — disqualified on the NBU register showing ТОВ «ФК "ЕЛАЄНС"» licence 21/778-рк revoked 2024-07-22. A secondary source claims Fondy "resumed under partner-bank licences"; it could not be confirmed from any primary source and was not relied on. If the client produces written evidence, that outranks the decision doc and Fondy returns to the matrix — otherwise do not plan TASK-048 against it. (Low value, Low effort) `[relates-to: TASK-048]`
- 🟤 **Verify Fondy/NP facts from an unblocked network** — `fondy.ua` is TCP-unreachable and `developers.novaposhta.ua` is Cloudflare-blocked from this environment. This shaped what could be verified: Fondy's eight ❓ claims are a _research_ limitation, not a fact about the service. Anyone on a different network can close those gaps. Also the root cause of the spike's worst research defect — pages cited but never loaded. (Med value, Low effort)
- 🟤 **Fold `docs/README.md` indexing into the authoring task, not the completion task** — index drift has now recurred across **three consecutive PRs** (#16 `04a2593`, #17 `3207425`, #18 deferred to Task 8). The common cause is structural, not carelessness: indexing is scheduled in a completion step that runs _after_ review, so every review sees an un-indexed tree and the gap is either flagged as a finding or deferred again. Move "index new docs in docs/README.md" into the task that creates the doc. (Med value, Low effort)
- 🟤 **Two stale plan links in `DONE.md` (`:245`, `:425`)** — both point to `docs/plans/2026-01-05_dropshipping-mvp-plan.md`, but that plan was archived to `docs/archive/plans/` and `docs/plans/` now holds only a README. Pre-existing (predates TASK-038b; found by a link-resolution check during this completion, left unfixed to keep the completion commit scoped). Same class as the `docs/README.md` drift above: an archive move that didn't update its referrers. (Low value, Low effort)
- 🟤 **Adopt "fan out per topic, not per item" as the default workflow shape** — see the OOM group below; the per-claim fan-out (~120 agents) both caused the crashes and produced _worse_ output than the 3 per-topic foreground agents that replaced it, which caught cross-claim issues a per-claim agent structurally cannot see (e.g. Fondy's revoked licence invalidating eight sibling claims at once). Worth writing into the workflow-authoring defaults. (Med value, Low effort)

### [2026-07-17] From: TASK-038b workflow crashes — devcontainer OOM investigation

**Origin**: TASK-038b research spike (feat/task-038b-payments-delivery-research). The Ultracode research workflow died three times mid-run; user asked for an investigation. Phase 1 of superpowers:systematic-debugging completed in-session — root cause identified, **not yet confirmed by repro**. Nothing here is fixed.

- 🔵 **Devcontainer is OOM-killed during Workflow fan-out — confirmed OOM, unconfirmed as the cause of all three crashes.** User-raised (2026-07-17): "these docker crashes… always related to the launch of a workflow."

  **Confirmed evidence** (read from inside the container, 2026-07-17):
  - `/sys/fs/cgroup/memory.events` → **`oom_kill 1`**, `oom 0`. A process **was** killed by the kernel OOM killer, but _not_ for exceeding a cgroup limit.
  - `memory.max` = `max` — **Docker imposes no memory cap**; the real ceiling is the WSL2 VM's RAM.
  - `memory.peak` = **8.45 GiB** vs `MemTotal` **9.7 GiB** (persisted since boot; uptime 1d 3h, no reboot).
  - Swap 4 GiB total with **2.4 GiB already consumed at rest**; `Committed_AS` 8.5 GiB of `CommitLimit` 8.9 GiB — **96% committed while idle**.
  - `nproc` = 16 → Workflow concurrency cap is `min(16, nproc-2)` = **14 concurrent agents**.
  - At-rest baseline ≈ 2.7 GiB: VS Code server ~630 MB, Claude extension ~405 MB, ~15 node procs / a dozen MCP servers ~600 MB.

  **Mechanism (hypothesis):** 14 concurrent agents, each holding a full LLM context plus WebFetch payloads (the 3 foreground agents used 116k/133k/130k tokens each), stacked on a 2.7 GiB floor, reach the 9.7 GiB ceiling → **global** OOM killer picks a victim → process tree dies → workflow leaves no completion record. Fits every observation: only ever on workflow launch; 3 foreground agents were stable; every resume died at the same point; MCP servers disconnect/reconnect around each crash.

  **Not proven:** `oom_kill` reads only **1** against ~3 deaths. Either the others weren't OOM (see the rate-limit entry below) or their counters died with their cgroups. Checked to `maxdepth 3`; counter found only at the root cgroup.

  **To confirm** (do in a **separate session** — reproducing may kill the session doing the observing; all TASK-038b work is committed so a crash costs only context): reset `memory.peak`, then sample every 2 s while launching a workflow —

  ```bash
  while true; do
    printf '%s cur=%sMB peak=%sMB swap=%sMB %s\n' "$(date +%T)" \
      $(( $(cat /sys/fs/cgroup/memory.current) / 1048576 )) \
      $(( $(cat /sys/fs/cgroup/memory.peak) / 1048576 )) \
      $(( $(cat /sys/fs/cgroup/memory.swap.current) / 1048576 )) \
      "$(grep '^oom_kill ' /sys/fs/cgroup/memory.events)"
    sleep 2
  done | tee /tmp/oom-watch.log
  ```

  Confirmed iff `cur` climbs toward ~9 GiB as agents spawn **and** `oom_kill` increments at the moment of death.

  **Host-side check (invisible from inside the container):** `%USERPROFILE%\.wslconfig` on Windows — 9.7 GiB implies either a ~20 GB host or an explicit cap. `[wsl2] memory=…` / `swap=…`.

  **Candidate levers, to test only after the repro confirms** — cheapest first: (a) raise the WSL2 memory cap if the host has headroom; (b) shed unused MCP servers (see below); (c) set an explicit container memory limit so the OOM killer targets the container predictably instead of the global killer choosing an arbitrary victim; (d) narrow workflow fan-out (see below). (High value, Med effort)

- 🔵 **Rate limiting is a second, distinct failure mode — do not conflate with OOM.** User-raised (2026-07-17): the _first_ crash was Claude API rate limits, and separately, rate-limited requests occurred **outside Docker** when search auto-confirmation was enabled (this session confirmed each request manually and saw no rate limiting). Two different causes with one symptom ("the workflow stopped"); an OOM fix will not address the rate-limit path, and vice versa. Any future triage should first read `memory.events`/`oom_kill` to tell them apart. (Med value, Low effort) `[relates-to: the OOM entry above]`

- 🟤 **Workflow fan-out width is a design choice that was made badly in TASK-038b** — the research workflow spawned **one agent per claim** (~120 agents, 14 concurrent). The foreground recovery pass did the _same verification work_ with **one agent per topic** — 3 agents, no crash, and arguably better output (each agent saw its whole topic and caught cross-claim issues like Fondy's licence invalidating eight sibling claims at once). Claude-surfaced: the fan-out width was my choice, not a constraint of the tool, and a per-topic design would likely have avoided the crash entirely. Worth a documented default: **fan out per topic, not per claim**, and treat per-item fan-out as needing justification. (Med value, Low effort)

- 🟤 **Workflow resume replays the head instead of advancing the tail** — across three `resumeFromRunId` attempts, verdict count climbed 80 → 93 → 126 while **actual claim coverage stayed frozen at 81/120**. Resumes re-dispatched topics in original order, burning the concurrency budget re-verifying already-done LiqPay/WayForPay claims, and died (OOM) before reaching Fondy and Plata by mono — which ended with **zero** verification across all three runs. The raw verdict count looked reassuring and was misleading; only a topic×field join against the journal revealed the gap. Two lessons: (a) in a crash-prone environment, resume is not a reliable way to finish a fan-out — target the _missing_ work directly; (b) **verify coverage by joining results to inputs, never by counting results**. (Med value, Med effort)

- 🟤 **A dozen unused MCP servers consume baseline memory in every session** — Canva, Figma, Gamma, Hugging Face, Notion, PDF Viewer, Play Sheet Music, Three.js, Chrome DevTools, Playwright, context7, github, memory are all loaded (~15 node procs, ~600 MB RSS combined, ~211 deferred tools). None of the first eight are used by this repo. This is pure headroom against the OOM ceiling above, and also churns the tool list on every reconnect. Prune the connector set for this project. (Med value, Low effort) `[relates-to: the OOM entry above]`

### [2026-07-18] From: TASK-034 Task 12 (Final Verification & Docs)

**Origin**: feat/task-034-design-system branch, final verification pass. All 🟤 Auto-Generated (Claude-surfaced during gate/manual verification, not user-raised).

- 🟤 **`use(params)` on Next 14.2.35 breaks 4 dynamic routes, not 3** — `/admin/orders/[id]`, `/admin/products/[id]`, `/account/orders/[id]`, and **`/admin/suppliers/[id]`** (a 4th call site found by grep and confirmed live, not previously documented) all 500 with `An unsupported type was passed to use(): [object Object]`. Verified first-hand for all four via direct `page.goto()` (HTTP 500 on each) plus captured `pageerror`/server-log text matching exactly; stack traces name `SupplierDetailPage` (`src/app/(admin)/admin/suppliers/[id]/page.tsx:98`) and `EditProductPage` (`src/app/(admin)/admin/products/[id]/page.tsx:34`) alongside the two previously-known sites. Root cause: Next 14.2.35 passes `params` as a plain object to client components; `use()` requires a Promise (Next 15 semantics). Pre-existing on `main`, unrelated to this branch. The root `CLAUDE.md` and `src/app/CLAUDE.md` documented this as an intended "Async params unwrapping" pattern with no caveat — both corrected in this task's commit to name the break and list all 4 routes. (High value, Med effort)
- 🟤 **`next-themes` is now an unused dependency** — still in `package.json` after the storefront excision (37894c8), deliberately left installed to avoid lockfile churn. Candidate for removal once nothing else in the tree needs it (showcase theming does not use it — confirmed local-wrapper-scoped, not `next-themes`-driven). (Low value, Low effort)
- 🟤 **Supplier order status styling is still duplicated/bright** — `src/app/(admin)/admin/suppliers/[id]/page.tsx` keeps a local `STATUS_COLORS` for `SupplierOrder.status`. That field is a plain Prisma `String` with a lowercase, non-overlapping vocabulary (`pending/submitted/confirmed/shipped/delivered/cancelled/failed`), so it deliberately could not reuse `src/lib/order-status.ts` (case-sensitive, keyed to the uppercase `OrderStatus` enum). A parallel `supplier-order-status` module is the follow-up. (Med value, Low effort)
- 🟤 **`.css` files are not covered by `lint-staged`/`format:check`** — verified directly: `package.json`'s `lint-staged` block only matches `*.{ts,tsx}`, `*.{js,jsx}`, `*.{json,md}`, and `format:check` runs `prettier --check "**/*.{ts,tsx,js,jsx,json,md}"` — neither globs `.css`. `globals.css` formatting and line-ending drift are invisible to both the pre-commit hook and CI. (Low value, Low effort)
- 🟤 **Admin still carries bright payment-status chips** — admin inherits the Mirox tokens (colors, radius, motion vars are global) but was intentionally not restyled by TASK-034. Its **OrderStatus** chips are already monochrome — both admin orders pages were converted to the shared `getOrderStatusStyle()` in TASK-034. What remains bright is `PAYMENT_STATUS_COLORS` (`PaymentStatus`, admin-only, in both admin orders pages) plus the supplier-order status map tracked in the entry above. A future admin visual pass should adopt the monochrome policy already applied to the customer-facing surfaces. (Med value, Med effort)

### [2026-07-18] From: TASK-034 PR #19 review rounds

**Origin**: PR #19 code-review rounds (separate intake event from Task 12's verification pass). 🟤 Auto-Generated.

- 🟤 **Automate the `docs/README.md` index-freshness check — this defect class has now recurred three consecutive times** — PR #16 (`04a2593`), PR #17 (`3207425`) and PR #19 (`8a98850`) each shipped with the sole review findings being stale index rows, despite `docs/README.md` stating the indexing rule in its own body. Three manual catches in a row is the signal to automate. Shape it like `tests/unit/no-bright-colors.test.ts` (a plain unit test, no new tooling). **Critical design note — a naive implementation is worse than nothing:** a first pass during PR #19 flagged 17 rows, and 16 were false positives. The check MUST understand two shapes before it can be trusted: (1) only tables whose column header is literally `Last Updated` hold dates — the `archive/plans/` tables carry a separate **Status** column (`COMPLETE`/`ACTIVE`) that is not a date at all; (2) specs under `superpowers/specs/` carry `**Date**:`, not `**Last Updated**:`, so "no stamp found" must mean _skip_, never _fail_. Compare a row's date only against a file that actually declares `**Last Updated**:`. Retiring this class is worth more than a fourth manual catch. (Med value, Low effort) `[relates-to: docs-hygiene entries from PR #16/#17]`

### [2026-07-18] From: TASK-034 post-merge deploy verification

**Origin**: verifying the production deployment of merge commit `adaa278`. 🟤 Auto-Generated.

- 🟤 **`NEXT_PUBLIC_STORE_NAME` is unset in production, so the whole non-visual brand surface still says "Store"** — verified live: `https://dropshipping-test.vercel.app` serves the rebrand correctly (logo renders "Mirox Shop", `data-surface` present) but its `<title>` is still `Store | Quality Products, Great Prices`. Cause is a single unset env var — `src/lib/seo.ts:5`, `src/lib/email.ts:6`, `src/lib/email-templates/newsletter-confirmation.ts:3` and `src/app/(admin)/admin/settings/page.tsx:20` all read `process.env.NEXT_PUBLIC_STORE_NAME || "Store"`. So browser tab titles, search-result snippets, Open Graph/social share cards, JSON-LD, order-confirmation emails and newsletter emails all still brand as "Store". **This is a config fix, not a code fix** — set `NEXT_PUBLIC_STORE_NAME` in the Vercel project (and `.env.example`) to complete the rebrand. Out of TASK-034's scope by design (it owned the design system; copy/content was deferred), but it is the highest-visibility remaining gap in the rebrand. (High value, Low effort) `[relates-to: TASK-039 i18n copy]`
- 🟤 **The Actions "Deploy to Vercel" job is a green no-op and is actively misleading** — confirmed on run `29662966424`: only the "Validate Vercel configuration" step executed; steps 3–9 (Checkout, Setup Node, Install Vercel CLI, Pull env, Build, Deploy, Run database migrations) all reported `skipped` because the Vercel secrets are unset, and the job still concluded `success`. It even posts a GitHub Deployment to a lowercase `production` environment whose "success" reflects the skipped job, sitting alongside the genuine capital-`Production` deployment created by `vercel[bot]`. The real deploys come from the Vercel Git integration and work fine. Either wire the secrets so the job does something, or delete the job — a permanently-green deploy badge that never deploys will eventually be trusted by someone. **Note the migration implication:** the "Run database migrations" step is inside the skipped block, so no migration has ever run from CI. (Med value, Low effort) `[relates-to: TASK-040 CI extensions; duplicate-of an earlier deploy-reality note]`

---

## Technical Debt

Known issues that should be addressed eventually.

| Item                          | Impact                              | Effort | Added      |
| ----------------------------- | ----------------------------------- | ------ | ---------- |
| Unused Account/Session tables | Minor DB overhead with JWT strategy | Low    | 2026-01-13 |
| ~~Console.error logging~~     | ~~Resolved in TASK-029~~            | Low    | 2026-01-13 |
| Generic 500 error responses   | Users don't know what went wrong    | Med    | 2026-01-13 |
| S3 cleanup failures silent    | Orphaned files in storage           | Low    | 2026-01-13 |
| Email send failures silent    | Users don't know email wasn't sent  | Med    | 2026-01-13 |

---

## Research Topics

Areas requiring investigation before implementation.

| Topic                   | Question                                          | Why Important | Added      |
| ----------------------- | ------------------------------------------------- | ------------- | ---------- |
| Callback URL validation | How to prevent open redirect vulnerabilities?     | Security      | 2026-01-13 |
| Structured logging      | What logging solution for production?             | Debugging     | 2026-01-13 |
| Live Payment Activation | What's needed to activate Stripe live mode?       | Business      | 2026-01-22 |
| Business Registration   | What documents/steps needed for Ukraine business? | Legal         | 2026-01-22 |

---

## Someday / Maybe

Ideas that might be valuable but aren't prioritized.

- [ ] Remove unused Prisma Account/Session tables if staying with JWT-only
- [ ] Add structured logging with error masking (replace console.error)
- [ ] Email templates for verification/reset flows
- [ ] User consent/privacy policy flow
- [ ] Audit logging for auth events
- [ ] Add JSDoc comments to auth functions
- [ ] Extract password validation rules to shared schema

---

## Rejected Ideas

Ideas considered but decided against (with reasoning).

| Idea                             | Reason for Rejection                               | Date       |
| -------------------------------- | -------------------------------------------------- | ---------- |
| Database sessions instead of JWT | JWT is more scalable for serverless, simpler setup | 2026-01-13 |

---

## Promotion Criteria

Move items to [TODO.md](TODO.md) when:

- [ ] Aligns with current [ROADMAP.md](ROADMAP.md) phase
- [ ] Value clearly exceeds effort
- [ ] Dependencies are resolved
- [ ] Capacity exists to complete
- [ ] Stakeholder approval (if needed)
- [ ] **For marketing tasks**: Real business requirements met

---

## Adding to Backlog

When adding new items:

1. Choose appropriate category
2. Provide brief description
3. Estimate Value and Effort (High/Med/Low)
4. Note the source (who suggested it)
5. Add date if relevant

---

_Promoted items go to [TODO.md](TODO.md)._
_Rejected items stay here with reasoning._
_See [ROADMAP.md](ROADMAP.md) for strategic direction._
