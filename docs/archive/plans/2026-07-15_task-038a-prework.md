# TASK-038a Prework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the two decisions blocking v1.3 — diagnose the WebKit search-filter failure and fix it only if the confirmed root cause permits a minimal fix, add `sharp`, and add `webkit` to CI.

**Architecture:** Three workstreams delivered as one PR (spec Approach A). Workstream A is a _diagnosis-first_ investigation whose fix is gated by a circuit-breaker; Workstreams B (sharp) and C (CI) are independent infra changes. The CI change must land in the same PR as the fix — enabling `webkit` while the test fails turns CI red.

**Tech Stack:** Next.js 14 App Router, React 18, Playwright 1.58.2, TypeScript strict, Vitest, GitHub Actions.

**Spec:** [2026-07-15-task-038a-prework-design.md](../../superpowers/specs/2026-07-15-task-038a-prework-design.md) — read §3 (scope boundary) and §4.3 (circuit-breaker) before writing any product code.

---

## Global Constraints

- **The fix code is the least valuable artifact.** TASK-036 rewrites `src/app/(shop)/products/products-content.tsx` entirely. Durable deliverables, in order: the **diagnosis**, the **regression test**, the **CI webkit job**. Do not gold-plate. (Spec §3)
- **No fix without a confirmed root cause.** Task 4 must not begin until Task 3's verdict is recorded. (Spec §4.3)
- **Circuit-breaker.** If the minimal fix requires restructuring the component's state or URL model, STOP and take Branch C. (Spec §4.3)
- **Branch C requires `test.fail()`**, never `test.skip()` — Playwright errors when a `test.fail()` test passes, so it self-flags when TASK-036 fixes it. (Spec §4.4)
- **CI must be green on merge in every branch.** (Spec §8)
- `sharp` goes in `dependencies`, **not** `devDependencies` — `next.config.mjs` sets `output: "standalone"`, which needs it at serve time.
- Conservative dependency policy: current version within semver ranges. No major upgrades.
- Code conventions: Prettier (double quotes, semicolons, 2-space, 100 cols, trailing commas es5), ESLint flat config, bare `catch` when the error variable is unused. Pre-commit runs Husky + lint-staged.
- Local E2E runs on port 3001; CI on port 3000. `webkit-2248` is already installed locally — no `playwright install` needed for local reproduction.
- Commit style: Conventional Commits. Branch `feat/task-038a-prework` already exists and holds the spec commits.

---

## File Structure

| File                                            | Responsibility                                             | Workstream |
| ----------------------------------------------- | ---------------------------------------------------------- | ---------- |
| `tests/e2e/products.spec.ts`                    | Existing failing test; gains the permanent regression test | A          |
| `tests/e2e/_diagnostic.spec.ts`                 | **Temporary** probe — deleted in Task 4                    | A          |
| `src/app/(shop)/products/products-content.tsx`  | Fix target, **only** under Branch A                        | A          |
| `package.json` / `package-lock.json`            | `sharp` runtime dependency                                 | B          |
| `.github/workflows/ci.yml`                      | Add `webkit` to install (line 136) and run (line 161)      | C          |
| `docs/planning/BACKLOG.md`                      | Resolve `:345` (sharp), resolve/correct `:361` (WebKit)    | Docs       |
| `docs/planning/TODO.md`, `DONE.md`, `WEEKLY.md` | Completion workflow                                        | Docs       |

---

## Task 1: Reproduce the WebKit failure

**Files:**

- Read only: `tests/e2e/products.spec.ts:15-40`

**Interfaces:**

- Consumes: nothing
- Produces: **Evidence artifact** — confirmed-red output pasted into the plan's progress log. Task 2 depends on this being red.

Per spec §4.1, no fix is written against an unreproduced failure.

- [ ] **Step 1: Verify the database target is LOCAL — never seed blindly**

> **⚠️ This step originally read `npx prisma db seed`. That was dangerous and has been corrected.**
> `.env` defines `DATABASE_URL` **twice**, and dotenv is last-wins — the second entry pointed at the
> **live Neon production database**. `prisma/seed.ts` upserts users/catalog and calls `deleteMany`
> on product images (`seed.ts:140`), variants (`seed.ts:141`), and order items (`seed.ts:187`), so
> seeding production would delete and recreate real product imagery and order line items.
> The duplicate is now commented out locally (backup: `.env.backup-task038a`).

