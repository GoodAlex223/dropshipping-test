# Backlog

Ideas and tasks not yet prioritized for active development.

**Last Updated**: 2026-07-15

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

- **Add `sharp` dependency**: CI E2E web-server logs flood with `'sharp' is required to be installed in standalone mode`; `sharp` is absent from package.json. Vercel production unaffected (own image service), but `next/image` optimization is broken on the self-hosted/VPS deploy path and the noise can bury real E2E errors. Fix: `npm install sharp` + one validation run. (Med value, Low effort)
- **Actions Deploy-to-Vercel job is a validated no-op**: with Vercel secrets unset in GitHub, the job runs only "Validate Vercel configuration" and reports green; actual production deploys come from the Vercel Git integration. A green "Deploy" badge without the integration would ship nothing. Either document this as the intended setup or wire the secrets; fold into [TASK-040] CI extensions. (Med value, Low effort) `[relates-to: TASK-040]`

### [2026-07-14] From: TASK-033 Completion

- **Gitignore Playwright artifacts**: `playwright-report/` and `test-results/` are git-tracked generated outputs; every local E2E run dirties the tree (observed throughout TASK-033). Add both to `.gitignore` and remove from tracking. (Med value, Low effort)
- **`.env` hygiene**: deduplicate the two `DATABASE_URL` keys (second points at a live-looking Neon DB alongside Vercel tokens); confirm rotation with owner. Note: `.env` is gitignored and never committed — local-file hygiene, not repo exposure. (High value, Low effort)
- **Add `.superpowers/` to `.prettierignore`**: session scratch files trip `npm run format:check` locally. (Low value, Low effort)
- **CLAUDE.md E2E docs scope**: testing docs list only `navigation.spec.ts`; `cart.spec.ts` and `products.spec.ts` exist. Correct at next CLAUDE.md refresh. (Low value, Low effort)

### [2026-07-14] From: TASK-033 Resumption Audit

**Origin**: docs/planning/plans/2026-07-14_task-033-resumption.md (Task 2 security & dependency audit, feat/task-033-resumption branch)

- [ ] Upgrade Next.js 14 → 16 to clear 14 HIGH advisories against `next@14.2.35` — npm audit fix requires `next@16.2.10` (breaking); advisories include DoS via Image Optimizer (GHSA-9g9p-9gw9-jx7f), HTTP request smuggling in rewrites (GHSA-ggv3-7p47-pfv8), middleware/proxy redirect cache poisoning (GHSA-3g8h-86w9-wvmq), XSS via CSP nonces (GHSA-ffhc-5mcf-pf4q), RSC cache poisoning (GHSA-wfc6-r584-vfw7), SSRF via WebSocket upgrades (GHSA-c4j6-fc7j-m34r), plus 8 further DoS/XSS/cache advisories. Also clears the nested MODERATE `postcss <8.5.10` XSS (GHSA-qx2v-qp2m-jg93) bundled inside `node_modules/next`. Deferred per conservative-update policy (Next.js 14 / React 18 pinned). `[possible-dup-of: [2026-02-09] From: TASK-027 "Upgrade Next.js 14 → 16 + React 18 → 19" — that entry predates most of these advisories; reconcile on promotion]`
- [ ] Monitor @auth/core / next-auth for a release depending on `nodemailer >= 9.0.1` — 6 HIGH nodemailer advisories (SMTP command injection GHSA-c7w3-x93f-qmm8, CRLF injection GHSA-vvjj-xcjg-gr5g and GHSA-268h-hp4c-crq3, file-access bypasses GHSA-wqvq-jvpq-h66f and GHSA-p6gq-j5cr-w38f, TLS validation GHSA-r7g4-qg5f-qqm2) are fixed only in nodemailer 9.0.1+, but `@auth/core@0.41.2` (via `next-auth@5.0.0-beta.31` and `@auth/prisma-adapter@2.11.2`) pins `nodemailer@^7` — no non-breaking fix exists (npm's only "fix" is a downgrade to next-auth@1.x). Practical exposure is low: transactional email goes through Resend (`src/lib/email.ts`); no next-auth email/SMTP provider is configured, so nodemailer is never invoked. Re-run `npm audit` when next-auth v5 GA or a new @auth/core lands.
- [x] ~~Fix WebKit/Mobile Safari-only E2E failure in `tests/e2e/products.spec.ts` ("can filter products by search")~~ — **RESOLVED in TASK-038a.** Originally logged as a "pre-existing product bug" traced to the `handleSearch`/`updateFilters` flow in `src/app/(shop)/products/products-content.tsx`; that claim was **disproved by evidence** and is incorrect — the product code is correct and was never modified. Actual cause: a **test artifact**. The test called `searchInput.fill()` gated only on `isVisible()` (paint), not interactivity. On WebKit engines only, a programmatic `fill()` issued before React hydration produces an `input` event that never reaches React, so `search` state stays `""`; `handleSearch` then calls `updateFilters({ search: "" || null })`, whose falsy branch correctly deletes the (never-set) `search` key, producing `/products?page=1`. Chromium/Firefox/Mobile Chrome don't exhibit this because their pre-hydration synthetic `input` event is still observed by React; confirmed via CPU-throttled Chromium staying un-hydrated yet still passing, and via real (non-programmatic) typing on WebKit passing at all speeds — ruling out a timing race in the product code. Fix: `tests/e2e/products.spec.ts` now waits for `[data-testid='product-card']` (a hydration-only render signal — cards appear from a client-side `fetchProducts` effect that only runs post-hydration) before touching the search input. Verified: 3/3 pass on `webkit` with `--repeat-each=3`, pass on `Mobile Safari`, and reproducibly fails with the old `TimeoutError: page.waitForURL` on `webkit` when the fix is reverted (confirming the test still has teeth). No `src/` changes.
- [ ] Reconcile stale seed-count documentation — CLAUDE.md and older docs state "16 categories, 50+ products," but `prisma/seed-data/categories.ts` / `products.ts` currently define 15 categories / 21 products (seed output matches the seed files exactly; the seed pipeline itself is not broken, only the documented counts are stale). `[possible-dup-of: 2026-02-12 Code Review of TASK-032 entry]`

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
