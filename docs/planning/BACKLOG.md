# Backlog

Ideas and tasks not yet prioritized for active development.

**Last Updated**: 2026-08-15

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

- [ ] Add additional e-commerce events: `remove_from_cart`, `view_promotion`, `select_promotion`
- [ ] Implement GA4 Measurement Protocol for server-side purchase validation
- [ ] Build admin analytics dashboard showing conversion funnel from GTM data

### [2026-02-02] From: TASK-020 Google Shopping Feed Preparation

**Origin**: TASK-020 implementation on feat/task-020-google-shopping-feed branch

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

- [x] ~~🟤 **`use(params)` on Next 14.2.35 breaks 4 dynamic routes, not 3** — `/admin/orders/[id]`, `/admin/products/[id]`, `/account/orders/[id]`, and **`/admin/suppliers/[id]`** (a 4th call site found by grep and confirmed live, not previously documented) all 500 with `An unsupported type was passed to use(): [object Object]`. Root cause: Next 14.2.35 passes `params` as a plain object to client components; `use()` requires a Promise (Next 15 semantics). (High value, Med effort)~~ — **RESOLVED in G3 (PR [#30](https://github.com/GoodAlex223/dropshipping-test/pull/30), merged `6f81f95`, 2026-08-08).** All four pages now read `const { id } = useParams<{ id: string }>()!;` and are prop-less; the non-null assertion is forced by the pages-compat types `next-env.d.ts` references (see the `[2026-08-08]` group entry below). Regression: `tests/unit/dynamic-route-params.test.tsx` (renders all four pages, asserts the id reaches each fetch URL; red on the old code, green on the fix). Browser-verified: all four routes 200 under admin + customer logins. _(Full original entry text in git history.)_
- 🟤 **`next-themes` is now an unused dependency** — still in `package.json` after the storefront excision (37894c8), deliberately left installed to avoid lockfile churn. Candidate for removal once nothing else in the tree needs it (showcase theming does not use it — confirmed local-wrapper-scoped, not `next-themes`-driven). (Low value, Low effort)
- 🟤 **Supplier order status styling is still duplicated/bright** — `src/app/(admin)/admin/suppliers/[id]/page.tsx` keeps a local `STATUS_COLORS` for `SupplierOrder.status`. That field is a plain Prisma `String` with a lowercase, non-overlapping vocabulary (`pending/submitted/confirmed/shipped/delivered/cancelled/failed`), so it deliberately could not reuse `src/lib/order-status.ts` (case-sensitive, keyed to the uppercase `OrderStatus` enum). A parallel `supplier-order-status` module is the follow-up. (Med value, Low effort)
- 🟤 **`.css` files are not covered by `lint-staged`/`format:check`** — verified directly: `package.json`'s `lint-staged` block only matches `*.{ts,tsx}`, `*.{js,jsx}`, `*.{json,md}`, and `format:check` runs `prettier --check "**/*.{ts,tsx,js,jsx,json,md}"` — neither globs `.css`. `globals.css` formatting and line-ending drift are invisible to both the pre-commit hook and CI. (Low value, Low effort)
- 🟤 **Admin still carries bright payment-status chips** — admin inherits the Mirox tokens (colors, radius, motion vars are global) but was intentionally not restyled by TASK-034. Its **OrderStatus** chips are already monochrome — both admin orders pages were converted to the shared `getOrderStatusStyle()` in TASK-034. What remains bright is `PAYMENT_STATUS_COLORS` (`PaymentStatus`, admin-only, in both admin orders pages) plus the supplier-order status map tracked in the entry above. A future admin visual pass should adopt the monochrome policy already applied to the customer-facing surfaces. (Med value, Med effort) **Scheduled 2026-08-11** → WEEKLY [G13](WEEKLY.md) member 3 (the admin sweep is that pass).

### [2026-07-18] From: TASK-034 PR #19 review rounds

**Origin**: PR #19 code-review rounds (separate intake event from Task 12's verification pass). 🟤 Auto-Generated.

- 🟤 **Automate the `docs/README.md` index-freshness check — this defect class has now recurred three consecutive times** — PR #16 (`04a2593`), PR #17 (`3207425`) and PR #19 (`8a98850`) each shipped with the sole review findings being stale index rows, despite `docs/README.md` stating the indexing rule in its own body. Three manual catches in a row is the signal to automate. Shape it like `tests/unit/no-bright-colors.test.ts` (a plain unit test, no new tooling). **Critical design note — a naive implementation is worse than nothing:** a first pass during PR #19 flagged 17 rows, and 16 were false positives. The check MUST understand two shapes before it can be trusted: (1) only tables whose column header is literally `Last Updated` hold dates — the `archive/plans/` tables carry a separate **Status** column (`COMPLETE`/`ACTIVE`) that is not a date at all; (2) specs under `superpowers/specs/` carry `**Date**:`, not `**Last Updated**:`, so "no stamp found" must mean _skip_, never _fail_. Compare a row's date only against a file that actually declares `**Last Updated**:`. Retiring this class is worth more than a fourth manual catch. (Med value, Low effort) `[relates-to: docs-hygiene entries from PR #16/#17]`
  **Update (2026-08-03, PR #27 — recurrence #7, now OVERDUE):** the class recurred in PR #23, #26 and twice in #27 — where the round that fixed the BACKLOG header re-created the drift in the index row (the "fix moved the drift" failure mode a check would have caught). PR #27's final review measured the naive full audit firing on ~20 rows, all of them the known false-positive classes above — confirming the guards are the load-bearing part of the design and providing that row set as a ready-made test fixture. Promote this entry instead of making an 8th manual catch.
  **Update (2026-08-08, PR #30 — recurrences #8/#9):** the class recurred twice more in PR #30 (`docs/README.md`'s own header, and the BACKLOG header + index-row pair); both halves were caught in one review pass and fixed together in one commit (`9aae7bc`), avoiding #27's "fix moved the drift" mode. Ninth manual catch. Promote.
  **Promoted 2026-08-11** → WEEKLY [G11](WEEKLY.md) (week of 2026-08-10), the week's single 🟤 slot — ends the manual-catch streak at 9.

### [2026-07-18] From: TASK-034 post-merge deploy verification

**Origin**: verifying the production deployment of merge commit `adaa278`. 🟤 Auto-Generated.

- 🟤 **`NEXT_PUBLIC_STORE_NAME` is unset in production, so the transactional-email brand surface still says "Store"** — _(narrowed 2026-07-21 after TASK-035: the visual + SEO surface is now fixed.)_ TASK-035 changed `src/lib/seo.ts` to fall back to `BRAND_NAME` ("Mirox Shop") instead of `"Store"`, and PR #21 made the OG/Twitter card render the generated Mirox card — verified live, the prod `<title>` is now `Mirox Shop — Modern Clothing` and `og:image` resolves to `/opengraph-image`. **What still hardcodes `|| "Store"`**: `src/lib/email.ts`, `src/lib/email-templates/newsletter-confirmation.ts`, and `src/app/(admin)/admin/settings/page.tsx` — so order-confirmation emails, the newsletter double-opt-in email, and the admin settings label still brand as "Store". Fixing is either the same **config** fix (set `NEXT_PUBLIC_STORE_NAME` in Vercel — cheapest, one var), or route those three through `BRAND_NAME` like `seo.ts` now does (code fix, no env dependency). (Med value, Low effort) `[relates-to: TASK-039 i18n copy]` **RESOLVED (code side) by G5 — PR #33 merged `1a4f030` (2026-08-10)**: all three sites now fall back to `BRAND_NAME` (emails via render-time `getStoreName()` in `src/content/emails.ts`; admin settings via direct import). `NEXT_PUBLIC_STORE_NAME` is now an optional override, no longer required for correct branding.
- 🟤 **The Actions "Deploy to Vercel" job is a green no-op and is actively misleading** — confirmed on run `29662966424`: only the "Validate Vercel configuration" step executed; steps 3–9 (Checkout, Setup Node, Install Vercel CLI, Pull env, Build, Deploy, Run database migrations) all reported `skipped` because the Vercel secrets are unset, and the job still concluded `success`. It even posts a GitHub Deployment to a lowercase `production` environment whose "success" reflects the skipped job, sitting alongside the genuine capital-`Production` deployment created by `vercel[bot]`. The real deploys come from the Vercel Git integration and work fine. Either wire the secrets so the job does something, or delete the job — a permanently-green deploy badge that never deploys will eventually be trusted by someone. **Note the migration implication:** the "Run database migrations" step is inside the skipped block, so no migration has ever run from CI. (Med value, Low effort) `[relates-to: TASK-040 CI extensions; duplicate-of an earlier deploy-reality note]`

### [2026-07-21] From: TASK-035 Homepage Rebrand (PR #21 + code review)

**Origin**: PR #21 code-review rounds and accepted follow-ups from the homepage build. 🟤 Auto-Generated.

- 🟤 **`getTestimonials()` can under-fill the testimonials rail** — `src/lib/review-queries.ts` applies `take: limit` and _then_ filters whitespace-only comments in JS, so if any fetched row is whitespace-only the rail renders fewer than `limit`. Raised in the PR #21 review (scored 75, below the 80 auto-post gate) and deferred as out-of-scope for a homepage PR. Clean fix is at write time: reject whitespace-only comments in `createReviewSchema` (`src/lib/validations/index.ts`, `.trim().min(1)`) so the data can't exist; over-fetch-and-slice is the band-aid alternative. Low impact today (whitespace-only 4★+ visible reviews are effectively nonexistent). (Low value, Low effort)
- 🟤 **`SocialLinks` renders in two places on the homepage** — the dedicated "Follow us" social section and the Footer both mount `SocialLinks`, so the same handles appear twice on one scroll. Intentional for now (footer is site-wide chrome), but worth deciding whether the homepage section should differentiate (e.g. follower counts / feed) or the duplication should be removed. (Low value, Low effort)

### [2026-07-21] From: TASK-035 post-merge production incident (PR #22)

**Origin**: production homepage returned 500 on every request after PR #21 merged; root-caused via Vercel runtime logs to a `reviews` table that had never been migrated to prod. Fixed in PR #22 (resilience + `vercel-build` migrations). These are the follow-ups the incident surfaced. 🟤 Auto-Generated.

- 🟤 **No guard against production schema drift — it hid for ~5 months** — nothing applied `prisma migrate deploy` to prod (Actions deploy job is the no-op above; `build` only did `generate && next build`), so prod silently sat at the January schema while `reviews`/`subscribers` and later migrations accumulated unapplied. PR #22 fixed the _mechanism_ (`scripts/vercel-build.sh` now migrates on every Vercel deploy), but there is still no _detection_: add a check that fails loudly when the deployed DB is behind committed migrations (e.g. `prisma migrate status` in CI against a shadow, or a post-deploy assertion), so a future gap in the deploy path can't drift silently again. This also **closes the loop on the `[2026-07-18]` "no migration has ever run from CI" prediction** — it was correct, and it took the homepage down. (High value, Med effort) `[relates-to: the Actions deploy-no-op entry above; TASK-040]`
- 🟤 **Reconcile the now-triply-redundant Actions "Deploy to Vercel" migration step** — with `vercel-build` applying migrations on the real (Git-integration) deploy, the Actions job's skipped `prisma migrate deploy` step is not just a no-op, it now describes a path that would _double-migrate_ if its secrets were ever wired. Fold this into the "delete or wire the Actions deploy job" decision so the two deploy stories stop contradicting each other. (Med value, Low effort) `[relates-to: the Actions deploy-no-op entry above]`
- 🟤 **No post-deploy smoke test — the outage was only caught by a manual `curl`** — CI/Deploy has no check that the production homepage (and a DB-backed route) returns 200 after a deploy. A ~5-line post-deploy step hitting `/`, `/products` and e.g. `/api/products/<slug>/reviews`, failing on a 5xx, would have caught this in minutes instead of relying on someone looking. (Med value, Low effort) `[relates-to: TASK-040]`
- 🟤 **Audit other multi-query server render paths for the same all-or-nothing failure** — the homepage 500'd because three parallel queries were awaited together and one throwing rejected the whole render (now wrapped in `safeSection()`). Other server components that fan out queries in render (category pages, product detail's related/recently-viewed, etc.) may share the pattern; a page shouldn't 500 because one non-critical section's data is unavailable. (Med value, Low effort)
- 🟤 **`DIRECT_URL` is now load-bearing for deploys but undocumented outside the build script** — `scripts/vercel-build.sh` reads `DIRECT_URL` (direct, non-pooled Neon endpoint) for `migrate deploy`, deliberately kept out of `prisma/schema.prisma` (per-command override) to avoid a CI/local blast radius. The cost is that the requirement lives only in a script comment: a new environment (staging) or a fresh Vercel project would silently skip migrations if `DIRECT_URL` is unset (the script warns but is non-fatal by design). Document it in `.env.example` / deployment docs. (Med value, Low effort)

### [2026-07-24] From: TASK-035 post-completion visual audit

**Origin**: a screenshot-vs-concept audit of the _deployed_ homepage (`dropshipping-test.vercel.app`) against `docs/reference/mirox-concept-screenshot.jpg` + `client-brief.md`, run after the user observed the visual result didn't match the brief. All 🟤 Auto-Generated (Claude-surfaced during the audit). Findings that duplicate existing tasks are noted, not re-filed: hero photography → TASK-056; rich ProductCard (2nd-image/quick-view/swatches) → TASK-036 AC; USD→UAH prices → the `[2026-07-21]` TASK-035 entry / TASK-039. The four buildable-now craft fixes (whole-page `opacity:0`-until-scroll, red `destructive` discount badge vs the strict monochrome palette, bland "Why choose us"/"Follow us" blocks, absent glass/soft-shadow/premium motion) are **not** filed here — they are being taken into a `frontend-design`-led brainstorm as the immediate next task.

- 🟤 **Design/rebrand tasks have no visual-fidelity acceptance gate — TASK-035 shipped fully green while the deployed page diverged sharply from the concept** — every automated gate (unit 417+1, lint, typecheck, build) passed, and six PR review rounds found "zero runtime defects," yet the live page renders blank below the hero until you scroll (whole-page `FadeIn` `opacity:0`), shows a placeholder electronics catalog with broken images, and carries a red badge that violates the brief's explicit "no bright colours." None of these are visible to tests, lint, or a bug-hunting review — and the `[2026-07-21]` "no post-deploy smoke test" entry wouldn't catch them either, because the page returns **HTTP 200** while looking broken. Root cause: acceptance criteria were textual ("benefit cards present") and no step ever compared the rendered page to `mirox-concept-screenshot.jpg`. Proposed guardrails: (a) a required screenshot-vs-reference sign-off on every task that changes UI; (b) invoke the `frontend-design` skill at _build_ time for design tasks so output doesn't default to a tokenised wireframe; (c) mark content-blocked ACs (e.g. photo-less hero, placeholder catalog) as **blocked**, never "done," so they can't pass as complete. (High value, Med effort) `[relates-to: the [2026-07-21] "No post-deploy smoke test" entry; TASK-036; TASK-037]`

### [2026-07-24] From: homepage-polish branch (final whole-branch review)

**Origin**: `feat/homepage-polish-art-direction` — the SDD final whole-branch review's triaged Minors, deferred as backlog-grade (the branch's one Important finding, a dead `--shadow-soft`, was fixed in-branch). All 🟤 Auto-Generated.

- 🟤 **Hero headline fade may cost LCP on the no-photo hero** — the `!hasImage` hero animates the STYLE/QUALITY/CONFIDENCE lines `opacity:0→1` (`animate-fade-up`, `both` fill) on every load; with `home.hero.image = null` (today's state) that headline is plausibly the LCP element, and fading the LCP text can delay LCP by ~the animation duration. Transform/opacity only, so no CLS. The brief targets PageSpeed 95+. Measure with Lighthouse and, if it regresses LCP, exempt the first headline line from the entrance (or shorten it). Best verified once **TASK-040**'s Lighthouse CI exists. (Med value, Low effort) `[relates-to: TASK-040]`
- 🟤 **`.glass` tiles read very low-contrast on the pure-black social section** — under `[data-surface="dark"]`, `.glass` is 72%-opaque `#000` + a `#262626` border over a black section, so the tile boundary is barely visible (text stays legible via inherited white). Functionally fine, but undercuts "Follow us as a distinct block." Consider a slightly lighter translucent fill or a stronger border on dark surfaces. (Low value, Low effort)
- 🟤 **Test-robustness follow-ups from the polish branch (batch)** — several per-task tests are non-vacuous but shallow: `FadeIn`'s `delay` prop has no test (no consumer passes it today); the badge test asserts absence of `.bg-destructive` but not presence of `.bg-primary`; the social tiles test only asserts `.glass` exists somewhere (not `.hover-lift`, not all tiles, not that the inline variant has none). Strengthen opportunistically when next touching each. (Low value, Low effort)
- 🟤 **WhyChooseUs stat label announced twice to screen readers** — the value's label sits in both an `sr-only <dt>` and the visible `<dd><span>`; a screen reader reads it twice. Trivial fix: `aria-hidden` the visible label span since the `<dt>` already carries it. (Low value, Low effort)

### [2026-07-29] From: TASK-057 design adoption

**Origin**: `feat/task-057-design-adoption` branch — dark-theme token flip, homepage/header/footer realignment, Mirox clothing seed, UAH display, and the v1.3/v1.4 task-map revision. Deferred minors and process notes surfaced across its 12 build tasks and 3 visual-gate revision rounds; see the SDD ledger (`.superpowers/sdd/2026-07-27_task-057-design-adoption/progress.md`) for the full per-task trail. All 🟤 Auto-Generated.

- 🟤 **Admin settings mock shipping labels still show "$"** — `src/app/(admin)/admin/settings/page.tsx`'s "Free Shipping Threshold ($)", "Standard Shipping ($)", "Express Shipping ($)" labels still read in dollars while the storefront has been UAH-denominated since TASK-057. Out of this task's currency-sweep inventory (admin settings isn't a customer-facing price render). (Low value, Low effort) `[relates-to: TASK-039; TASK-048]`
- 🟤 **`ProductForm`'s `грн` prefix adornment may crowd `pl-7` inputs** — `src/components/admin/ProductForm.tsx`'s price/comparePrice/cost fields gained a `грн` prefix sized for the old `$` glyph's padding (`pl-7`); Cyrillic `грн` is visually wider than `$` and may crowd the input's leading edge on narrow viewports. Disclosed during TASK-057's currency sweep, not visually re-verified. (Low value, Low effort)
- 🟤 **`og-fonts.ts` has no unit tests** — `src/lib/og-fonts.ts`'s `loadManropeForOg()` fails safe to `[]` on any error (network failure, UA-sniff miss, missing TTF url), but that contract is only documented in the docstring, not pinned by a test. A mocked-`fetch` failure-path test would catch a regression that silently reintroduces tofu-on-Cyrillic without ever throwing. (Low value, Low effort) `[relates-to: TASK-040]`
- 🟤 **PDP OG route adds 2 Google Fonts round-trips per request** — `src/app/(shop)/products/[slug]/opengraph-image.tsx` calls `loadManropeForOg()` (2 sequential fetches — css2 lookup + TTF download — × 2 weights) on every request, with no `revalidate`/cache. Fine at current traffic; worth a cache/revalidate follow-up once PDP OG cards see real load. (Low value, Low effort)
- 🟤 **The `css2` User-Agent sniff `og-fonts.ts` depends on is inherently fragile** — Google's `fonts.googleapis.com/css2` endpoint decides `woff`/`woff2`/`truetype` purely by matching the request's User-Agent string; the legacy-Safari UA this code relies on (documented in the file's own docstring, verified live 2026-07-27) could stop returning `format('truetype')` at any time without notice, silently degrading OG cards to tofu (fails safe, never crashes). No action needed today — noted so a future "OG cards suddenly show boxes" report starts here instead of re-diagnosing from scratch. (Low value, Low effort)
- 🟤 **PRE-EXISTING bug: admin Customers and Categories list pages loop forever, never render data** — found live during Task 11's admin click-through; root cause predates this branch. `fetchCustomers`/`fetchCategories` are `useCallback`s with `toast` (from `useToast()`) in their dependency array; `toast` isn't referentially stable across renders, so the callback's identity changes every render, re-firing the `useEffect` that calls it, forever — confirmed via the network tab showing 100+ repeated `GET /api/admin/{customers,categories}` calls in a few seconds, permanently stuck on the skeleton loader. Diagnosis reviewer-confirmed (Task 11 report). Two admin pages are effectively unusable; likely shared by other admin list pages using the same `useCallback`-with-`toast` pattern — worth auditing all of them once fixed. (Med value, Low effort)
- 🟤 **The `dark:` Tailwind variant is dead code app-wide** — `@custom-variant dark (&:is(.dark *))` in `globals.css` never activates anywhere: `next-themes`/`ThemeProvider`/any `class="dark"` were all removed in TASK-034, so every `dark:*` utility in the codebase renders only its light-mode fallback, unconditionally. Found via a live admin newsletter badge bug (pale `bg-green-100` with an inert `dark:bg-green-900` sibling) — fixed in that one spot (Task 11, `fe72c88`), but the grep that found it doesn't prove there are no more instances elsewhere in admin. Consider removing the dead `dark:` variant machinery entirely, or documenting that it's inert. (Med value, Low effort)
- 🟤 **Low-stock text lost its salience — now plain muted text with an icon as the only cue** — the 3 `text-orange-600` "low stock" warnings swept in Task 11 (`cart/page.tsx` ×2, `product-detail-client.tsx` ×1) became `text-muted-foreground` per the brief's monochrome mandate; urgency now depends entirely on an accompanying icon, not color. Brief-mandated for this chunk; revisit the salience question when TASK-036/037 redesign these surfaces properly. (Low value, Low effort) `[relates-to: TASK-036; TASK-037]`
- 🟤 **Stripe Elements' new dark theme is unverified at runtime** — `src/app/(shop)/checkout/page.tsx`'s Payment Element `appearance` was re-themed from Stripe's light-tuned `"flat"` to `"night"` with explicit Mirox-token hex values (Task 11, `fe72c88`), matched by hex against `globals.css` only — this environment has no `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY` configured, so the Payment Element never actually mounts here. Get a real screenshot once TASK-048 wires up Stripe test keys. (Med value, Low effort) `[relates-to: TASK-048]`
- 🟤 **`store_currency`/shipping settings and `Order.currency` still default to USD** — `prisma/schema.prisma`'s `Order.currency` is still `@default("USD")`, and the admin settings shipping fields (see the "$" labels entry above) are unconverted — TASK-057's brief scoped only branding + customer-facing price _display_ (`formatPrice()`), not the underlying currency field or admin-side settings. Belongs to TASK-039 (i18n/currency infra) and/or TASK-048 (payment gateway, which also determines the real transaction currency). (Med value, Low effort) `[relates-to: TASK-039; TASK-048]`
- 🟤 **`AUTH_TRUST_HOST=true` is undocumented for local prod-mode testing, only for CI** — CLAUDE.md documents this env var as a CI E2E requirement, but running a local `next build && next start` for visual verification (as TASK-057's Task 12 visual-fidelity gate did) hits the same NextAuth requirement and it isn't mentioned anywhere for that path. Doc-only gap, surfaced while root-causing the Task 12 NODE_ENV/CSS bug. (Low value, Low effort)
- 🟤 **`next/og` static (non-dynamic) routes cannot self-fetch their own absolute-URL assets at build time — a `data:` URI is the correct pattern** — `src/app/opengraph-image.tsx` has no dynamic segments, so `next build` prerenders it once, before any server is listening; an absolute-URL `<img src>` (the pattern that works fine on the PDP's per-request dynamic OG route) failed silently during that prerender ("Can't load image ... fetch failed" in the build log) and shipped a card with a missing asset — invisible to a green build, only caught by rendering the actual output. Fixed (Task 12 gate revision, `7c06be8`) by embedding the local asset as a base64 `data:` URI instead. Transferable lesson: any static/non-dynamic `opengraph-image.tsx` (or similar build-time-only Satori render) must inline local assets as data URIs, never fetch them by absolute URL — reserve the `siteConfig.url` self-fetch pattern for genuinely per-request dynamic routes. (Med value, Low effort) `[relates-to: TASK-036; TASK-037 — any future static OG routes]`
- 🟤 **`SocialLinks`'s `"tiles"` variant has zero consumers** — `src/components/common/SocialLinks.tsx` supports `variant="tiles"` (larger glass cards, visible labels) alongside the default `"inline"` variant used by `Footer.tsx`; TASK-057's homepage realignment to `Mirox Home.dc.html` removed the standalone "Follow us" section that PR #23 had rendered it in, so `"tiles"` is currently dead code with no call site anywhere in `src/`. Intended consumer is TASK-055's Contacts page (social cards). Not a bug — flagging so `"tiles"` isn't mistaken for removable dead code before TASK-055 lands. (Low value, Low effort) `[relates-to: TASK-055]`
- 🟤 **`getBestsellers()`/`getFeaturedProducts()` have no homepage consumer since TASK-057** — `src/lib/product-queries.ts` keeps both fully implemented and tested (real sales-ranked bestsellers with backfill, and an `isFeatured`-flag query), but the homepage's "Новинки" rail now calls `getNewArrivals()` per the design handoff. TASK-036's catalog "popular" sort is the documented intended successor for `getBestsellers()` (see the function's own code comment); `getFeaturedProducts()` has no assigned successor yet. Not dead code today (both are unit-tested), just currently unreferenced from any page. (Low value, Low effort) `[relates-to: TASK-036]`
- 🟤 **Chromium's stitched `fullPage` screenshot capture drops the hero's composited image layer** — during the Task 12 visual-fidelity gate, a `fullPage: true` Playwright screenshot rendered the hero's photo as a solid black column; the live page (and an element-scoped screenshot) rendered it correctly. A Chromium full-page-stitching/compositing quirk with the hero's layered CSS vignette + image, not a site bug — worked around by capturing with a tall fixed viewport instead of `fullPage`. Worth remembering as the default capture method for future visual-fidelity gates on this hero (or any similarly layered section). (Low value, Low effort) `[relates-to: the visual-fidelity gate pattern for design tasks]`
- 🟤 **NOTE for DONE.md disclosure — TASK-057 fixed a pre-existing prod bug incidentally**: the PDP Open Graph route (`src/app/(shop)/products/[slug]/opengraph-image.tsx`) crashed on relative product-image URLs — Satori (next/og's renderer) requires an absolute URL for `<img src>`, and the pre-TASK-057 code passed the raw stored `url` through unchanged. Fixed in Task 10 (`5e17601`) by wrapping it in `new URL(raw, siteConfig.url)`. Pre-existing and unrelated to the Cyrillic-font work that motivated touching this file — flagging for the completion workflow to disclose in DONE.md as a fixed-incidentally bug, not a TASK-057 feature. (Low value, Low effort)
- 🟤 **NOTE — the return-window question is resolved, not still open**: TASK-056's "free-shipping threshold/currency and the return window (currently unconfirmed '14 days')" AC item is now half-resolved — the return window is **USER-APPROVED as «14 днів»** (2026-07-28), recorded on TASK-055 in TODO.md for use once its `/contact`/policy page ships. Free-shipping threshold/currency remains genuinely unconfirmed and still blocks that half of the AC. Authoritative text lives in TODO.md TASK-055/TASK-056; this entry exists only so a BACKLOG-only reader doesn't miss the resolution. (Low value, Low effort) `[relates-to: TASK-055; TASK-056]`
- 🟤 **TASK-043 (cart, v1.4) — design now exists**: [`docs/design/design_handoff_mirox/Mirox Cart.dc.html`](../design/design_handoff_mirox/Mirox%20Cart.dc.html) specifies quantity steppers, a sticky order summary, a promo-code field, and a dashed-border empty-cart state. Not built by TASK-057 (the cart page only got the dark-coherence colour sweep, Task 11) — recorded here as a pointer for whenever TASK-043 is promoted to TODO.md/v1.4. (Low value, Low effort) `[relates-to: TASK-043]`
- 🟤 **TASK-048/049 (payments/Nova Poshta, v1.4) — checkout design now exists**: [`docs/design/design_handoff_mirox/Mirox Checkout.dc.html`](../design/design_handoff_mirox/Mirox%20Checkout.dc.html) specifies a 3-step flow, Nova Poshta radio-cards (відділення 80 грн / кур'єр 120 грн / поштомат 70 грн — published rates, negotiable; real economics need sales quotes per the payments decision doc), and a payment-method step («Карткою онлайн» vs «Оплата при отриманні», with the COD path mapping to `AWAITING_COD` per decision doc §8.4). **Known interim mismatch, unresolved until these tasks land**: `SHIPPING_METHODS` in `src/lib/stripe.ts` still carries its original 5.99/12.99/24.99 USD values, which `formatPrice()` now renders as if they were грн (e.g. "5.99 грн" instead of a real Nova Poshta rate) — the shipping-method/currency swap belongs to TASK-048/049, not TASK-057. Recorded here as a pointer for whenever these are promoted to TODO.md/v1.4. (Low value, Low effort) `[relates-to: TASK-048; TASK-049]`
- ~~🟤 **Post-deploy verification owed: fetch a real PDP `og:image` from prod**~~ — **RESOLVED 2026-07-31**: verified after PR #24's merge deploy exactly as prescribed here; it 500'd (`ENOENT /var/task/public/images/og-logo-ghost.png` in Vercel runtime logs — the predicted tracing gap, real). Fixed with `experimental.outputFileTracingIncludes: { "/products/**": [...] }` on follow-up [PR #25](https://github.com/GoodAlex223/dropshipping-test/pull/25) (`fix/pdp-og-ghost-logo-tracing`; local prod build verified the asset lands in the route's `.nft.json` trace). The root OG card verified 200 in prod. **PR #25 merged `acb0c30` same day; prod PDP og:image verified 200 `image/png`** — card renders the product photo, Cyrillic name, `formatPrice` UAH, and the ghost mark. _(Original entry preserved in git history; see DONE.md TASK-057 "Post-merge deploy".)_

### [2026-07-31] From: PR #24 review & merge

**Origin**: PR #24's external review rounds and the post-merge deploy verification. All 🟤 Auto-Generated (reviewer-surfaced or Claude-surfaced during verification).

- 🟤 **Narrow the ESLint ignore and drop the inert `--ext` flag in one pass** — `38ce2c0` unblocked CI by adding directory-wide `docs/**` to `globalIgnores`; the reviewer accepted it but noted the pairing worth doing whenever it's tidied: `docs/**` means a _real_ `.ts` file landing under `docs/` later would silently go unlinted. One-line follow-up: narrow to `docs/design/design_handoff_mirox/**` (the actual vendor exports) and remove the lint script's `--ext .ts,.tsx`, which is inert under ESLint v9 flat config and now only misleads readers about what gets linted. (Low value, Low effort)
- 🟤 **Cache Playwright browsers in the CI E2E job** — PR #25's E2E job hung ~28 minutes inside "Install Playwright browsers" (a 1–3 min step; the tests never started) and needed a manual cancel + `gh run rerun --failed` to unstick. The download runs from scratch on every E2E job. An `actions/cache` step keyed on the Playwright version (`~/.cache/ms-playwright`) plus `npx playwright install --with-deps chromium webkit` on miss removes the flaky CDN download from the critical path and shaves minutes off every run. (Med value, Low effort) `[relates-to: TASK-040]`

### [2026-07-31] From: TASK-036 implementation

**Origin**: `feat/task-036-catalog-redesign-filters` branch, Task 11 final verification (full lint/typecheck/format/unit/build/E2E-per-project pass + visual-fidelity gate). All 🟤 Auto-Generated (Claude-surfaced during implementation/verification).

- 🟤 **7 of 8 Mirox products lack a second (back-view) product image, so the catalog's hover-swap feature only ever demos on one card** — `ProductCard.tsx`'s `hasHoverImage = Boolean(product.images[1]?.url)` gate is correct and works as designed, but seed data (`prisma/seed-data/products.ts`) only gives "Худі Mirox Basic" a `position: 1` second image; Футболка/Олімпійка/Худі White/Худі Oversize/Штани Cargo/Лонгслів/Кепка each have exactly one image, so their cards never show the hover-swap. Not a code bug — a content/asset gap. No existing BACKLOG entry covers this specific gap (checked; the closest is the `[2026-07-24]` "rich ProductCard (2nd-image/quick-view/swatches) → TASK-036 AC" note, which is about the card feature existing at all, not per-SKU asset coverage now that it's built). (Med value, Low effort — photography/asset work) `[relates-to: TASK-056]`
- 🟤 **PDP cart-line naming shows the variant _type_, not its value** — `src/app/(shop)/products/[slug]/product-detail-client.tsx` (lines 135, 145) builds cart/analytics line names as `` `${product.name} - ${selectedVariant.name}` ``, but `selectedVariant.name` is the variant's _dimension_ ("Size" / "Color"), not its chosen value — producing lines like «Худі Mirox Basic - Size» instead of «Худі Mirox Basic - L». `QuickViewDialog.tsx` (line 170) already does this correctly, rendering `variant.value`. Pre-existing, untouched by TASK-036 (out of this task's file scope — no PDP changes per spec §7). Align PDP to the QuickViewDialog pattern. (Med value, Low effort)
- 🟤 **Pre-existing E2E failures on `main`, reproduced (not introduced) on this branch: `navigation.spec.ts` "can navigate to products page" and an intermittent WebKit-family dev-server navigation race** — `navigation.spec.ts` › "can navigate to products page" fails deterministically on all 5 projects (`Каталог` header link click doesn't land on `/products`, URL stays `/`); confirmed byte-identical to `main` and reproduced there too via `git stash`/`git checkout main` triage (see `.superpowers/sdd/2026-07-31_task-036-catalog-redesign-filters/task-10-report.md` Finding C). Separately, Task 11's full 5-project local run surfaced a **non-deterministic** WebKit-engine-only flake (webkit desktop + Mobile Safari, not Chromium/Firefox/Mobile Chrome): re-running the same project twice produced two different failing-test sets (`cart.spec.ts`, `home.spec.ts`'s primary-CTA test, `products.spec.ts`'s product-detail test — never the same 5 tests twice), all sharing an "another navigation to /" or `toHaveURL` timeout signature consistent with `next dev`'s on-demand-compile/HMR racing the client navigation (same class already diagnosed with a captured trace in task-10-report's Finding A, and already independently documented in `home.spec.ts`'s own code comments for its CTA tests). Cannot happen against CI's production `next build`/`next start` (no on-demand compilation, no Fast Refresh) — low prod-CI exposure, consistent with the existing `[2026-07-16] TASK-038a` backlog entry on the same failure class. No source or test fix applies; flagging for awareness only. (Low value, Low effort)
- 🟤 **`/api/products`'s `sort=popular` loads the entire filtered id set into memory to rank and paginate** — `src/app/api/products/route.ts` (~line 118-134): when `sort=popular`, the route `findMany`s _every_ product matching the current filters (no `skip`/`take`) just to rank by `getSalesRanking()` and slice the page out client-side in JS. Fine at the current 8-SKU catalog; revisit (push the ranking into the query, or cap the unranked scan) once the catalog grows meaningfully. (Low value, Low effort)
- 🟤 **`filter-bar.tsx`'s `FiltersSheet` duplicates ~150 lines of popover-filter rendering, and duplicates `COLOR_SWATCH_CLASSES` against `ProductCard.tsx` with token/hex drift** — `src/app/(shop)/products/filter-bar.tsx` re-implements the price/brand/color/availability filter controls a second time inside the mobile `FiltersSheet` (lines ~312-480) rather than sharing the desktop popovers' bodies. Separately, its own `COLOR_SWATCH_CLASSES` (line 39: `border-[#333]`, a raw hex) is a second, independently-maintained copy of `ProductCard.tsx`'s `COLOR_SWATCH_CLASSES` (line 47: `border-border-strong`/`border-border`, design tokens) — same two color keys, different styling mechanism, so a future token change to one card look won't propagate to the other. **Update (final-review, 2026-08-01): now a THIRD independent copy** — `src/components/products/QuickViewDialog.tsx` (line 31) carries its own `COLOR_SWATCH_CLASSES`, byte-identical to `ProductCard.tsx`'s token-based version (not the filter-bar hex one) but still a separate maintenance point; a fourth swatch color added to the design would need updating in three files to stay consistent. Simplification-pass candidate: extract shared filter-control bodies and a single shared swatch-class map (all three consumers). (Low value, Med effort)

### [2026-08-01] From: TASK-036 final review

**Origin**: `feat/task-036-catalog-redesign-filters` branch, final whole-branch fix wave (post-Task-11 review round). All 🟤 Auto-Generated (Claude-surfaced during the final review).

- 🟤 **Catalog's active-category filter chip displays the raw slug, not the category name** — `src/app/(shop)/products/filter-bar.tsx` (~line 592-604): the "Категорія: {filters.category}" removable chip renders `filters.category` directly, which is the URL's `category` query param (a slug like `hudi`, not the display name "Худі"). `products-content.tsx` only has the slug available client-side (the category param comes straight from `searchParams`) — showing the proper name needs either a slug→name lookup (e.g. reuse the `/api/categories` fetch this page doesn't currently make) or threading the category name through from wherever the filter link was clicked. Low visibility today since the catalog's slugs (hudi, olimpiiky, ...) are reasonably self-explanatory, but not correct per the "Категорія: <Name>" copy pattern. (Low value, Low effort)
- 🟤 **`FilterBar`'s popover filters (brand/color/availability) and `onClearAll` have no unit-test coverage** — `tests/unit/filter-bar.test.tsx` covers size chips, sort buttons, the search-chip, the mobile sheet's class contract, and its sort/size sections, but never opens `BrandPopover`, `ColorPopover`, or `AvailabilityPopover` (desktop) nor exercises the sheet's brand/color/availability rows or the "Скинути все" (`onClearAll`) button — all still asserted only indirectly via E2E (`tests/e2e/products.spec.ts`). Worth a follow-up pass adding `fireEvent`-based coverage for each, mirroring the existing sheet sort/size tests' pattern (`within(dialog).getByRole(...)`). (Low value, Low effort)

### [2026-08-01] From: PR #26 review

**Origin**: code review on PR #26 (TASK-036), user-posted — one process observation about the review itself, plus one pre-existing code finding the review surfaced and correctly ruled out of the PR's scope. All 🟤 Auto-Generated (reviewer-surfaced, not user-raised — same routing as the `[2026-07-31] From: PR #24` group).

- 🟤 **Automate the `docs/README.md` ↔ doc-header `Last Updated` consistency check (7th recurrence)** — the same drift pair (a doc's own `**Last Updated**` header bumped without the matching `docs/README.md` index row, or vice versa, plus README's own header) has now been caught by human review on PRs #16, #17, #19, #21, #23, #26 and #33. Both sides carry a machine-parseable `**Last Updated**:`/table-cell date, so this belongs in automation, not review: a pre-commit (lint-staged) or CI docs-lint script that, for any staged `docs/**/*.md`, verifies the index row and the header agree — plus bumping README's own header when the index changes.

  **Scoping decision required before building** — the check does _not_ generalise to every indexed doc. Spec files under `docs/superpowers/specs/` carry `**Date**:` (authoring date, must **not** track edits), not `**Last Updated**:`. PR #26 itself produced a legitimate instance: the TASK-036 spec's index row was bumped to `2026-08-01` for its §8a revision round while the spec's own header correctly stays `**Date**: 2026-07-31`. A naive header↔row comparison would false-positive on exactly the row that commit fixed. Pick one before implementing: (a) give spec docs their own `**Last Updated**` line distinct from `**Date**`, or (b) scope the linter to docs that actually carry `**Last Updated**` and exempt `superpowers/specs/**`. Note the archive table also carries an extra `Status` column — parse by header name, not column index. This is the documented false-positive class behind `docs-readme-index-audit-false-positives`; sweeping the whole table is a known dead end.

  Complementary option raised in the same review: lower/reword the code-review skill's severity rubric so doc-drift findings (which top out ~75 vs the 80 gate) clear on their own — this covers the drift a linter structurally cannot see, e.g. PR #26 finding 1's stale in-code JSDoc. See the `code-review-threshold-understates-doc-findings` memory. (Med value, Low effort) `[possible-dup-of: "Automated doc freshness check" in the [2026-02-10] From: TASK-030 group]` — related but not identical: that item compares a doc's `Last Updated` header against **git file timestamps** (finds stale docs); this one compares the header against the **`docs/README.md` index row** (finds two-places-disagree drift). Same likely host script, different checks — build together, but neither subsumes the other. The same group's "Link checker in CI" is a third candidate for that script.

- 🟤 **`/api/products` passes unvalidated `parseFloat()` output into the Prisma `price` filter** — `src/app/api/products/route.ts:69-74` does `if (minPrice) { where.price = { ..., gte: parseFloat(minPrice) } }` (same shape for `maxPrice`/`lte`). The truthiness guard rejects an empty string but not a non-numeric one, so `?minPrice=abc` yields `parseFloat("abc")` → `NaN`, which reaches a Prisma `Decimal @db.Decimal(10, 2)` comparison. **Verified**: the code path, that the lines are byte-identical to `main` (pre-existing — predates TASK-036, which is why PR #26's review correctly ruled it out of scope), and that root `CLAUDE.md`'s documented "Query param validation pattern" prescribes the opposite (`!isNaN(num) && num >= min && num <= max`, then conditional spread). **Not verified**: the observable runtime behaviour of `NaN` in a Prisma Decimal `gte` — it may throw `PrismaClientValidationError` (500) or be coerced; confirm before choosing between "ignore the param" and "400 Bad Request". PR #26 added the analogous guard on the _client_ side only (`parseNumericParam` in `products-content.tsx`, commit `a7faf75`), so the API is reachable unguarded by any direct caller or crawler. (Low value, Low effort) `[possible-dup-of: "Fix getPagination() NaN propagation" — BACKLOG.md:292, under [2026-02-10] From: TASK-029 → Origin: feat/task-028-test-coverage branch]` — same NaN-propagation class in the same file, but a distinct defect: that one is `parseInt` → `Math.max(1, NaN)` → `NaN` page/limit in `getPagination()`; this one is `parseFloat` → `NaN` in the price `where`. Worth fixing in one pass, but neither entry covers the other.

### [2026-08-01] From: TASK-037 product page redesign (plan extraction)

- 🟤 **Restore «У вибране» on the PDP when wishlist ships** — TASK-037 omitted the reference's
  «У вибране» affordance under the no-dead-links rule (spec §7 ledger #2); when TASK-041 builds
  wishlist, add the heart action back to the buy panel's share row per `Mirox Product.dc.html`.
  (Low effort) `[relates-to: TASK-041]`
- 🟤 **Admin product form has no `styleGroup` field** — colorway linking (TASK-037) is seed-only;
  `ProductForm.tsx` can't set/edit `Product.styleGroup`, so admins can't link colorways without
  DB access. Add the field to the admin form + validation schema. (Med value, Low effort)
  `[relates-to: TASK-037]`

### [2026-08-03] From: TASK-037 visual gate (user feedback)

- 🔵 **Real «Купують разом» bundle discount** — the PDP bundle shows an honest sum (strikethrough
  only from genuine comparePrices) because checkout recomputes prices server-side; a PDP-only
  discount would display a price checkout won't honor. When TASK-046 (promo codes: schema, admin
  CRUD, checkout application) / TASK-047 (promotions incl. bundles) build server-side discount
  infrastructure, wire a real bundle discount into the PDP total. Decided at the TASK-037 visual
  gate 2026-08-03 (user chose honest-sum-now). (Med value) `[relates-to: TASK-046, TASK-047]`

### [2026-08-03] From: TASK-037 completion (plan extraction)

- 🟤 **Site-wide React hydration console errors (#418/#423/#425) in prod builds** — identical
  signature on untouched pages (homepage included), so pre-existing, not TASK-037's. Prime suspect:
  a server/client divergence in rendered text — e.g. `formatPrice()`'s `Intl.NumberFormat("uk-UA")`
  NBSP output differing between the Node and browser ICU builds (TASK-057-era). Diagnose with a
  React dev build (full hydration diff), fix the source, and assert a clean console in an E2E
  check so the class can't return. (Med value, Med effort) `[relates-to: TASK-057]`
- 🟤 **Add `.gitattributes` to pin line endings** — `prisma/schema.prisma` is CRLF while the rest
  of the repo is LF; TASK-037's migration task had to preserve CRLF by hand and any contributor's
  editor/autocrlf can silently rewrite the file into a noisy whole-file diff. Pin `* text=lf` with
  an explicit exception (or normalize schema.prisma to LF once, in its own commit). (Low effort)
- 🟤 **Sweep `text-[#737373]` literals to the registered `text-faint` token + fold QuickViewDialog's
  inline size-ranking into `product-display.ts`** — the token exists but TASK-036/037 files carry
  hex literals (PDP breadcrumb/dates among them); QuickViewDialog still ranks sizes with its own
  inline comparator instead of `rankSizeValues()`. One mechanical sweep retires both drifts.
  (Low effort) `[relates-to: TASK-034]`
- 🟤 **Legacy colorway swatches are bare `<span>`s with no accessible description** — the
  informational (non-link) extra-Color swatches on the PDP render colour only visually; add
  `role="img"` + `aria-label` with the colour name. (Low effort) `[relates-to: TASK-037]`

### [2026-08-04] From: Weekly planning steer (user-raised)

- 🔵 **Finish the rebrand — stale design/language/data sweep** — user directive at the 2026-08-04
  weekly brainstorm: several surfaces still carry pre-Mirox design and English copy — cart page
  ("Shopping Cart"/"Proceed to Checkout"), CartDrawer, checkout (3-step shell with English
  "Standard/Express/Overnight Shipping" USD options), auth login/register, account pages
  ("My Account"/"Order History" + the 500ing order detail), newsletter confirm/unsubscribe,
  root error/404 pages, and transactional emails ("Order Confirmation", "Store" branding).
  Data side: prod re-seed still user-gated (prod PDPs on the legacy colorway path) and the USD
  shipping constants. **Promoted same day** into [WEEKLY.md](WEEKLY.md) (week of 2026-08-03)
  groups G1/G2/G4/G5 + gated 🟡 P1; admin surfaces deliberately excluded (customer-facing
  first — admin visual pass remains the separate 🟤 entry above). (High value, M effort)

### [2026-08-04] From: G1 cart & drawer restyle (PR #28)

- 🟤 **`StyleSibling.colorValue` is the last nondeterministic colorway pick** — PR #28's review
  fixed the `companionSelect` and `/api/products` variant queries with the
  `[{ createdAt: "asc" }, { id: "asc" }]` tiebreaker (matching the main PDP query), but the
  sibling-swatch query (`src/app/(shop)/products/[slug]/page.tsx` ~L75:
  `where: { name: "Color" }, take: 1`, **no `orderBy`**) still lets the database make the
  arbitrary pick — the strongest form of the bug since `take: 1` leaves no client-side rows to
  disambiguate. Pre-existing from TASK-037 (`aeb5495`); drives the PDP sibling-swatch label.
  One-line fix + consider a shared `COLOR_VARIANT_ORDER_BY` constant so a fifth site can't
  regress. (Low effort) `[relates-to: TASK-037]`
- 🟤 **Local-dev-only E2E flake list has grown — document the full set in one place** — G1's
  verification proved (like-for-like `git worktree` control on `main`) that webkit's
  `cart.spec.ts` trio ("can add product to cart", "cart page shows empty state", "cart persists
  on page reload") fails against `next dev` via the same on-demand-compile/Fast-Refresh
  navigation race already catalogued for other specs; chromium's "can view product details"
  joined the known list this week. CI's prebuilt `next start` is unaffected (PR #28 CI green,
  chromium + webkit). Consolidate the now-5+ known local-dev-only failures into one reference
  (test file + trigger + evidence link) so each future branch stops re-diagnosing them.
  (Low effort) `[possible-dup-of: 2026-08-01 "Pre-existing E2E failures on main" entry]`
- 🟤 **Local dev-server credentials login silently fails without `AUTH_TRUST_HOST=true`** —
  G1's staleness audit hit `MissingCSRF` logging in as a seeded customer against `next dev` on
  port 3001; setting `AUTH_TRUST_HOST=true` for the run fixed it. CLAUDE.md documents the var
  only for CI E2E; the local prod-mode gap is already BACKLOG'd ([2026-07-16] entry) — this adds
  the dev-mode-login facet. Doc fix. (Low effort)
  `[possible-dup-of: 2026-07-16 AUTH_TRUST_HOST entry]`
- 🟤 **`/categories` + `/categories/[slug]` missed the rebrand sweep** — G1's staleness audit
  found both pages still carry pre-Mirox chrome and English copy ("Categories", "Browse our
  products by category", empty-state strings); they're in no current WEEKLY group (G2 =
  checkout, G4 = auth/account/newsletter/error). Either fold into G4's Thursday sweep if slack
  allows or schedule next week with the launch-push visuals. (Med value, S effort)
- 🟤 **`/account/addresses` and `/account/settings` are dead 404 links** — `/account` links to
  both; neither route exists. Audit-confirmed. Either build stubs in G4's account sweep, drop
  the links, or fold into TASK-056's content round-trip (addresses need real legal/contact
  decisions anyway). (Low effort) `[relates-to: TASK-056]`
- 🔵 **Promo-code field: launch-time acquisition tracking rationale (user, 2026-08-04)** — at
  the G1 visual gate the user flagged that the promo field (deliberately excluded from G1,
  handoff slot preserved) "will be useful for us at the start and will allow us to track where
  our users are coming from" — i.e. TASK-043's promo work is not just a discount mechanism but
  the launch attribution channel. Weight TASK-043's priority accordingly when v1.4 is planned.
  (Med value) `[relates-to: TASK-043]`

### [2026-08-06] From: G2 brainstorm / client steer

- 🟤 **create-order hardening bundle** — the COD endpoint has no server-side double-submit
  protection (the Stripe path had paymentIntent uniqueness); client-side button disabling only.
  When order volume makes abuse plausible, land: an idempotency token and a CSPRNG order-number
  suffix — `generateOrderNumber()` uses `Math.random()` (`stripe.ts:70`, the file's still-live
  export, so the dormant-file invariant needs a carve-out there). **Different trigger for the
  ownership/email check on the public confirmation page**: order PII sits behind the
  order-number capability URL alone, so that piece is a privacy item and must land **before
  real customer traffic**, not on the volume trigger (PR #29 r6 caveat).
  [G2 spec §4 + PR #29 review rounds 2/6]
- 🟤 **Dormant Stripe path: retire or revive decision** — `create-payment-intent`,
  `confirm-order`, `PaymentForm.tsx`, `stripe.ts`, `stripe-client.ts` are unreferenced by the
  live checkout since G2. Decide at TASK-048 time whether they're the revival base (LiqPay
  adapter) or dead code to remove. Until then they must stay untouched. On revival, re-audit
  phone requiredness: `create-payment-intent` inherits the shared `checkoutSchema`, whose
  `phone` became required in G2. [G2 spec §5]
- 🟤 **Stripe-Elements dark-theme BACKLOG note is moot for checkout** — the existing entry about
  Elements' dark theme being unverifiable locally no longer applies to the live checkout (no
  Elements rendered); annotate that entry rather than delete (dormant path may return). [G2]
- 🔵 **Free-shipping threshold revisit** — with real UAH shipping amounts now charged
  (80/120/70), the retracted «безкоштовна доставка від X грн» announcement becomes
  implementable the day the client confirms a threshold (site.ts announcement + shipping.ts
  price rule + honest copy). Client-gated. [G2 / TASK-056]
- 🟤 **create-order stock decrement lacks a sufficiency guard** — no `stock: { gte: quantity }`
  condition; concurrent low-stock COD orders can oversell/drive stock negative. A correct fix
  needs conditional updates + rollback semantics, not a one-liner (PR #29 r6 ruling). (Fixed
  in-branch along the way: variant-ownership + phantom-decrement — r3; per-line `quantity`
  `.max(100)` cap — r6.) [G2 task-4 review + final review + PR #29 r3/r6]
- 🟤 **COD orders store currency "USD" (schema default) on UAH amounts** — create-order doesn't
  set `Order.currency`; with no Stripe involvement in the COD path the documented USD-mismatch
  rationale no longer applies. Set `currency: "UAH"` on COD orders when touched next (TASK-048
  context). [G2 task-4 review]
- 🟤 **Seed orders lack G2-shaped fixtures** — all 7 seeded orders have `shippingMethod: null`
  and a legacy address shape (`fullName`/`addressLine1` vs the checkout's `name`/`line1`), so
  confirmation-page legacy/NP rendering can't be exercised from seed data alone. Add one order
  with a legacy method id + one NP-era COD order. [G2 task-7 verification]

### [2026-08-07] From: G2 post-gate review (user Q&A)

- 🔵 **Guest order tracking** — guest COD orders (`userId: null`) are invisible in
  `/account/orders`; the confirmation CTA is now hidden for guests, but there is no way for a
  guest to check an order later. Add lookup by order number + email, and/or claim-by-email on
  registration. Recommended before real launch. (High value, Med effort) [user Q4, 2026-08-07]
- 🔵 **Nova Poshta branch drop-down selector** — replace the free-text «Відділення / адреса»
  with the standard city → warehouse-list picker driven by the NP address API (needs the
  client's NP API key). Explicit scope addition for the delivery integration task. (High value)
  `[relates-to: TASK-049]` [user Q1, 2026-08-07]
- 🔵 **Verify prod email config** — order emails silently skip when `RESEND_API_KEY` is unset
  (by design); confirm the key + `EMAIL_FROM` on a Resend-verified domain exist in Vercel prod
  env, else receipts never send. Natural home: G5 transactional-emails group. (High value, Low
  effort) [user Q6, 2026-08-07] **RESOLVED by G5 (2026-08-10, PR #33)**: verified with the user —
  both vars were ABSENT (prod emails had never sent); `RESEND_API_KEY` set 2026-08-10,
  `EMAIL_FROM` interim `onboarding@resend.dev` (delivers only to the Resend owner's inbox); real
  customer delivery chains behind the domain purchase → TASK-056 checklist items (domain +
  email-sending config). Full record: G5 plan's Task-8 journal.
- 🟤 **Variant-name UA rename task** — seed variants are `"Size"`/`"Color"`, so receipts/emails
  show «Size: M» on Ukrainian pages. Renaming is NOT seed-only: 12+ call sites filter by
  `v.name === "Size"/"Color"` (ProductCard, QuickViewDialog, PDP page + client, styleGroup
  colorway lookups). Needs: seed rename to «Розмір»/«Колір» + all call sites (or a
  variant-name constant) + user-gated prod re-seed. (Med value, Med effort)
  `[relates-to: TASK-039]` [G2 gate comment ruled hold-off, 2026-08-07] **Un-held + scheduled
  2026-08-11** (user steer) → WEEKLY [G14](WEEKLY.md) member 1; prod re-seed = gated P2.
- 🟤 **eslint flat-config `globalIgnores` misses `playwright-report/`** — when the E2E artifact
  dir exists locally, repo-wide lint drowns in thousands of phantom errors from generated JS
  (same failure class as the PR #24 vendor-JS lesson). Add the dir to `globalIgnores` in
  `eslint.config.mjs`. (Low effort) [G2 post-gate fix wave, 2026-08-07]
- 🟤 **React-Compiler lint diagnostics surface lazily on edit** — the compiler-backed
  react-hooks rules bail per-component and report one diagnostic at a time, so editing a file
  can surface errors that were latent on the previous commit (PR #29 r5: `form.watch` →
  `incompatible-library` warning, then `setMounted`-in-effect → `set-state-in-effect` ERROR,
  each only after the prior fix). Checkout page now uses `useWatch` + a `useSyncExternalStore`
  hydration gate. Corrected census (r6): five hydration-gate sites remain — four already carry
  `eslint-disable-line react-hooks/set-state-in-effect` suppressions (cart page, CookieConsent,
  CartDrawer, product-detail-client's `setHydrated`) and only Header.tsx is unsuppressed/latent.
  Sweep = replace four suppressions with the `useSyncExternalStore` gate + fix Header.
  (Med value, Low effort) [PR #29 review rounds 5–6, 2026-08-07]

### [2026-08-08] From: G3 params fix (spec §5)

**Origin**: G3 design decision — browser-level regression coverage deferred out of the 2 SP box. 🟤 Auto-Generated.

- 🟤 **E2E auth/login helper + authenticated smoke tests for dynamic `[id]` routes** — the four
  client routes fixed in G3 (`/admin/orders/[id]`, `/admin/products/[id]`, `/admin/suppliers/[id]`,
  `/account/orders/[id]`) are covered by RTL render tests only (`tests/unit/dynamic-route-params.test.tsx`);
  middleware redirects unauthenticated visitors, so Playwright cannot reach these pages without
  login infrastructure. Build a reusable login helper (admin + customer, seeded credentials) and
  smoke tests loading each route (expect 200 + rendered detail view). (Med value, Med effort)
  [G3 spec §2/§5, 2026-08-08]
- 🟤 **Navigation hooks are typed nullable project-wide by the pages-router compat reference** —
  `next-env.d.ts` references `next/navigation-types/compat/navigation` because the repo keeps
  `pages/_app.js`/`_document.js`/`_error.js` stubs (added during the Jan 2026 Next 14/React 18
  downgrade), so `useParams`/`usePathname`/`useSearchParams` all return `| null` in TypeScript
  even in App Router code — this is why the G3 fix needs `useParams<{ id: string }>()!`.
  Follow-up: determine whether the `pages/` stubs are still load-bearing; if they can go, the
  compat reference disappears on the next `next-env.d.ts` regen and the four `!` assertions can
  drop. (Low value, Low effort) [G3 fix-round adjudication, 2026-08-08]
- 🟤 **`Textarea` drops refs — react-hook-form cannot focus admin product fields** — the browser
  console shows `Function components cannot be given refs` for `Textarea` on
  `/admin/products/[id]`; pre-existing (surfaced during G3's Task-4 browser pass, not introduced
  by it). Confirmed cause: `src/components/ui/textarea.tsx` is a plain function component
  (React-19-era shadcn) while sibling `input.tsx` wraps `React.forwardRef` — on React 18.3.1 the
  ref from `{...register("shortDesc")}` / `{...register("description")}` (`ProductForm.tsx`) is
  not just warned about but dropped, so RHF holds no element for those fields and cannot
  focus/scroll to them on validation error. Fix is one line of `forwardRef` symmetry with
  `Input`; the ROADMAP'd React 19 upgrade retires the warning on its own, so if the upgrade
  lands first this entry closes with it. (Med value, Low effort)
  [G3 Task-4 browser pass; cause confirmed PR #30 review round 2, 2026-08-08]

### [2026-08-08] From: G4 brainstorm

**Origin**: G4 design brainstorm (spec `2026-08-08-g4-peripheral-surfaces-design.md`), scope-boundary
decisions that were deliberately left out of the sweep. All 🟤 Auto-Generated.

- 🟤 **Restore account «Адреси»/«Налаштування» nav links + overview cards when
  `/account/addresses` and `/account/settings` are built** — G4 removed both links from
  `(shop)/account/layout.tsx`'s nav (and their overview-page cards) under the no-dead-links
  rule; a code comment in `account/layout.tsx` marks the spot and points back here. Companion
  to the `[2026-08-04]` G1 entry "`/account/addresses` and `/account/settings` are dead 404
  links," which this task resolved by removing the links — same TASK-056 content gap, now
  documented on the other side of it. (Low value, Low effort) `[relates-to: TASK-056]`
- 🟤 **Products↔categories sort-set unification** — `/products` (TASK-036) and
  `/categories/[slug]` carry independent sort-option sets; sharing one options list (and
  `getSalesRanking()`) is a deliberate behavior change, out of G4's copy-only scope (spec §3.1
  keeps categories chrome inline for this reason).
  `[possible-dup-of: categories→catalog redesign, 2026-08-09 visual-gate group]` — subsumed if
  that redesign lands, since it retires `category-client.tsx` outright. (Low value, Low effort)

### [2026-08-09] From: G4 execution

**Origin**: `.superpowers/sdd/2026-08-08_g4-peripheral-surfaces/progress.md` — findings surfaced
by implementers/reviewers while executing the G4 plan's 15 tasks. All 🟤 Auto-Generated.

- 🟤 **`NODE_ENV=development` in `/etc/environment` — a third source beyond the two TASK-057
  removed** — devcontainer `containerEnv` and `.env.example`'s own line were fixed in
  TASK-057; `/etc/environment` carries an independent third copy that corrupts responsive
  (`sm:`/`md:`/`lg:`/`xl:`) Tailwind utilities in a **local** `next build`'s compiled CSS the
  same way (dev server and Vercel unaffected). Found during Task 13's full-suite verification.
  Remove or override the file; CLAUDE.md's Known-challenges note now documents this third
  source (this task). (Low value, Low effort)
- 🟤 **Newsletter confirm page: `useEffect` fetch has no stale-response guard** — React
  Strict-Mode's dev double-invoke fires the confirm fetch twice; the token is consumed by the
  first call, so the second 404s (`INVALID_TOKEN`) and clobbers the success render with an
  error. Reproduced during the Task 14 visual gate. Pre-existing shape (a single unguarded
  `useEffect` fetch), preserved unchanged by G4's `StatusScreen` conversion — add a
  cancellation/ignore-stale-response guard (e.g. a `cancelled` flag or `AbortController`) to
  `src/app/newsletter/confirm/page.tsx`. (Med value, Low effort)
- 🟤 **Tailwind v4 arbitrary grid-template values with nested commas silently produce no CSS
  rule in this repo** — verified absent from compiled CSS for both
  `grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]` and
  `[grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]`; the account overview grid
  ships an inline-`style` fallback instead (Task 14 gate revision, commit `1ad7a9e`).
  Root-cause the parser behavior (the un-escaped comma inside the arbitrary-value bracket is
  the prime suspect) and audit the repo for other comma-carrying arbitrary values that may be
  silently no-op'ing the same way. (Med value, Med effort)
- 🟤 **Scripted client-side `signIn()` fails with `MissingCSRF` even under the documented
  `AUTH_TRUST_HOST` workaround** — the Task 14 visual gate needed a real customer session to
  capture `/account/**`; `AUTH_TRUST_HOST=true` plus a matched `NEXTAUTH_URL` (the existing
  documented workaround) still rejected a scripted `next-auth/react` `signIn()` call. Worked
  around by fetching a CSRF token and POSTing directly to `/api/auth/callback/credentials`.
  `[possible-dup-of: the AUTH_TRUST_HOST local-login entry, 2026-08-04 G1 group]` — this is a
  nuance extension (scripted/programmatic login specifically), not a new base fact. (Low
  value, Low effort)

### [2026-08-09] From: G4 visual gate (user)

**Origin**: user feedback at the G4 visual-consistency gate (Task 14). Both 🔵 User-Flagged.

- 🔵 **Categories→catalog redesign** — `/categories/[slug]` becomes a thin 307 redirect to
  `/products?category=<slug>`; a DB-driven category facet in the catalog `FilterBar` (parent
  groups with children, auto-grows with new categories); retire `category-client.tsx` (~436
  lines); fix the parent-category rollup in the products API (parent slug should match
  descendants' products — see the entry below); consider a desktop «Категорії» nav entry (the
  user couldn't find the entry point during the gate). User-proposed at the G4 visual gate,
  2026-08-09; next-week WEEKLY candidate (~5 SP). (High value, Med effort) **Scheduled
  2026-08-11** → WEEKLY [G12](WEEKLY.md) 🏆 stretch (week of 2026-08-10); the rollup entry below
  rides along as its member 3.
- 🔵 **Parent-category «Всі» shows 0 products** — `/api/products`'s
  `where.category = { slug }` (`src/app/api/products/route.ts:70-71`) matches only the exact
  category, with no child rollup, while the `/categories` cards DO roll up counts — so a
  top-level page (e.g. `/categories/odyah`, `/categories/aksesuary`) claims N товарів on its
  own card but lists zero products when visited. Launch-visible.
  `[possible-dup-of: the categories→catalog redesign entry above — its rollup fix resolves this]`;
  ship as a standalone fix if the redesign slips. (Med value, Low effort) **Scheduled
  2026-08-11** into WEEKLY [G12](WEEKLY.md) as member 3 (🏆 stretch); the standalone escape hatch
  stands if the stretch slips.

### [2026-08-09] From: G4 final review

**Origin**: final branch review of `feat/g4-peripheral-surfaces` before merge. One 🟤
Auto-Generated finding — recorded so G4's "converted to Ukrainian" scope isn't overstated.

- 🟤 **SEO/metadata layer still English on converted surfaces** — `src/lib/seo.ts:229-235`
  `getAuthMetadata` emits "Sign In"/"Create Account" titles + EN descriptions on the Ukrainian
  login/register pages; `src/app/(shop)/categories/[slug]/page.tsx:56` emits
  `title: "Category Not Found"`, lines ~79-80 emit JSON-LD breadcrumbs "Home"/"Categories"; the
  whole seo.ts metadata layer is EN by pre-existing convention. G4 deliberately did not own
  metadata (rendered strings only) — recording the exception so "G4 = no EN left" never
  propagates unqualified; natural home is TASK-039 i18n. (Low-Med value, Low effort)
  **Shipped 2026-08-15** → PR #37 (TASK-039 T8, in-plan ruling: the fixed set joined G9): auth
  titles, «Категорію не знайдено»/«Товар не знайдено», breadcrumbs and the rest of the
  user-visible set are UA via async `getTranslations` helpers. Machine-metadata residue
  (og:locale, availableLanguage, unreachable EN fallback, alternates.languages) continues as
  the 🟤 entry in the [2026-08-15] G9 close-out group below.

### [2026-08-09] From: G4 completion

**Origin**: completion-workflow extraction after PR #31 merged (`eb630f4`) — final-review minors
deliberately not fixed in-branch plus a docs-index gap found during Task 15's freshness pass.

- 🟤 **Newsletter outcome codes: shared constant between routes and content tests** — the three
  newsletter routes hardcode their `code` strings and `tests/unit/content.test.ts` re-enumerates
  the same strings in its "covers every code the API emits" lists; a code added to a route later
  fails nothing and silently lands on the generic fallback (safe, but the test names overstate).
  Export the code sets from a shared module (or the routes) and iterate those in both the routes'
  types and the coverage tests so they self-true. Final-review minor #3 on PR #31. (Low value,
  Low effort)
- 🟤 **WEEKLY-group archived plans missing from docs/README.md's Archived Plans table** — the
  table indexes TASK-NNN plans through TASK-037, but G1/G2/G3's archived plans (and now G4's
  `2026-08-08_g4-peripheral-surfaces.md`) are absent. Surfaced by Task 15's docs-freshness pass
  and left per follow-existing-convention; decide the convention (index WEEKLY-group plans too,
  or note the table's TASK-only scope) and apply in one sweep. (Low value, Low effort)
  **Re-surfaced 2026-08-10 by the PR #32 review** as an instance of the same drift class G6's
  Spawned row 3 propagates outward (the bidirectional docs-index check). Verified still open:
  `docs/README.md:96` is the last archived-plan row (TASK-037) and four G-group plans sit in
  `docs/archive/plans/`. Kept as the single in-tree entry — the Spawned row cites it as its
  worked example rather than duplicating it.

### [2026-08-10] From: G6 Weekly Reviews (first run)

**Origin**: the standing ⚪ Overhead batch's first run in this repo — design
[2026-08-10-g6-weekly-reviews-design.md](../superpowers/specs/2026-08-10-g6-weekly-reviews-design.md),
verdict rows in [REVIEW-QUEUE.md](REVIEW-QUEUE.md). Entries here are incidental findings surfaced
while evaluating candidates; they route 🟤 by the source rule, independent of any slot's verdict.

- 🟤 **Email templates have no `lang` attribute on their `<html>` root** — both
  [src/lib/email.ts](../../src/lib/email.ts) (order confirmation) and
  [src/lib/email-templates/newsletter-confirmation.ts](../../src/lib/email-templates/newsletter-confirmation.ts)
  open with a bare `<html>`. Harmless while the copy is English, but G5 converts both to
  Ukrainian, and an unlabelled root leaves screen readers and mail clients guessing at language
  for hyphenation, pronunciation and font selection. Add `lang="uk"` (and a `<title>`) as part of
  G5's conversion. Surfaced by the slot-1 `email-best-practices` read; distinct from the
  [2026-08-07] 🔵 "Verify prod email config" entry, which covers provisioning, not markup.
  (Low value, Low effort) `[relates-to: G5]` **RESOLVED by G5 (PR #33, 2026-08-10)**: both
  templates render through the shared shell (`src/lib/email-templates/layout.ts`) with
  `<html lang="uk">` + UA `<title>`, asserted by `tests/unit/email-templates.test.ts`.
- 🟤 **TASK-039 design input: next-intl's `useExtracted` + its "don't let agents translate"
  guidance** — next-intl's official AI-agent workflow page documents `useExtracted`, a hook
  purpose-built for agents that writes messages **inline at the usage site** and auto-extracts
  them into catalogs. That is a different model from this repo's `src/content/*.ts` layer, which
  was deliberately built as "extraction-ready" for a `useTranslations` + catalog migration — so
  TASK-039 should weigh the two rather than default to the assumed one. The same page advises
  **against** having agents translate message catalogs (missing context and nuance) and points to
  professional translation, which matters here because the storefront is Ukrainian-first and the
  client supplies copy. Source: <https://next-intl.dev/docs/workflows/agents> (fetched
  2026-08-10). (Med value, Low effort) `[relates-to: TASK-039]`
- 🟤 **Markdown: an inline code span carrying list-marker syntax across a line break makes Prettier
  oscillate** — extracted at completion. Writing `` `- [ ] README updated if needed` `` inside a
  wrapped list item put `format:check` into a state `--write` could not fix: Prettier's list parser
  re-indented the continuation line on every pass and never reached a fixed point, so the CI Lint
  job failed on a file the formatter had just "fixed" (PR #32, `53fa347`). This will recur — the
  planning docs quote checklist items routinely. Cheapest mitigations, pick one: keep such quotes
  as plain text, or force the code span onto a single line. Worth a line in the docs conventions
  and, if the docs-freshness linter lands, a fixed-point assertion (`prettier --write` twice, diff
  must be empty) rather than a single clean `--check`. (Low value, Low effort)
  `[relates-to: docs-hygiene automation entries]`
- 🟤 **Generalize the count/attribution re-check beyond the Weekly Reviews recipe** — extracted at
  completion. PR #32's review found 6 issues, and **3 shared one root cause**: a count or an
  attribution written once and never re-read against the artifact it describes. The fix landed as
  step 5 of `REVIEW-QUEUE.md`'s run recipe, which only binds that batch — but the same class
  produced G3/G4's docs-freshness recurrences (#8/#9) and the six-times-caught index-row drift, so
  it is not G6-specific. Decide where it belongs repo-wide: a line in the completion workflow, an
  extension of the OVERDUE docs-freshness linter's scope, or both. Note the reviewer's framing,
  which is the reason this is not just "remember harder": a convention a run can state and then
  violate one slot later is not yet a control. (Med value, Low effort)
  `[relates-to: docs-freshness linter (OVERDUE), [2026-08-09] G4 completion entries]`
- 🟤 **Shrink CLAUDE.md to durable rules and move the rest into path-scoped `.claude/rules/`**
  — _the run's one `adopt`._ Measured: project `CLAUDE.md` is **350 lines** against Anthropic's
  documented "target under 200 lines per CLAUDE.md file… longer files consume more context and
  reduce adherence", and **232 of those 350 lines (66%)** are the Architecture tree, Detected
  Patterns and Git Insights sections — exactly the derivable content `/doctor`'s trim check is
  documented to cut while keeping pitfalls, rationale and conventions. `.claude/rules/` does not
  exist in this repo. Two steps: (1) run `/doctor` and take its proposed trims; (2) move the
  surviving path-specific guidance into `.claude/rules/*.md` with `paths:` frontmatter (e.g.
  admin surfaces, `tests/**`, `prisma/**`, `src/content/**`), so it loads only when Claude touches
  those files. **Preconditions verified** against the installed CC **2.1.226**: the invalid-`[`
  glob bug that made Read fail for every evaluated file was fixed in 2.1.207, and the
  brace-expansion startup crash in 2.1.217 — both clear. **Known trade-off to design around**:
  rules with `paths:` frontmatter are **not** re-injected after `/compact`; they reload only when
  Claude next reads a matching file, so anything that must survive compaction stays in CLAUDE.md.
  This also discharges the standing global-CLAUDE.md obligation to audit a project file whenever
  it crosses ~200 lines. Source: <https://code.claude.com/docs/en/memory> (fetched 2026-08-10).
  (High value, Med effort)
  **↑ Second axis added 2026-08-15 (G10 run 2, slot 2 — evidence, not a new entry).** The
  argument above is purely about **length**. Anthropic's ["The new rules of context engineering
  for Claude 5 generation models"](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)
  (2026-07-24) argues the more costly problem is **over-constraint**: it reports that over 80% of
  Claude Code's own system prompt was removed for newer models with no performance loss, and it
  replaces rigid directives with judgement — its worked example swaps _"Default to writing no
  comments. Never write multi-paragraph docstrings"_ for _"Write code that reads like the
  surrounding code: match its comment density, naming, and idiom."_ So when this entry is worked,
  trim for **character as well as length**: rules stated as fixed counts (minimums, every-N-lines
  checkpoints) are the shape the post says to convert to judgement. Note the same critique lands
  harder on the **global** `~/.claude/CLAUDE.md` than on this repo's file, and this repo has no
  sink for global-config work — recorded against Convention 7's re-trigger in REVIEW-QUEUE.md.

### [2026-08-10] From: G5 prod email config round-trip (user)

- 🔵 **Production-launch deploy runbook — pre/while/post steps** — user-raised during G5's prod
  email-config check: a written, executable runbook for the real-domain production cutover, not
  just a task list. Pre (domain purchased + DNS, Resend domain verified + `EMAIL_FROM` flipped
  off `onboarding@resend.dev`, real product content staged, `NEXT_PUBLIC_APP_URL`/
  `NEXT_PUBLIC_STORE_NAME` env review, user-gated prod re-seed plan, legal pages live per §5.3),
  while (domain attach + SSL on Vercel, deploy via the Git integration, migration check —
  `vercel-build` runs `prisma migrate deploy`), post (live smoke pass: homepage/PDP/checkout COD
  order + confirmation email to a real inbox, newsletter double-opt-in round-trip, sitemap/robots
  on the new domain, GA4/GTM firing, Search Console + feed re-registration). The operational
  slice of TASK-054's "Launch readiness"; assemble as a checklist doc the launch day executes
  verbatim. (High value, Med effort) `[relates-to: TASK-054]` [user, 2026-08-10]

### [2026-08-10] From: G5 completion

**Origin**: completion-workflow extraction after PR #33 merged (`1a4f030`) — final-review minors
deliberately deferred in-branch.

- 🟤 **Email links need a base-URL helper** — the order email's account CTA renders
  `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`, which becomes `undefined/account/orders`
  when the var is unset (pre-existing pattern; prod var is set). Centralize a `getBaseUrl()`
  (seo.ts already carries the `NEXT_PUBLIC_APP_URL || localhost` fallback) and use it for all
  email hrefs. Final-review minor on PR #33. (Low value, Low effort)
- 🟤 **Email polish batch: escape `orderNumber`, regroup test imports, narrow contacts type** —
  `orderNumber` is the one unescaped interpolation in the order template (server-generated
  `ORD-` + base36, zero injection risk today — a defensive `escapeHtml` makes the escaping rule
  exceptionless); `tests/unit/email-templates.test.ts` accumulated mid-file imports from the
  TDD append flow (ESLint-clean, tidy on next touch); `emails.order.contacts` widens to a
  union type where a small shared interface would be cleaner. Also (PR #34 r2 hygiene note):
  the stalled-send test's persistent `mockImplementation` survives `clearAllMocks()` — safe only
  as the file's last test; switch to `mockImplementationOnce` before appending tests below it.
  Final-review + task-review minors on PR #33, all triaged defer. (Low value, Low effort)

### [2026-08-11] From: PR #34 review

**Origin**: review of the order-email await hotfix — one residual risk the bounded timeout does
not close, plus a dormant-route parity gap surfaced while verifying the fix.

- 🟤 **Checkout duplicate-order guard (idempotency)** — the awaited send sits after the
  `$transaction` that creates the order and decrements stock; on an ambiguous failure (timeout,
  network) the client correctly keeps the cart and re-enables submit, so a user retry creates a
  duplicate order. The 10s send bound (PR #34) shrinks the window but only idempotency closes it:
  client-generated idempotency key on `create-order` (or order-number-based dedupe) so a retry
  returns the existing order. Repo-wide grep for `idempoten` is empty today. (Med value, Med
  effort) `[relates-to: G2 hardening bundle]`
- 🟤 **`confirm-order` hardening parity with `create-order`** — the dormant Stripe path never
  received PR #29's fixes: no `isActive` filter on the product lookup, no `.max(100)` quantity
  cap, and the stock-decrement loop iterates raw `data.items` instead of the validated
  `orderItemsData` (a dropped line throws Prisma P2025 and rolls back the just-created order).
  Also missing: an await-regression race test for its email send (PR #34 fixed the code, tested
  only create-order). Exploitation needs a `succeeded` Stripe intent, so dormancy shields it —
  do this before TASK-048 revives the route. (Med value, Low effort) `[relates-to: TASK-048]`

### [2026-08-11] From: manual testing

**Origin**: user-raised during manual testing/review of the live site. 🔵 User-Flagged. Two sibling
items from the same batch (feedback form, launch-announcement marquee) were placed in
[TODO.md](TODO.md) § Medium Priority instead.

- [ ] 🔵 **Replace free-text city/branch checkout fields with real carrier, city and branch dropdowns** — Add a delivery-carrier choice (Ukrposhta / Nova Poshta), then city selection and branch (відділення) selection as dropdown menus populated with real options rather than typed text (выбор города, вариант отправки(укр пошта, нова пошта), выбор города и выбор отделения как дропдаун меню с реальными вариантами); affected: [src/app/(shop)/checkout/page.tsx:~392-420](<../../src/app/(shop)/checkout/page.tsx#L392-L420>) (city and `line1` are plain free-text `<Input>`s), [src/lib/shipping.ts:7-11](../../src/lib/shipping.ts#L7-L11) (`DELIVERY_METHODS` hardcodes three Nova Poshta options) [possible-dup-of: "Nova Poshta branch drop-down selector" — [2026-08-07] From: G2 post-gate review]

  **What is genuinely new here versus the [2026-08-07] entry it duplicates**: that entry covers the
  city → warehouse picker for **Nova Poshta only**. **Ukrposhta as a second carrier has zero
  mentions anywhere in this repo** — verified by grep across `src/`, `docs/planning/` and
  `docs/superpowers/specs/`, including the [Ukraine payments & delivery decision
  doc](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md), which evaluated
  Nova Poshta and never assessed Ukrposhta. So this is not a gap in an existing plan but an
  uncosted **carrier-strategy decision**: a second carrier means a second address/branch API, a
  second rate table (the current 80/120/70 UAH numerics are NP published rates), and a second
  fulfilment path for the supplier-forwarding workers. Decide the carrier question before designing
  the picker, since the picker's data source depends on the answer. Both halves stay client-gated —
  the NP branch API needs the client's NP API key, and Ukrposhta would need its own credentials.
  (High value, Med effort) `[relates-to: TASK-049]`

### [2026-08-11] From: Weekly planning steer (user-raised)

- 🔵 **Finish ALL translations + close design-handoff gaps — "user-ready by end of next week"** —
  user directive at the 2026-08-11 weekly-plan review: (1) the admin panel is still fully English
  (deliberately excluded from G4's customer-first sweep) — translate + Mirox-align it; (2) the
  «Size: M» variant labels — **un-holds** the [2026-08-07] 🟤 variant-name rename's G2-gate
  hold-off ruling; (3) "maybe we have not finished redesigning of some pages (due to design
  files)" — settled by auditing the 7 `docs/design/design_handoff_mirox/*.dc.html` files against
  shipped pages (`Mirox Mobile.dc.html` was never tracked as built). Overload accepted by the user
  ("yes, this week will be hard"). **Promoted same day** into [WEEKLY.md](WEEKLY.md) G13 (admin,
  8 SP) + G14 (variant rename + gap audit, 5 SP) + gated 🟡 P2 (prod re-seed). Next week
  (Aug 17–21) is the pre-launch week: client data ask + polish. (High value, L effort)

### [2026-08-14] From: G8 close-out (PR #35/#36 reviews + deployment verification)

**Origin**: the G8 launch-feedback-loop reviews (final whole-branch + two PR review rounds) and
the post-merge production-CSS incident. The polish batch itself went to TODO.md (actionable);
these are the standing improvements.

- 🟤 **Per-IP rate limiting for public POST endpoints** — `api/feedback` and
  `api/newsletter/subscribe` share the gap: no rate limiting exists repo-wide, so both accept
  unbounded anonymous POSTs (feedback's failure domain is the owner inbox; newsletter's is
  Resend sends + subscriber-row churn). Honeypot-only was the accepted G8 launch stance; close
  it before traffic scales. Options: middleware token bucket on Redis, or Vercel WAF rate
  rules. (Med value, Med effort) `[relates-to: G2 hardening bundle]`
- 🟤 **Wide-viewport marquee E2E guard** — the hydration-gated ResizeObserver measurement path
  (`e172413`) is structurally untestable in jsdom (non-hydrating render) and currently has NO
  automated guard; a CI prod-build E2E asserting ≥3 `.marquee-duplicate` copies at a ~2560px
  viewport is the durable check. (Med value, Low effort) `[relates-to: TASK-040 CI extensions]`
- 🟤 **Deploy runbook: served-asset staleness check** — PR #35's READY production deployment
  served byte-identical stale CSS across TWO deploys (fresh HTML render, `x-vercel-cache: MISS`,
  old chunk hash — Vercel's restored build cache short-circuited CSS compilation; a changed
  `globals.css` did NOT bust it; only a cache-off redeploy did). Add to the production-launch
  deploy runbook: after any CSS/JS-affecting deploy, verify the served chunk hash CHANGED vs the
  previous deploy, and keep `VERCEL_FORCE_NO_BUILD_CACHE=1` / dashboard cache-off redeploy as
  the standard remedy. (High value, Low effort) `[relates-to: 🔵 production-launch deploy runbook, 2026-08-10]`

### [2026-08-15] From: PR #37 review chat (dev-console warnings)

**Origin**: user-pasted dev-console warnings during the G9 visual gate, assessed in-chat; the
deferral's missing recording was re-raised by PR #37 review round 4. 🔵 User-Flagged.

- 🔵 **React-19-style `ui/` primitives drop refs on React 18 — `SheetOverlay` warning +
  Sheet/Dialog `aria-describedby` gap** — 22 of 24 `src/components/ui/` primitives are
  React-19-era shadcn plain function components; on pinned React 18.3.1, React strips the ref
  Radix passes (dev console: `Function components cannot be given refs` for `SheetOverlay` on
  every drawer/menu open; worst case an untracked overlay exit animation — prod builds strip
  the warning). Same template class: `SheetContent`/`DialogContent` render without a
  description element (`Missing aria-describedby` ×2). Pre-existing — 0 branch commits touch
  `ui/sheet.tsx`, though PR #37 ships adjacent code (the LocaleSwitcher row and
  `overflow-y-auto` on that same `SheetContent`). Fix: targeted `forwardRef` wrap of the
  ref-receiving primitives (sonner-precedent hand-edit with a re-apply note) plus
  `SheetDescription`/`aria-describedby={undefined}` at usage sites; the ROADMAP'd React 19
  upgrade retires the ref half on its own. (Low value, Low effort)
  `[possible-dup-of: 🟤 Textarea drops refs — react-hook-form cannot focus admin product fields, 2026-08-08]`
  [PR #37 review round 4 re-raise, 2026-08-15]

### [2026-08-15] From: G9 close-out (PR #37 gate Q&A + final-review triage)

**Origin**: the G9 visual gate's scope questions (user, answered in-chat with recommendations)
and the final whole-branch review's deferred minors (agents). First three 🔵 User-Flagged; the
rest 🟤 Auto-Generated.

- 🔵 **DB-content localization decision — RU product copy** — product/category names,
  descriptions and variant values have no locale dimension (G9 spec scope ruling: DB data stays
  UA in RU mode). If wanted: `ProductTranslation`/`CategoryTranslation` tables (locale →
  name/description, RU falling back to UA like the catalog merge) + a second-language tab in
  the admin forms. Doubles the client's per-product content workload — put the question to the
  client in the TASK-056 round-trip (rider recorded there) and build only on opt-in.
  (Med value, High effort) [G9 gate Q2, 2026-08-15]
- 🔵 **Transactional-email localization** — emails are deliberately UA-only (G5 shell,
  `lang="uk"`). Honest design: persist the customer's locale on Order/Subscriber at creation
  (the checkout/subscribe handlers can read `NEXT_LOCALE`; background workers have no request
  context), add an email namespace to the catalogs, thread locale through the shared shell.
  Note: prod cannot email real customers until TASK-056's sending domain lands anyway, so
  nothing is lost by deferring. (Med value, Med effort) [G9 gate Q3, 2026-08-15]
- 🔵 **Zod validation-message localization** — schema messages render UA on forms in RU mode
  (ruled out of G9). Right mechanism is the repo's byCode pattern: schemas emit stable codes,
  clients map code → catalog string (`t.has` guard); server-side `getTranslations` covers
  API-returned messages. Natural G13-era companion. (Low-Med value, Med effort)
  [G9 gate Q5, 2026-08-15]
- 🟤 **Machine-metadata EN corners** — `og:locale: "en_US"`, JSON-LD
  `availableLanguage: "English"`, `getCategoryMetadata`'s unreachable EN fallback, and no
  `alternates.languages`. The non-user-visible residue of the [2026-08-09] G4-final-review
  entry above after PR #37 shipped its user-visible half. (Low value, Low effort)
  [G9 T8 + final review, 2026-08-15]
- 🟤 **G13 duplicate-value sync test** — if G13's `admin.*` namespace duplicates
  `account.orderStatus`/`paymentStatus` label values rather than reusing the keys, add a sync
  test asserting the duplicates stay byte-identical; moot if G13 reuses `account.*` keys
  directly. (Low value, Low effort) [G9 final review, 2026-08-15]
- 🟤 **`seo.breadcrumb` vs `products.breadcrumbHome` consolidation** — two catalog keys carry
  the same «Головна» concept in different namespaces; consolidate to one home.
  (Low value, Low effort) [G9 final review, 2026-08-15]
- 🟤 **AnnouncementBar root-hook polish** — uses root `useTranslations()` with a
  factually-wrong justifying comment; should be `useTranslations("site")` + corrected comment.
  (Low value, Low effort) [G9 T4 review minor, 2026-08-15]
- 🟤 **Root CLAUDE.md tests-tree staleness** — the Architecture tree lists 1 of 6 E2E specs and
  8 of 59 unit files (pre-existing, noted by G9 T11); refresh or generalize the listing so it
  stops implying completeness. (Low value, Low effort) [G9 T11, 2026-08-15]

### [2026-08-15] From: G14 design-gap audit

**Origin**: the user's 2026-08-11 steer ("maybe we have not finished redesigning of some pages")
was settled by auditing all 7 `docs/design/design_handoff_mirox/*.dc.html` files against the
shipped pages (desktop 1440 + mobile 390, incl. the never-tracked `Mirox Mobile.dc.html`).
Specific findings audit-surfaced → 🟤. Full findings table in the G14 plan
(`docs/archive/plans/2026-08-15_g14-rebrand-residuals.md`) and the audit Artifact. Every other
mockup↔shipped delta checked out as already ruled and tracked (eyebrow removal 2026-07-28,
no-dead-links nav/footer truncation → TASK-055, «У вибране» → TASK-041, «Відкрити фото
замірів» → TASK-056, 1-click + промокод → TASK-043, single name field → G2 spec §2). The
audit's one small fix (light blur shimmer → dark) shipped in-branch.

- 🟤 **Mobile «Новинки» rail: horizontal scroll per `Mirox Mobile.dc.html`** — the mobile
  mockup specifies a horizontal-scroll rail of ~160px cards for the homepage «Новинки»;
  shipped `ProductRail.tsx` stacks full-width cards in a 1-col grid below `sm:` (a long
  scroll past 4 tall cards). Confined to ProductRail's responsive classes but changes mobile
  interaction and deserves its own visual-gate round — pre-launch-week candidate. The
  mockup's mobile-PDP contextual header (back arrow + product name) is a related flourish;
  assess it in the same pass. (Med value, Low-Med effort) [G14 audit, 2026-08-15]
- 🟤 **Checkout distraction-free header per `Mirox Checkout.dc.html`** — the mockup gives
  checkout a simplified header (logo + «Захищене оформлення» only, no nav/search/cart/
  announcement); shipped `/checkout` keeps the full storefront chrome incl. the G8 marquee
  (the «Захищене оформлення» note lives in the summary sidebar instead). No G2 ruling
  recorded on this delta (checked spec + plan). Standard conversion practice, but needs a
  checkout-scoped layout and a decision on how far to strip (keep the Кошик stepper link as
  escape hatch?). (Med value, Med effort) [G14 audit, 2026-08-15]

### [2026-08-15] From: G10 weekly reviews run 2

**Origin**: the Weekly Reviews batch's second run — see
[REVIEW-QUEUE.md](REVIEW-QUEUE.md) for the full Reviewed log, verdicts and re-trigger
conditions. Slot 1's official candidate is the run's single `adopt`; the rest is routed to
Next-up parks (`defer`) or recorded as rows only (`pass`).

- 🟤 **Run a `claude-security` deep scan in the pre-launch week** — the run-2 `adopt` (slot 1,
  official). Install `claude-security@claude-plugins-official` (first-party, v0.10.0, Anthropic)
  and run a scoped scan before real customer traffic. It runs entirely in-session at a chosen
  effort tier, hands every candidate finding to independent verifiers told to disprove it, and
  computes the verification tally in code rather than letting the finding-producing model assert
  it. Target surface: auth (NextAuth v5 + middleware), API routes and their `requireAdmin()` /
  `requireAuth()` guards, `/api/checkout/create-order` (guest COD, no auth), the HMAC unsubscribe
  token path, admin routes, and a secrets pass. Preconditions already measured: Python 3.11.2
  (needs ≥3.9) ✅, git checkout ✅. Reports land in a self-gitignoring
  `CLAUDE-SECURITY-<timestamp>/` directory, so nothing is swept into a commit. Pairs with — does
  not replace — the standing G2 hardening bundle (confirmation-page ownership check) that the
  pre-launch week already inherits. (High value, Low-Med effort) [G10 run 2 slot 1, 2026-08-15]

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

| Idea                                                                                                 | Reason for Rejection                                                                                                                                                                                           | Date       |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Database sessions instead of JWT                                                                     | JWT is more scalable for serverless, simpler setup                                                                                                                                                             | 2026-01-13 |
| Live catalog is the old electronics seed with dead images (was under [2026-07-24] visual audit)      | reaped: prod re-seeded to the Mirox catalog 2026-07-31 and again 2026-08-04 (colorways), verified live; catalog is deliberately placeholder — real products arrive at launch deployment (user note 2026-08-04) | 2026-08-04 |
| Prices render in USD vs UAH-facing rebrand (was under [2026-07-21] TASK-035)                         | reaped: `formatPrice()` UAH display shipped site-wide in TASK-057; §7.4 compliance verification remains a TASK-039 AC                                                                                          | 2026-08-04 |
| `?sort=newest` deep links inert until TASK-036 (was under [2026-07-21] TASK-035)                     | reaped: TASK-036 shipped sorting and retargeted all links — zero `sort=newest` left in `src/`                                                                                                                  | 2026-08-04 |
| Header «Бестселери» admin-curated, not sales-ranked (was under [2026-07-29] TASK-057)                | reaped: Header links `/products?sort=popular` (real `getSalesRanking()`) since TASK-036                                                                                                                        | 2026-08-04 |
| Reconcile stale seed counts "16 cat/50+ products" vs 15/21 (was under [2026-07-14] resumption audit) | reaped: TASK-057 replaced the catalog wholesale (8 SKUs, 2+6 categories) and CLAUDE.md documents it — both sides of the comparison no longer exist                                                             | 2026-08-04 |
| Replace site-level placeholder OG image (was under [2026-02-02] TASK-019)                            | reaped: root `opengraph-image.tsx` generated Mirox card shipped in TASK-035/PR #21, verified live                                                                                                              | 2026-08-04 |
| Seed demo reviews (was under [2026-02-05] TASK-023)                                                  | reaped: `prisma/seed-data/reviews.ts` ships 8 reviews since TASK-022, Ukrainian set since TASK-057                                                                                                             | 2026-08-04 |
| [TASK-013] Enhanced Features umbrella (was under Post-MVP Features)                                  | reaped → 🪦 section below: all open subs superseded by program tasks TASK-041/042/046; recommendations shipped as BoughtTogether (TASK-037)                                                                    | 2026-08-11 |
| [TASK-015] Growth Features umbrella (was under Post-MVP Features)                                    | reaped → 🪦 section below: i18n → TASK-039 (WEEKLY G9); analytics dashboard duplicates the [2026-02-01] entry; multi-currency/loyalty = spec v2.0 directions                                                   | 2026-08-11 |
| Extract hardcoded USD to `NEXT_PUBLIC_CURRENCY` env var (was under [2026-02-01] TASK-018)            | reaped → 🪦 section below: superseded by the shipped `formatPrice()`/§7.4 UAH architecture; transaction currency is a TASK-048 decision                                                                        | 2026-08-11 |
| Seed demo products with brand/barcode/MPN for feed testing (was under [2026-02-02] TASK-020)         | reaped → 🪦 section below: electronics demo catalog replaced by the deliberately-placeholder Mirox seed; realistic feed content waits for real products (TASK-054/056)                                         | 2026-08-11 |
| Manual Testing Plan (was the sole "Deferred Tasks" member; section removed with it)                  | reaped → 🪦 section below: implicitly delivered by `docs/TESTING_CHECKLIST.md` (323 lines) + the standing visual-fidelity gate + live user testing rounds                                                      | 2026-08-11 |

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

## 🪦 Reaped Entries (bodies preserved)

Entries reaped from the live sections above — **moved here instead of deleted, by user preference
(ruled 2026-08-11; this is now the standing reap convention for this repo)**. Each keeps its full
original body under a struck-through title, with a one-line reason and a matching tombstone row in
the Rejected Ideas table. Checkboxes below are historical — do not promote from this section.

### ~~[TASK-013] - Enhanced Features (Post-MVP)~~ — reaped 2026-08-11

**Reaped because**: every open sub-item has a Mirox-program successor — wishlist → TASK-041,
advanced search → TASK-042, discount codes → TASK-046; product recommendations shipped as
BoughtTogether (TASK-037). _(Was under: Post-MVP Features (Moved from TODO).)_

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

### ~~[TASK-015] - Growth Features (Post-MVP)~~ — reaped 2026-08-11

**Reaped because**: i18n → TASK-039 (in build this week, WEEKLY G9); analytics dashboard
duplicates the [2026-02-01] TASK-018 entry (still live above); multi-currency and loyalty are
spec v2.0 directions. _(Was under: Post-MVP Features (Moved from TODO).)_

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

### ~~Extract hardcoded `"USD"` currency to `NEXT_PUBLIC_CURRENCY` env var~~ — reaped 2026-08-11

**Reaped because**: superseded by the shipped `formatPrice()`/§7.4 UAH architecture (TASK-057);
transaction currency is a TASK-048 decision — an env-var currency switch contradicts the settled
design. _(Was under: [2026-02-01] From: TASK-018 Analytics Integration.)_

- [ ] Extract hardcoded `"USD"` currency to `NEXT_PUBLIC_CURRENCY` env var for multi-currency support

### ~~Seed demo products with brand/barcode/MPN data to test feed~~ — reaped 2026-08-11

**Reaped because**: its premise (the electronics demo catalog) was replaced wholesale by the
deliberately-placeholder Mirox seed; realistic feed content waits for real products at the launch
deploy (TASK-054/056; user ruling 2026-08-04). _(Was under: [2026-02-02] From: TASK-020 Google
Shopping Feed Preparation.)_

- [ ] Seed demo products with brand/barcode/MPN data to test feed with realistic content

### ~~Manual Testing Plan~~ — reaped 2026-08-11

**Reaped because**: implicitly delivered — `docs/TESTING_CHECKLIST.md` is a 323-line "Manual
Testing Checklist" of critical user flows per release, the visual-fidelity gate is standing
practice, and the user's live manual-testing rounds feed TODO/BACKLOG directly (the 2026-08-11
batch). _(Was the sole member of the now-removed "Deferred Tasks (Moved from TODO)" section;
originally deprioritized 2026-01-22 in favor of marketing preparation.)_

- [ ] Develop comprehensive manual testing plan for the website

---

_Promoted items go to [TODO.md](TODO.md)._
_Rejected items stay here with reasoning._
_See [ROADMAP.md](ROADMAP.md) for strategic direction._