**Never run `prisma db seed` without confirming the target first.** Run this guard:

```bash
node -e "
require('dotenv').config({ path: '.env', override: true });
const u = process.env.DATABASE_URL || '';
if (!u) { console.error('ABORT: DATABASE_URL unset'); process.exit(1); }
if (!/@(postgres|localhost|127\.0\.0\.1)[:\/]/.test(u)) {
  console.error('ABORT: DATABASE_URL is NOT local — refusing. Host:', u.replace(/:\/\/[^:]+:[^@]+@/, '://***@'));
  process.exit(1);
}
console.log('OK: DATABASE_URL is local');
"
```

Expected: `OK: DATABASE_URL is local`. **If it aborts, STOP and escalate — do not work around it.**

- [ ] **Step 1b: Confirm seed data exists (read-only)**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const [c, a] = await Promise.all([p.category.count(), p.product.count({ where: { isActive: true } })]);
  console.log('categories:', c, '| active products:', a, '=>', c > 0 && a > 0 ? 'OK' : 'EMPTY — needs seed');
  await p.\$disconnect();
})();
"
```

Expected as of 2026-07-15: `categories: 15 | active products: 21 => OK`. `tests/global-setup.ts` only
_validates_ these counts — it never seeds. **If and only if this reports EMPTY**, and Step 1 passed,
run `npx prisma db seed`.

- [ ] **Step 2: Run the failing test on webkit**

```bash
npm run test:e2e -- --project=webkit -g "can filter products by search"
```

Expected: **FAIL**. The assertion `await expect(page).toHaveURL(/search=test/)` should fail with the actual URL being `/products?page=1` (no `search` param).

If it PASSES: STOP and report. The premise of this whole task is wrong and the BACKLOG entry may be stale.

- [ ] **Step 3: Confirm the control — chromium passes**

```bash
npm run test:e2e -- --project=chromium -g "can filter products by search"
```

Expected: **PASS**. This establishes the engine split is real and not an environment problem.

- [ ] **Step 4: Record evidence**

Append to this plan's Progress Log: the webkit failure message with the actual URL, and confirmation that chromium passed. No commit — no files changed.

---

## Task 2: The discriminating experiment

**Files:**

- Create: `tests/e2e/_diagnostic.spec.ts` (temporary — deleted in Task 4)

**Interfaces:**

- Consumes: Task 1's confirmed-red baseline
- Produces: **Verdict** — either `H1_STATE_EMPTY` or `DOWNSTREAM`, plus whether the defect reproduces on chromium under a forced delay. Task 3 consumes this.

### Why this works — read before writing code

The search input is **controlled** (`value={search}`, `products-content.tsx:221-226`), so React reasserts its own state onto the DOM on every re-render.

**Required premise (spec §4.2):** the forcing re-render must **not** change `searchParams`. The product-fetch resolution qualifies — it sets `products`, `pagination`, `isLoading` only.

This premise is load-bearing. Without it a snap-back to `""` is consistent with **both** hypotheses: under H1 `onChange` never fired; under H2 the sync effect at `products-content.tsx:130-136` overwrote it. Both leave `search === ""`. Holding `searchParams` constant rules H2 out, because its effect cannot fire.

`page.route` delays the API so the fill provably precedes the re-render on every engine, converting a timing race into a deterministic experiment.

- [ ] **Step 1: Write the diagnostic probe**

Create `tests/e2e/_diagnostic.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

