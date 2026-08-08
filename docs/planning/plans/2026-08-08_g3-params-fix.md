# G3 Params Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four client-component dynamic routes that 500 on Next 14.2.35 by replacing `use(params)` with `useParams()`, with an RTL regression test proving the fix.

**Architecture:** One mechanical pattern applied to 4 page files — drop the `params: Promise<{ id: string }>` prop + React `use()` unwrap, read the segment via `next/navigation`'s `useParams<{ id: string }>()` hook instead (works unchanged on Next 14/15/16). One new unit-test file renders all four pages with mocked navigation/fetch; it fails on the current code (runtime `use()` throw) and passes after the fix. Live docs that describe the break are corrected, and the deferred browser-level coverage becomes a 🟤 BACKLOG entry.

**Tech Stack:** Next.js 14.2.35 (App Router), React 18, Vitest + @testing-library/react (jsdom), Playwright MCP for the manual browser pass.

**Spec:** `docs/superpowers/specs/2026-08-08-g3-params-fix-design.md`
**Branch:** `feat/g3-params-fix` (already checked out)

## Global Constraints

- TypeScript strict; Prettier double quotes / 100-char width; pre-commit hooks run lint-staged (never bypass).
- No behavioral change beyond the params read: fetch URLs, effects keyed on `id`, error/404 handling stay byte-identical.
- Out of scope (spec §7): API-route `Promise<{ id }>` typings, `[slug]` server pages' `await params`, `tests/helpers/api-test-utils.ts`'s `createRouteParams`, any Next.js upgrade.
- Do NOT re-add a `NODE_ENV` line to `.env.example` or the devcontainer (TASK-057 rule).
- All communication and code comments in English; user-facing copy is untouched by this task.

---

### Task 1: Regression tests (red)

**Files:**

- Create: `tests/unit/dynamic-route-params.test.tsx`

**Interfaces:**

- Consumes: default exports of the four page components (imported via `@/app/...` aliases with route-group parens/brackets — Vitest resolves these; precedent: `tests/unit/product-detail-client.test.tsx` imports `@/app/(shop)/products/[slug]/product-detail-client`).
- Produces: the regression harness Task 2 must turn green. Mocks `useParams` → `{ id: "test-id" }`, so the fix MUST read ids via `useParams` for these tests to pass.

- [ ] **Step 1: Write the failing test file**

Create `tests/unit/dynamic-route-params.test.tsx` with exactly:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "test-id" }),
  useRouter: () => ({ push }),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
// EditProductPage only renders ProductForm after a successful load, but the
// admin barrel import is heavy — stub the module.
vi.mock("@/components/admin", () => ({
  ProductForm: () => null,
}));

import AdminOrderDetailPage from "@/app/(admin)/admin/orders/[id]/page";
import EditProductPage from "@/app/(admin)/admin/products/[id]/page";
import SupplierDetailPage from "@/app/(admin)/admin/suppliers/[id]/page";
import AccountOrderDetailPage from "@/app/(shop)/account/orders/[id]/page";

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
});

