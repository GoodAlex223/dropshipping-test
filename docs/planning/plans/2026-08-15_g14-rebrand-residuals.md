# G14 Rebrand Residuals Implementation Plan

**Goal:** (1) Rename the variant-name data values «Size»/«Color» → «Розмір»/«Колір» everywhere they exist (seed, prod via migration) and centralize the 13 storefront call-site literals behind one shared constant; (2) audit all 7 `docs/design/design_handoff_mirox/*.dc.html` handoff files against the shipped pages, fixing small gaps in-place and filing larger finds for the pre-launch week.

**Design decision (user-approved 2026-08-15):** prod data renames via a hand-written Prisma **data migration** applied by `vercel-build`'s `prisma migrate deploy` at the next deploy — NOT via the gated 🟡 P2 re-seed. This supersedes the WEEKLY G14 premise "The rename's prod effect requires P2 (user-gated re-seed)"; that line gets a correction in this branch. P2 stays gated for its other purposes.

**Architecture:**

- New dependency-free `src/lib/variant-names.ts`: `export const VARIANT_NAMES = { size: "Розмір", color: "Колір" } as const`. Consumed by all storefront call sites AND `prisma/seed-data/products.ts` (relative import — seed runs under tsx), so seed and code cannot drift apart.
- `variantInfo` on order items is a snapshot built at order creation from the DB name (`${variant.name}: ${variant.value}` in create-order/confirm-order/create-payment-intent). No code change there: new orders emit «Розмір: M» automatically post-migration; **historical order snapshots keep «Size: M» deliberately** (frozen receipts — do not rewrite).
- URL/query params (`?size=`, `?color=`), cart-store field names (`size`, `color`), and Zod schema keys stay English — API/code contracts, not display copy. Cart drawer/page already render catalog labels (`t("variant.size")`) — untouched.
- Migration: `prisma migrate dev --create-only`, hand-written SQL: `UPDATE "ProductVariant" SET "name" = 'Розмір' WHERE "name" = 'Size';` + same for Color. Idempotent by construction (WHERE clause), no schema diff.

**Branch:** `feat/g14-rebrand-residuals`
**No spec file** — bounded path; design approved in chat (see Design decision above + chat log).

## Global Constraints

- TypeScript strict; Prettier/ESLint via pre-commit hooks (never bypass).
- Rename sweep must check **every locator type across all specs** for the renamed strings ([string-renames-must-sweep-locator-types]) — unit fixtures, RTL queries, Playwright locators, snapshot text.
- `scripts/i18n-byte-diff.mjs` guards _removed_ Cyrillic literals; this task only adds Cyrillic — no allowlist entries expected.
- Audit "small gap" = copy/CSS tweaks confined to existing components; anything needing new components, data, or a design decision → BACKLOG `[2026-08-15]`, not built.
- Visual checks: `rm -rf .next` before starting the dev server ([next-dev-serves-stale-next-cache]); do not trust local `next build` CSS (`/etc/environment` NODE_ENV issue); screenshots reach the user via one Artifact ([gate-screenshots-via-artifact]).
- Contacts page: TASK-055, client-blocked — audit notes only, no fixes.

---

### Task 1: Shared constant + storefront literal replacement

- [ ] Create `src/lib/variant-names.ts` with `VARIANT_NAMES` const + doc comment (DB data values; changing them requires a data migration).
- [ ] Replace 13 literals: `src/app/(shop)/products/[slug]/page.tsx` (76, 103, 166, 173, 267), `product-detail-client.tsx` (89, 178), `src/app/api/products/route.ts` (107, 110), `ProductCard.tsx` (85, 136), `QuickViewDialog.tsx` (95, 108, 130).
- [ ] Update the two comments naming the old literals: `products/route.ts:38` («first Color row»), `src/types/index.ts:174`.

### Task 2: Seed data

- [ ] `prisma/seed-data/products.ts`: import `VARIANT_NAMES` (relative path), replace ~40 `name: "Size"`/`name: "Color"` rows.

### Task 3: Data migration

- [ ] `npx prisma migrate dev --create-only --name rename-variant-names-ua`, hand-write the two UPDATEs.
- [ ] Apply locally (`prisma migrate dev`); verify row counts changed and no `"Size"`/`"Color"` rows remain.