// TEMPORARY — TASK-038a Phase 2 diagnostic. Deleted in Task 4.
// See docs/superpowers/specs/2026-07-15-task-038a-prework-design.md §4.2
test.describe("DIAGNOSTIC: search state lifecycle", () => {
  test("search input survives the product-fetch re-render", async ({ page }) => {
    // Delay /api/products so the fill provably lands while the fetch is in flight.
    // searchParams is NOT touched by this re-render — the premise that makes the read valid.
    await page.route("**/api/products*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });

    await page.goto("/products");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.waitFor({ state: "visible" });

    await searchInput.fill("test");
    const immediately = await searchInput.inputValue();
    console.log(`[DIAGNOSTIC] value immediately after fill: "${immediately}"`);

    // Let the delayed fetch resolve -> setProducts/setIsLoading -> re-render.
    await page.waitForSelector("[data-testid='product-card']", { timeout: 20000 });
    await page.waitForTimeout(500);

    const afterRerender = await searchInput.inputValue();
    console.log(`[DIAGNOSTIC] value after product-fetch re-render: "${afterRerender}"`);
    console.log(
      afterRerender === ""
        ? "[DIAGNOSTIC] VERDICT: H1_STATE_EMPTY"
        : "[DIAGNOSTIC] VERDICT: DOWNSTREAM"
    );

    // Intentionally not asserting — this probe reports, it does not gate.
    expect(immediately).toBe("test");
  });
});
```

- [ ] **Step 2: Run the probe on webkit**

```bash
npm run test:e2e -- --project=webkit -g "survives the product-fetch re-render"
```

Record both `[DIAGNOSTIC]` lines and the VERDICT.

- [ ] **Step 3: Run the same probe on chromium**

```bash
npm run test:e2e -- --project=chromium -g "survives the product-fetch re-render"
```

This is the high-value read (spec §6). Interpret:

| chromium result    | Meaning                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Also snaps to `""` | **Not engine-specific** — a race WebKit merely loses more often. The regression test can then be engine-independent and will fail on chromium too, so the primary guard no longer depends on the webkit job. **Preferred outcome.** |
| Stays `"test"`     | Genuinely WebKit-specific. The webkit CI job is then the only guard.                                                                                                                                                                |

- [ ] **Step 4: Record the verdict**

Append to the Progress Log: both engines' `[DIAGNOSTIC]` output, the verdict, and whether chromium reproduces. No commit — the probe file is temporary and uncommitted.

---

## Task 3: Confirm root cause and choose the branch

**Files:**

- Read: `src/app/(shop)/products/products-content.tsx`

**Interfaces:**

- Consumes: Task 2's verdict
- Produces: **Branch selection** (A, B, or C) with written justification. Task 4 dispatches on this.

**REQUIRED SUB-SKILL:** Use `superpowers:systematic-debugging` for this task. Do not skip it — the whole point of TASK-038a is that the BACKLOG's "product bug" claim was asserted without evidence, and we must not repeat that mistake.

- [ ] **Step 1: Trace the confirmed path to root cause**

If verdict is `H1_STATE_EMPTY`: determine _why_ `onChange` did not produce `search === "test"`. Candidate lines to examine — do not assume, verify:

- `products-content.tsx:130-136` — the URL→state sync effect
- `products-content.tsx:221-226` — the controlled input binding
- Whether hydration completed before the fill landed

If verdict is `DOWNSTREAM`: trace `handleSearch` (`:179-182`) → `updateFilters` (`:163-177`) → `router.push`. Note that `updateFilters` **deletes** falsy keys (`:168-172`), which is why an empty `search` removes the param instead of setting it.

**A reasoning aid — verify, do not assume.** If `onChange` genuinely never fired for real typing, Safari users could not use the search box _at all_: the controlled input would appear frozen as they typed. That is a far larger and more obvious defect than a missing URL param, and it would not have gone unnoticed. So a confirmed `H1_STATE_EMPTY` verdict points **more toward a Playwright-`fill()`-vs-React-controlled-input artifact (Branch B) than a product bug**.

Discriminate it directly rather than reasoning about it:

```bash
npx playwright test --project=webkit -g "can filter products by search" --debug
```

Or add a temporary probe using real keystrokes instead of `fill()`:

```ts
await searchInput.pressSequentially("test", { delay: 50 });
```

If `pressSequentially` works where `fill()` does not, the product is fine and the test is at fault → **Branch B**. If both fail, real typing is genuinely broken on WebKit → product bug → Branch A or C.

- [ ] **Step 2: State the root cause in one sentence, with the evidence that proves it**

Write it into the Progress Log. If you cannot state it in one sentence with evidence, you have not found it — keep going or invoke the circuit-breaker.

- [ ] **Step 3: Choose the branch**

| Branch | Condition                                                                | Task 4 path |
| ------ | ------------------------------------------------------------------------ | ----------- |
| **A**  | Product bug, fixable by a localized change                               | Task 4A     |
| **B**  | Test artifact — the product is fine, the test races                      | Task 4B     |
| **C**  | Product bug, but the minimal fix needs restructuring the state/URL model | Task 4C     |

**Circuit-breaker trigger (spec §4.3):** if the fix requires restructuring state or URL handling rather than a localized change, choose **C**. TASK-036 rewrites this component; do not gold-plate doomed code.

- [ ] **Step 4: STOP — checkpoint with the user**

Report: the root cause, the evidence, the chosen branch, and the justification. **Wait for confirmation before Task 4.** Branch C in particular means deliberately shipping without a product fix — that is the user's call, not yours.

---

## Task 4A: Minimal fix (Branch A only)

> Execute **only** if Task 3 selected Branch A. Otherwise skip to 4B or 4C.

**Files:**

- Modify: `src/app/(shop)/products/products-content.tsx`
- Modify: `tests/e2e/products.spec.ts`
- Delete: `tests/e2e/_diagnostic.spec.ts`

**Interfaces:**

- Consumes: Task 3's confirmed root cause
- Produces: a passing `webkit` run of "can filter products by search"; the permanent regression test added in Task 5

- [ ] **Step 1: Write the failing regression test first (TDD)**

Add to `tests/e2e/products.spec.ts`, inside the existing `test.describe("Product Browsing", ...)`. This is the deterministic form of the probe — promoted from diagnostic to permanent guard:

```ts
test("search text survives a product-fetch re-render", async ({ page }) => {
  // Regression: TASK-038a. Typing while products are still loading must not lose the input.
  await page.route("**/api/products*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.continue();
  });

  await page.goto("/products");

  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.waitFor({ state: "visible" });
  await searchInput.fill("test");

  await page.waitForSelector("[data-testid='product-card']", { timeout: 20000 });
  await page.waitForTimeout(500);

  await expect(searchInput).toHaveValue("test");
});
```

- [ ] **Step 2: Run it and verify it FAILS**

```bash
npm run test:e2e -- --project=webkit -g "survives a product-fetch re-render"
```

Expected: FAIL — received `""`, expected `"test"`.

If Task 2 showed chromium also reproduces, verify it fails there too:

```bash
npm run test:e2e -- --project=chromium -g "survives a product-fetch re-render"
```

A test that does not fail first proves nothing. If it passes, the test does not capture the root cause — return to Task 3.

- [ ] **Step 3: Apply the minimal fix**

Implement the smallest change that addresses Task 3's **confirmed** root cause. Constraints:

- Localized change only. If it grows into a state/URL restructure, STOP and switch to Branch C.
- Follow existing conventions (bare `catch`, Prettier, no `console.error` in new code).

**Candidate fixes, keyed to root cause.** These are starting points, not instructions — apply the one Task 3's evidence supports, and only that one.

_Candidate 1 — the sync effect clobbers typed text._ If Task 3 proves the effect at `products-content.tsx:130-136` is re-firing and overwriting `search`, drop `search` from it. The other three fields are not user-typed and are safe to keep syncing:

```tsx
useEffect(() => {
  // `search` is deliberately NOT synced here: it is user-typed, and resyncing it
  // from the URL discards in-progress input. TASK-038a.
  setCategory(searchParams?.get("category") || "");
  setSortBy(searchParams?.get("sortBy") || "createdAt");
  setSortOrder(searchParams?.get("sortOrder") || "desc");
}, [searchParams]);
```

Note the consequence and confirm it is acceptable: `clearFilters` already calls `setSearch("")` explicitly (`:192`), so the visible clear-path still works.

_Candidate 2 — read the submitted value from the form, not from state._ This makes `handleSearch` independent of the state-sync question entirely:

```tsx
const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const value = String(new FormData(e.currentTarget).get("search") || "").trim();
  updateFilters({ search: value || null });
};
```

This requires adding `name="search"` to the `Input` at `:221-226`. Prefer Candidate 1 if the effect is the proven cause — Candidate 2 is more robust but leaves the underlying state bug live for the other filters.

**Do not apply both.** Stacking fixes hides which one worked, and the regression test would then prove nothing about the root cause.

- [ ] **Step 4: Verify the regression test now PASSES**

```bash
npm run test:e2e -- --project=webkit -g "survives a product-fetch re-render"
```

Expected: PASS.

- [ ] **Step 5: Verify the original test now passes on webkit**

```bash
npm run test:e2e -- --project=webkit -g "can filter products by search"
```

Expected: PASS.

- [ ] **Step 6: Verify no regression on the other engines**

```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project="Mobile Safari"
```

Expected: all green. Mobile Safari matters — it shares the engine and was the second failing project.

- [ ] **Step 7: Delete the diagnostic probe**

```bash
rm tests/e2e/_diagnostic.spec.ts
```

- [ ] **Step 8: Commit**

```bash
git add src/app/\(shop\)/products/products-content.tsx tests/e2e/products.spec.ts
git commit -m "fix(products): preserve search input across product-fetch re-render