// Regression for BACKLOG [2026-07-18]: on Next 14.2.35 these four client pages
// 500'd calling use(params) — params arrives as a plain object, not a Promise.
// Each test proves the page (a) renders without throwing and (b) feeds the
// route id into its fetch URL (non-vacuous: id must actually flow).
describe("dynamic-route params regression (use(params) → useParams)", () => {
  it("/admin/orders/[id] renders and fetches by route id", async () => {
    render(<AdminOrderDetailPage />);
    expect(await screen.findByText("Order not found")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/admin/orders/test-id");
  });

  it("/admin/products/[id] renders and fetches by route id", async () => {
    render(<EditProductPage />);
    // "Product not found" appears twice in the error state (h2 + error <p>)
    expect((await screen.findAllByText("Product not found")).length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledWith("/api/admin/products/test-id");
  });

  it("/admin/suppliers/[id] renders and fetches by route id", async () => {
    render(<SupplierDetailPage />);
    // 404 path: toast.error + redirect back to the list — no crash is the point
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/suppliers"));
    expect(global.fetch).toHaveBeenCalledWith("/api/admin/suppliers/test-id");
  });

  it("/account/orders/[id] renders and fetches by route id", async () => {
    render(<AccountOrderDetailPage />);
    expect(await screen.findByText("Order not found")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/orders/test-id");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail (teeth check)**

Run: `npx vitest run tests/unit/dynamic-route-params.test.tsx`

Expected: **all 4 tests FAIL** with React's `use()` throw — message contains `An unsupported type was passed to use()` (the components still call `use(params)` and the test renders them without a `params` prop). If any test passes here, STOP — the harness is vacuous; fix the test before touching the pages.

Note: no commit yet — the red tests commit together with the fix in Task 2 (CI must never see a red intermediate commit).

---

### Task 2: Replace `use(params)` with `useParams()` in the 4 pages

> **As shipped:** the four call sites carry a trailing non-null assertion — `useParams<{ id: string }>()!` — not the bare call shown in the steps below. See the 2026-08-08 adjudication entry in the Progress Log (pages-compat types make `useParams` nullable project-wide).

**Files:**

- Modify: `src/app/(admin)/admin/orders/[id]/page.tsx` (lines 3, 6, 146–151)
- Modify: `src/app/(admin)/admin/products/[id]/page.tsx` (lines 3–4, 29–34)
- Modify: `src/app/(admin)/admin/suppliers/[id]/page.tsx` (lines 3, 5, 98–99)
- Modify: `src/app/(shop)/account/orders/[id]/page.tsx` (lines 3, 6, 84–89)
- Test: `tests/unit/dynamic-route-params.test.tsx` (from Task 1 — must go green)

**Interfaces:**

- Consumes: Task 1's harness (mocked `useParams` returning `{ id: "test-id" }`).
- Produces: four prop-less default-export page components reading `const { id } = useParams<{ id: string }>();`. Nothing else may change in these files.

- [ ] **Step 1: Fix `src/app/(admin)/admin/orders/[id]/page.tsx`**

Line 3 — replace:

```tsx
import { useEffect, useState, use } from "react";
```

with:

```tsx
import { useEffect, useState } from "react";
```

Line 6 — replace:

```tsx
import { useRouter } from "next/navigation";
```

with:

```tsx
import { useParams, useRouter } from "next/navigation";
```

Lines 146–151 — replace:

```tsx
interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = use(params);
```

with:

```tsx
export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
```

- [ ] **Step 2: Fix `src/app/(admin)/admin/products/[id]/page.tsx`**

Lines 3–4 — replace:

```tsx
import { useState, useEffect, use } from "react";
import Link from "next/link";
```

with (this file had no `next/navigation` import — add one, keeping the repo's react → next/link → next/navigation import order):

```tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
```

Lines 29–34 (now shifted by +1 after the import insert) — replace:

```tsx
interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
```

with:

```tsx
export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
```

- [ ] **Step 3: Fix `src/app/(admin)/admin/suppliers/[id]/page.tsx`**

Line 3 — replace:

```tsx
import { useState, useEffect, use } from "react";
```

with:

```tsx
import { useState, useEffect } from "react";
```

Line 5 — replace:

```tsx
import { useRouter } from "next/navigation";
```

with:

```tsx
import { useParams, useRouter } from "next/navigation";
```

Lines 98–99 — replace (this file uses an inline prop type, not a named interface):

```tsx
export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
```

with:

```tsx
export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
```

- [ ] **Step 4: Fix `src/app/(shop)/account/orders/[id]/page.tsx`**

Line 3 — replace:

```tsx
import { useEffect, useState, use } from "react";
```

with:

```tsx
import { useEffect, useState } from "react";
```

Line 6 — replace:

```tsx
import { useRouter } from "next/navigation";
```

with:

```tsx
import { useParams, useRouter } from "next/navigation";
```

Lines 84–89 — replace:

```tsx
interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
```

with:

```tsx
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
```

- [ ] **Step 5: Run the regression tests to verify green**

Run: `npx vitest run tests/unit/dynamic-route-params.test.tsx`

Expected: **all 4 tests PASS**.

- [ ] **Step 6: Typecheck + lint + full unit suite**

Run: `npm run typecheck && npm run lint && npm run test:run`

Expected: zero type errors (the deleted interfaces/props have no other references), zero lint errors (no unused `use` import left behind), full suite passes (632+ tests, +4 new).

- [ ] **Step 7: Commit (tests + fix together)**

```bash
git add tests/unit/dynamic-route-params.test.tsx "src/app/(admin)/admin/orders/[id]/page.tsx" "src/app/(admin)/admin/products/[id]/page.tsx" "src/app/(admin)/admin/suppliers/[id]/page.tsx" "src/app/(shop)/account/orders/[id]/page.tsx"
git commit -m "fix(routing): replace use(params) with useParams() in 4 broken dynamic client routes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Docs propagation + BACKLOG entry

**Files:**

- Modify: `CLAUDE.md` (root — "Async params unwrapping (currently broken)" bullet under Detected Patterns)
- Modify: `src/app/CLAUDE.md` ("Async params (broken on the pinned Next 14.2.35)" bullet under Module-Specific Conventions)
- Modify: `docs/planning/BACKLOG.md` (append a new date group at the end of the Enhancements section, after the `### [2026-08-07]` group, before the closing `---`)

**Interfaces:**

- Consumes: the fixed pattern from Task 2 and the test file name from Task 1.
- Produces: live docs describing the _fixed_ pattern (no doc may still assert the routes are broken). The original BACKLOG `[2026-07-18]` `use(params)` entry is NOT edited here — it is resolved via the normal completion flow after PR merge.

- [ ] **Step 1: Root `CLAUDE.md` — replace the broken-pattern bullet**

Find the bullet starting `- **Async params unwrapping (currently broken)**:` in Detected Patterns and replace the whole bullet with:

```markdown
- **Dynamic-route params in client pages**: client-component dynamic routes read their segment via `useParams<{ id: string }>()!` from `next/navigation` — fixed in G3 after all 4 `[id]` client pages (`/admin/orders/[id]`, `/admin/products/[id]`, `/admin/suppliers/[id]`, `/account/orders/[id]`) 500'd calling `use(params)` on Next 14.2.35, which passes `params` as a plain object (Promise-based params is Next 15 behavior). The trailing `!` is required: `next-env.d.ts` references the pages-router compat types (the repo keeps `pages/` error stubs), which redeclare `useParams(): T | null` project-wide. `useParams` works unchanged on Next 14/15/16, so the ROADMAP'd upgrade needs no re-migration. Server components and API handlers keep Promise-typed `await params` (tolerant on 14, correct on 15+). Regression: `tests/unit/dynamic-route-params.test.tsx`
```

- [ ] **Step 2: `src/app/CLAUDE.md` — replace the broken-pattern bullet**

Find the bullet starting `- **Async params (broken on the pinned Next 14.2.35)**:` in Module-Specific Conventions and replace the whole bullet with:

```markdown
- **Dynamic-route params in client pages**: client-component dynamic pages read their segment via `useParams<{ id: string }>()!` from `next/navigation` (G3 fix — `use(params)` threw on Next 14.2.35 because client components receive plain-object params; Promise params is Next 15 behavior; the `!` is needed because the pages-router compat types referenced by `next-env.d.ts` make `useParams` nullable project-wide). The four `[id]` pages (`admin/orders`, `admin/products`, `admin/suppliers`, `(shop)/account/orders`) are prop-less. Server-component `[slug]` pages and API handlers keep Promise-typed `await params`. Regression: `tests/unit/dynamic-route-params.test.tsx`
```

- [ ] **Step 3: BACKLOG — add the deferred E2E coverage entry**

In `docs/planning/BACKLOG.md`, directly after the last entry of the `### [2026-08-07] From: G2 post-gate review (user Q&A)` group (the React-Compiler lint entry) and before the `---` that precedes `## Technical Debt`, insert:

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md src/app/CLAUDE.md docs/planning/BACKLOG.md
git commit -m "docs(g3): flip params-pattern docs to useParams(); BACKLOG E2E auth-helper entry

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Full verification (commands + real browser)

**Files:** none created/modified (unless a failure forces a fix — then loop back to the failing task).

**Interfaces:**

- Consumes: everything above, seeded local DB, dev server.
- Produces: evidence for the completion claim — all four routes render HTTP 200 for authorized users; no `use()` error anywhere.

- [ ] **Step 1: Command-level gates**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run format:check`

Expected: all pass.

- [ ] **Step 2: Start infrastructure + dev server**

```bash
docker-compose up -d   # PostgreSQL (host 5433) + Redis (host 6380)
npm run dev            # port 3000, run in background
```

DB must contain seed data (1 supplier "Manual Supplier", 7 orders, 8 products). If empty, run `npm run db:seed` — it self-guards via `assertLocalDatabase()`, but still confirm `DATABASE_URL` resolves to `localhost:5433` first (`.env` has a known duplicate-`DATABASE_URL` footgun where the last line wins).

- [ ] **Step 3: Browser pass — admin routes (Playwright MCP)**

1. Navigate to `http://localhost:3000/login`, sign in as `admin@store.com` / `admin123`.
2. `/admin/orders` → click the first order row → expect the order detail page to render (status card, items) with **no 500** and no `An unsupported type was passed to use()` in the dev-server log.
3. `/admin/products` → click edit on any product → expect the "Edit Product" form to render.
4. `/admin/suppliers` → click "Manual Supplier" → expect the supplier detail (contact card, orders table) to render.

- [ ] **Step 4: Browser pass — account route**

1. Sign out, sign in as `customer@example.com` / `customer123`.
2. `/account/orders` → click the first order → expect the customer order detail (status timeline, items, totals) to render with no 500.

- [ ] **Step 5: Record evidence in this plan's Progress Log**

Append per-route results (URL, HTTP status, what rendered) to the Progress Log below. If any route fails, STOP and debug with superpowers:systematic-debugging before any completion claim.

---

## Post-merge (completion workflow — not part of this plan's execution)

After user approval + PR merge: BACKLOG `[2026-07-18]` `use(params)` entry resolved, WEEKLY G3 row → `✅ PR #N` (Summary Table + Daily Schedule), plan archived to `docs/archive/plans/`, DONE.md entry, memory capture.

## Progress Log

- 2026-08-08: Plan written from approved spec (`2026-08-08-g3-params-fix-design.md`); branch `feat/g3-params-fix` created; spec committed (`d19828a`).
- 2026-08-08: Tasks 1+2 complete (commit `c55b621`) — red→green verified (red in jsdom = `use is not a function`, an environment artifact: stable React 18.3.1 lacks `use`; the prod 500 came from Next's vendored canary). **Deviation from Task 2's exact code, controller-adjudicated:** `useParams<{ id: string }>()` alone does not typecheck — `next-env.d.ts` references `next/navigation-types/compat/navigation` (present because of the `pages/` error-stub dir kept since the Jan 2026 Next-14 downgrade), which redeclares `useParams(): T | null` project-wide. Ruling: the non-null assertion `useParams<{ id: string }>()!` stands (App Router always supplies params at runtime; a null-guard would add a render branch, violating the no-behavioral-change constraint). Review finding demanding `!` removal overruled on verified evidence (TS2339 reproduced with `!` removed; augmentation traced). Task 3 doc-bullets and BACKLOG text amended above to match.
- 2026-08-08: Task 3 complete (commit `cfb5ea1`) — root + `src/app` CLAUDE.md bullets flipped to the fixed pattern; BACKLOG `[2026-08-08]` group added with 2 🟤 entries (E2E auth helper; pages-compat nullable navigation types). Review clean.
- 2026-08-08: Task 4 verification complete — gates: `test:run` 636 passed / 1 todo, `typecheck`/`lint`/`format:check` clean. Real-browser pass (Playwright MCP, dev server port 3000): `/admin/orders/cmsix4…` 200 (full detail: timeline, items, summary), `/admin/products/cmscz5…` 200 ("Edit Product" form fully populated), `/admin/suppliers/cmrkh6…` 200 (Manual Supplier detail, 8 products), all as admin@store.com; `/account/orders/cmscz5…` 200 (ORD-2026-0005, timeline/items/totals) as customer@example.com. Dev-server log reviewed end-to-end: zero `use()` errors, zero 500s. Pre-existing unrelated console warning noted (Textarea ref in ProductForm). Evidence: `.superpowers` task-4 report (workspace artifact, not committed).
- 2026-08-08: Final whole-branch review — Ready to merge: Yes (0 Critical / 0 Important, 3 deferred minors). PR #30 opened; SDD workspace deleted (record: this log + git history).
- 2026-08-08: PR #30 review round 1 — 2 findings, both real, both docs-freshness (recurrences #8/#9 of the class): `docs/README.md` own `Last Updated` + `BACKLOG.md` `Last Updated`/index-row pair. Fixed in `9aae7bc` together with the chat-surfaced near-misses: `!` rationale comments at the 4 call sites, `vi.stubGlobal` fetch hardening in the regression test, Textarea-ref warning routed to a third 🟤 entry in BACKLOG `[2026-08-08]`. Consolidated response comment posted with per-remark verdicts. Gates re-run green (636 | 1 todo; typecheck/lint/format clean).