### Task 4: Test sweep

- [ ] Update fixtures/assertions in: `product-card.test.tsx`, `quick-view-dialog.test.tsx`, `product-detail-client.test.tsx`, `product-queries.test.ts`, `products-api.test.ts`, `seed-data.test.ts`, `checkout-create-order-api.test.ts`, `email-templates.test.ts`, `filter-bar.test.tsx` (verify which hits are param keys vs data values — param keys stay).
- [ ] `tests/e2e/products.spec.ts` + grep ALL e2e specs for `Size|Color|Розмір|Колір` across every locator type.

### Task 5: Verification (rename)

- [ ] `npm run typecheck` && `npm run lint` && `npm run test:run` — all green.
- [ ] Browser: PDP shows size picker + colorway dots; catalog size/color filters work against migrated local DB.

### Task 6: Design-gap audit

- [ ] Render each dc.html mockup + shipped page side by side (fresh dev server; desktop + mobile viewports). Coverage: Home, Catalog, Product, Cart, Checkout ↔ their dc.html; `Mirox Mobile.dc.html` ↔ mobile viewport of every shipped page (never tracked as built); Contacts → note only.
- [ ] Findings table per page: **match / small gap (fix now) / larger gap (→ BACKLOG)**. Screenshot comparison → one Artifact.

### Task 7: Small fixes + filing

- [ ] Apply small-gap fixes in this branch (each its own commit or grouped logically).
- [ ] File larger finds: BACKLOG `### [2026-08-15] From: G14 design-gap audit` (🟤 per intake rules; 🔵 where they trace to the user's 2026-08-11 steer).

### Task 8: Docs + PR

- [ ] WEEKLY G14 premise correction (migration supersedes P2-gated prod effect) — keep the original line with a superseded note per house convention.
- [ ] CLAUDE.md touchpoints if any pattern text names "Size"/"Color" (grep).
- [ ] Commit, push, PR; then standard close-out after review/approval.

---

## Progress Log

- 2026-08-15: Plan created. Brainstorm (bounded path) done in-session; user approved design incl. migration-over-reseed decision.
- 2026-08-15: Tasks 1–5 done. 14 literals (not 13 — page.tsx had 5) → `VARIANT_NAMES`; seed imports the constant relatively (36 rows); migration `20260815095848_rename_variant_names_ua` — first draft used the model name `"ProductVariant"`, shadow-DB replay caught it (P1014), fixed to the mapped `"product_variants"`; applied + reseed verified (28 «Розмір»/8 «Колір», 0 legacy). Test sweep: 7 unit files; filter-bar/e2e needed nothing (param keys + catalog labels already «Розмір»; e2e's `/— Size/` count-0 is a deliberate legacy guard, kept). typecheck/lint/test:run green (773 passed). Browser: PDP size picker + colorway sibling link + catalog `?size=M` all work against renamed DB.
- 2026-08-15: Tasks 6–8 done. Audit: 7 mockups vs 12 shipped page states (1440 + 390, fresh dev server). Verdict — storefront matches its handoff; 8 deltas verified as **already ruled** (eyebrow 2026-07-28, no-dead-links nav/footer → TASK-055, «У вибране» → TASK-041, фото замірів → TASK-056, 1-click + промокод → TASK-043, single name field → G2 §2, filter sheet → TASK-036 R5); 3 unruled finds: (1) **light blur shimmer on black theme — FIXED in-branch** (`image-utils.ts` → #0D0D0D/#1A1A1A, verified in fresh SSR HTML after the stale-`.next` gotcha struck again and forced a server restart), (2) mobile «Новинки» horizontal rail → BACKLOG 🟤, (3) checkout distraction-free header → BACKLOG 🟤 (both under `[2026-08-15] From: G14 design-gap audit`). Cart-mobile overflow suspicion disproven by measurement (scrollWidth == clientWidth). WEEKLY G14 premise superseded (migration replaces P2 dependency). Artifact: https://claude.ai/code/artifact/8c7a8a92-336f-42fc-b208-c69de7e751c5 . Final branch verification: typecheck + lint + 773 tests green.