Root cause: <one sentence from Task 3>.

Adds a deterministic regression test that delays /api/products so the
race is reproducible on every engine rather than only on WebKit.

Refs TASK-038a."
```

Then go to **Task 5**.

---

## Task 4B: Test artifact (Branch B only)

> Execute **only** if Task 3 selected Branch B — the product is correct and the test races.

**Files:**

- Modify: `tests/e2e/products.spec.ts`
- Modify: `docs/planning/BACKLOG.md:361`
- Delete: `tests/e2e/_diagnostic.spec.ts`

**Interfaces:**

- Consumes: Task 3's confirmed root cause
- Produces: a passing `webkit` run; a corrected BACKLOG entry

- [ ] **Step 1: Fix the test's race**

Make the test wait for the condition it actually depends on rather than racing it. Do **not** paper over it with a bare `waitForTimeout` — wait for the real signal (products rendered, or hydration observable via an interactive element).

- [ ] **Step 2: Verify it passes on webkit and Mobile Safari**

```bash
npm run test:e2e -- --project=webkit -g "can filter products by search"
npm run test:e2e -- --project="Mobile Safari" -g "can filter products by search"
```

Expected: both PASS.

- [ ] **Step 3: Run it 3 times to confirm it is not flaky**

```bash
npm run test:e2e -- --project=webkit -g "can filter products by search" --repeat-each=3
```

Expected: 3/3 PASS.

- [ ] **Step 4: Correct the BACKLOG's disproven claim**

`docs/planning/BACKLOG.md:361` currently asserts "pre-existing product bug". Rewrite it to record that TASK-038a **disproved** that claim, state the actual cause, and mark it resolved. This matters — the wrong claim is what made this decision look bigger than it was.

- [ ] **Step 5: Delete the diagnostic probe**

```bash
rm tests/e2e/_diagnostic.spec.ts
```

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/products.spec.ts docs/planning/BACKLOG.md
git commit -m "test(e2e): fix search-filter test race on WebKit engines

The failure was a test artifact, not a product bug: <one sentence>.
Corrects BACKLOG.md:361, which asserted a product bug without evidence.

Refs TASK-038a."
```

Then go to **Task 5**.

---

## Task 4C: Circuit-breaker (Branch C only)

> Execute **only** if Task 3 selected Branch C — real product bug, but the fix needs restructuring.

**Files:**

- Modify: `tests/e2e/products.spec.ts`
- Modify: `docs/planning/TODO.md` (TASK-036 acceptance criteria)
- Modify: `docs/planning/BACKLOG.md:361`
- Delete: `tests/e2e/_diagnostic.spec.ts`

**Interfaces:**

- Consumes: Task 3's confirmed root cause
- Produces: green CI despite an unfixed bug; a TASK-036 acceptance criterion that owns the fix

**Do not touch `products-content.tsx` in this branch.**

- [ ] **Step 1: Mark the failing test as an expected failure**

In `tests/e2e/products.spec.ts`, inside the "can filter products by search" test body, as the first line:

```ts
test("can filter products by search", async ({ page, isMobile, browserName }) => {
  // TASK-036 owns the fix — it rewrites this component's state/URL model.
  // See docs/superpowers/specs/2026-07-15-task-038a-prework-design.md §4.3-4.4
  // test.fail() (not test.skip()) so Playwright errors when TASK-036 fixes this,
  // self-flagging the marker instead of letting it rot.
  test.fail(browserName === "webkit", "TASK-036 owns the fix — see TASK-038a spec §4.3");
  // ... existing body unchanged
```

Two details that matter:

- Destructure `browserName` from the test's fixtures and pass a **boolean** to `test.fail()`. Do not use the fixtures-callback form (`test.fail(({ browserName }) => ...)`) inside a test body — that shape is for declaration-time modifiers, not the body.
- `browserName` is `"webkit"` for **both** the `webkit` and `Mobile Safari` projects (`devices["iPhone 12"]` runs on WebKit). This single condition therefore covers both failing projects, which is exactly what we want.

`test.fail()` is mandatory here; `test.skip()` is explicitly forbidden by spec §4.4.

- [ ] **Step 2: Verify webkit is now green and still genuinely failing**

```bash
npm run test:e2e -- --project=webkit -g "can filter products by search"
```

Expected: PASS, reported as "expected failure". If Playwright reports it _passed unexpectedly_, the bug is gone — return to Task 3, because the premise changed.

- [ ] **Step 3: Verify chromium is unaffected**

```bash
npm run test:e2e -- --project=chromium -g "can filter products by search"
```

Expected: PASS normally (the `test.fail` condition is webkit-only).

- [ ] **Step 4: Add the TASK-036 acceptance criterion**

In `docs/planning/TODO.md`, under TASK-036's Acceptance Criteria, add:

```markdown
- [ ] WebKit search regression fixed and the `test.fail()` marker in `tests/e2e/products.spec.ts` removed — root cause documented in TASK-038a (see spec §4.3)
```

- [ ] **Step 5: Record the diagnosis in BACKLOG.md:361**

Replace the unverified "pre-existing product bug" wording with the confirmed root cause from Task 3, and note that TASK-036 owns the fix.

- [ ] **Step 6: Delete the diagnostic probe**

```bash
rm tests/e2e/_diagnostic.spec.ts
```

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/products.spec.ts docs/planning/TODO.md docs/planning/BACKLOG.md
git commit -m "test(e2e): mark WebKit search failure expected, defer fix to TASK-036

Root cause confirmed: <one sentence from Task 3>. The minimal fix would
require restructuring the component's state/URL model, which TASK-036
rewrites anyway — circuit-breaker per spec §4.3.

Uses test.fail() so Playwright errors once TASK-036 fixes the behaviour.

Refs TASK-038a."
```

Then go to **Task 5**.

---

## Task 5: Add sharp

**Files:**

- Modify: `package.json`, `package-lock.json`

**Interfaces:**

- Consumes: nothing (independent of Workstream A)
- Produces: working `next/image` optimization on the standalone path; a clean E2E web-server log

- [ ] **Step 1: Capture the "before" evidence**

```bash
npm run test:e2e -- --project=chromium -g "products page displays product grid" 2>&1 | grep -i "sharp" | head -5
```

Expected: the `'sharp' is required to be installed in standalone mode` warning appears. Record it. If it does _not_ appear, note that — the BACKLOG's premise would then need checking.

- [ ] **Step 2: Install sharp as a runtime dependency**

```bash
npm install sharp
```

- [ ] **Step 3: Verify it landed in `dependencies`, not `devDependencies`**

```bash
node -e "const p=require('./package.json'); console.log('dependencies:', !!p.dependencies.sharp, '| devDependencies:', !!(p.devDependencies&&p.devDependencies.sharp))"
```

Expected: `dependencies: true | devDependencies: false`. Standalone needs it at serve time — `devDependencies` would not be installed in a production install.

- [ ] **Step 4: Verify the native binary actually loads**

```bash
node -e "const s=require('sharp'); console.log('sharp OK', s.versions)"
```

Expected: prints version info without an error.

**If this fails** (native binary / platform / lockfile trouble): invoke the **Approach B fallback** from spec §7 — revert `package.json`/`package-lock.json`, split sharp into its own PR, and continue with Tasks 6-8 so it cannot block the WebKit work.

- [ ] **Step 5: Verify the build still succeeds**

```bash
npm run build
```

Expected: build completes.

- [ ] **Step 6: Verify the warning is gone**

```bash
npm run test:e2e -- --project=chromium -g "products page displays product grid" 2>&1 | grep -i "sharp" | head -5
```

Expected: **no** standalone warning. This is the acceptance criterion from spec §5.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add sharp as a runtime dependency

next.config.mjs sets output: \"standalone\", which requires sharp at serve
time for next/image optimization. Without it, image optimization is broken
on the self-hosted/VPS path and the E2E logs flood with warnings.

Inert on Vercel (own image optimizer); insurance pending TASK-038b.

Refs TASK-038a."
```

---

## Task 6: Add webkit to CI

**Files:**

- Modify: `.github/workflows/ci.yml:136`, `.github/workflows/ci.yml:161`

**Interfaces:**

- Consumes: Task 4's landing state (any branch) — CI must be green before this lands
- Produces: CI coverage of the WebKit engine

**Ordering is load-bearing (spec §7).** This must land in the same PR as Task 4, after it. Enabling webkit while the test fails turns CI red.

- [ ] **Step 1: Add webkit to the browser install**

At `.github/workflows/ci.yml:136`, change:

```yaml
run: npx playwright install --with-deps chromium
```

to:

```yaml
run: npx playwright install --with-deps chromium webkit
```

- [ ] **Step 2: Add webkit to the E2E run**

At `.github/workflows/ci.yml:161`, change:

```yaml
run: npm run test:e2e -- --project=chromium
```

to:

```yaml
run: npm run test:e2e -- --project=chromium --project=webkit
```

- [ ] **Step 3: Verify the workflow YAML parses**

```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('ci.yml parses OK')"
```

Expected: `ci.yml parses OK`.

- [ ] **Step 4: Verify both projects run locally the way CI will invoke them**

```bash
npm run test:e2e -- --project=chromium --project=webkit
```

Expected: all green (Branch C counts `test.fail()` as green). This is the exact invocation CI uses, so a pass here is the best local predictor.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add webkit to the E2E browser matrix

CI ran chromium only, making the whole engine-split bug class invisible —
which is how the search-filter failure survived. Adds desktop webkit.

Mobile Safari deliberately excluded: same engine, and CI runs workers:1 so
each project roughly adds one full serial pass. Revisit under TASK-040.

Refs TASK-038a."
```

---

## Task 7: Full verification gate

**Files:** none modified — this task only runs checks.

**Interfaces:**

- Consumes: Tasks 4, 5, 6
- Produces: evidence for every acceptance criterion in spec §8

**REQUIRED SUB-SKILL:** Use `superpowers:verification-before-completion`. Evidence before assertions — paste real output, do not claim.

- [ ] **Step 1: Unit tests**

```bash
npm run test:run
```

Expected: 246 tests pass. If the count differs from 246, record the actual number — do not silently accept drift.

- [ ] **Step 2: Lint, typecheck, format**

```bash
npm run lint && npm run typecheck && npm run format:check
```

Expected: all clean.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Full E2E across the local matrix**

```bash
npm run test:e2e
```

Expected: all 5 projects green. Compare against the TASK-033 baseline of 83/85 — the 2 known failures (webkit + Mobile Safari, same test) should now be resolved or explicitly `test.fail()`-marked.

- [ ] **Step 5: Confirm no diagnostic file survives**

```bash
test ! -f tests/e2e/_diagnostic.spec.ts && echo "diagnostic removed OK"
```

Expected: `diagnostic removed OK`.

- [ ] **Step 6: Walk spec §8 acceptance criteria explicitly**

Tick each box in spec §8 with the evidence that satisfies it. Any box you cannot tick is a blocker — report it rather than proceeding.

---

## Task 8: Documentation and completion workflow

**Files:**

- Modify: `docs/planning/BACKLOG.md` (`:345` sharp, `:361` WebKit)
- Modify: `docs/planning/TODO.md`, `docs/planning/DONE.md`, `docs/planning/WEEKLY.md`
- Move: this plan → `docs/archive/plans/`

Per project CLAUDE.md: **Extract → Archive → Transition → Commit → Capture learnings.**

- [ ] **Step 1: Resolve both BACKLOG entries**

- `:345` (sharp) — mark resolved by TASK-038a.
- `:361` (WebKit) — resolve, or correct per Branch B/C. If Branch B, it must record that the "product bug" claim was **disproven**.

- [ ] **Step 2: Extract improvements to BACKLOG (minimum 2)**

Route by source per the global Backlog Intake Rules — Claude-surfaced → 🟤 Auto-Generated, user-raised → 🔵 User-Flagged. Group under `### [2026-07-15] From: TASK-038a`. Candidates surfaced during this work:

- 🟤 `page.route`-based deterministic race testing as a reusable E2E pattern — turns timing flakes into reproducible tests.
- 🟤 CI runs `workers: 1`, so every added project costs a full serial pass; consider parallelising before TASK-040 broadens the matrix.
- 🟤 Audit remaining BACKLOG entries for other unverified root-cause claims — `:361` asserted a product bug without evidence, and that assertion shaped planning.

- [ ] **Step 3: Transition the task**

- `TODO.md`: remove the TASK-038a Prework block (lines 15-18).
- `DONE.md`: add TASK-038a with plan link, summary, key changes, and **which §4.3 branch was taken and why**.
- `WEEKLY.md`: check off the shipped group — Summary-Table Status → `✅ PR #N` (the actual number, never a bare `✅`) **and** the Daily-Schedule entry.

- [ ] **Step 4: Archive the plan**

```bash
git mv docs/planning/plans/2026-07-15_task-038a-prework.md docs/archive/plans/
```

- [ ] **Step 5: Commit the documentation**

```bash
git add -A docs/
git commit -m "docs: Complete TASK-038a — archive plan, transition to DONE

Refs TASK-038a."
```

- [ ] **Step 6: Capture learnings to memory**

Durable decisions/patterns only — not conversation state. Candidates:

- The spec §4.5 position that a known, diagnosed, test-covered failure satisfies the green-baseline gate (if Branch C was taken).
- Whether the defect turned out to be engine-specific or a universal race — this directly informs TASK-036's rewrite.
- `test.fail()` over `test.skip()` for deferred-but-known failures, and why.

- [ ] **Step 7: Open the PR**

Use `superpowers:finishing-a-development-branch`. The PR body must state which §4.3 branch was taken and why — that is the single most important thing a reviewer needs.

---

## Progress Log

_Append findings as you go: Task 1 evidence, Task 2 verdict, Task 3 root cause + branch, deviations._

- **2026-07-15** — Plan created from approved spec. Branch `feat/task-038a-prework` holds spec commits `84886e4`, `3e4ce8f`.
- **2026-07-16 (Task 8, completion)** — Note: Tasks 1-7's per-step evidence was not appended to this log as it happened (only the plan-creation entry above exists); the durable record of Task 3's verdict lives instead in commit `e5ff8ef`'s message and the corrected `docs/planning/BACKLOG.md:361` entry, and in the TASK-038a DONE.md entry. Summary for the archive: Task 3 selected **Branch B** — the WebKit "can filter products by search" failure is a test artifact, not a product bug. Root cause: `searchInput.fill()` was gated on `isVisible()` (paint) rather than hydration; on WebKit only, a pre-hydration programmatic `fill()` produces an `input` event React's synthetic event system never observes, so `search` state stayed `""` and `updateFilters` correctly deleted the falsy key. Discriminated from a genuine product bug via `pressSequentially` (real keystrokes survived 4/4 pre-hydration on WebKit) and 8x-CPU-throttled Chromium (also caught un-hydrated, still passed) — ruling out both "WebKit can't type" and a generic timing race. No `src/` file was modified. Tasks 5-7 (sharp, CI webkit, full verification gate) completed per their commits `69f8682` and `9fe4732`; verification numbers: unit 246+1 todo, lint/typecheck/build/format:check PASS, E2E 84/85 (up from the 83/85 baseline; both previously-failing WebKit/Mobile Safari tests now pass; 1 pre-existing unrelated `[chromium] navigation.spec.ts` dev-server flake remains, BACKLOG'd). Task 8 (this step) completed the documentation workflow: BACKLOG `:345`/`:361` resolved, 5 new BACKLOG entries added, TODO.md/DONE.md/WEEKLY.md transitioned, `.prettierignore` fixed, plan archived.
