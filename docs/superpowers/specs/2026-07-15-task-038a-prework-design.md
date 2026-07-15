# TASK-038a — Prework: WebKit Search Bug, sharp, CI Coverage

**Date**: 2026-07-15
**Status**: Design approved, pending implementation plan
**Branch**: `feat/task-038a-prework`
**Program spec**: [Mirox Shop Program Design](2026-07-14-mirox-shop-program-design.md)
**Depends on**: TASK-033 (complete)
**Blocks**: v1.3 feature work (TASK-034..040), per program spec §2 green-baseline gate

---

## 1. Purpose

TASK-038a resolves the two open decisions carried out of TASK-033 before v1.3 feature work begins,
and closes the CI gap that let one of them go unnoticed.

Both decisions are now made:

| Decision            | Resolution                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| WebKit search bug   | Diagnose first; apply a minimal fix **only if** the confirmed cause permits one (§4.3), and leave a regression test behind either way |
| `sharp` dependency  | Add now, as insurance pending TASK-038b                                                                                               |
| CI browser coverage | Add `webkit` to the CI E2E matrix (desktop only)                                                                                      |

---

## 2. Background

### 2.1 The WebKit failure

`tests/e2e/products.spec.ts` → "can filter products by search" fails on `webkit` and
`Mobile Safari`, and passes on `chromium`, `firefox`, and `Mobile Chrome`. Submitting the search
form produces `/products?page=1` — the `search` param is absent rather than wrong.

That symptom is consistent with `search` state being empty at submit time: `handleSearch` calls
`updateFilters({ search: search || null })`
([products-content.tsx:179-182](<../../../src/app/(shop)/products/products-content.tsx#L179-L182>)),
and `updateFilters` **deletes** any key whose value is falsy
([products-content.tsx:167-173](<../../../src/app/(shop)/products/products-content.tsx#L167-L173>)).
An empty `search` therefore removes the param instead of setting it.

### 2.2 What is not yet established

`docs/planning/BACKLOG.md:361` asserts this is a "pre-existing product bug." **That claim is
unverified and this spec does not assume it.** Two hypotheses were considered during design:

- **H1 — `search` state never receives the typed value.** Playwright's `fill()` mutates the DOM and
  dispatches an `input` event; if React's `onChange` does not process it, `search` stays `""`.
- **H2 — a URL→state sync effect clobbers the typed value.** The effect at
  [products-content.tsx:130-136](<../../../src/app/(shop)/products/products-content.tsx#L130-L136>)
  resets `search` from `searchParams`.

H2 is **substantially weakened**: Next.js memoizes `useSearchParams` on the router context value
(`node_modules/next/dist/client/components/navigation.js`), so its identity is stable across the
local `setState` re-renders caused by `fetchProducts`. The effect should not re-fire on those.

H1 is **strengthened** by an engine/path split. The two failing projects use _different_ submit
mechanisms — `Mobile Safari` presses Enter
([products.spec.ts:27](../../../tests/e2e/products.spec.ts#L27)), desktop `webkit` clicks the button
([products.spec.ts:33](../../../tests/e2e/products.spec.ts#L33)) — yet both fail, while all three
non-WebKit engines pass using those same two mechanisms. The defect is therefore **upstream of
submit**, in the shared `fill()` → `onChange` → `setSearch` link.

This matters because it leaves open whether the root cause is a **product bug** or a **test
artifact**, and the two demand different fixes.

### 2.3 Why CI never caught it

`.github/workflows/ci.yml` installs and runs `chromium` only
([ci.yml:136](../../../.github/workflows/ci.yml#L136),
[ci.yml:161](../../../.github/workflows/ci.yml#L161)), while `playwright.config.ts` defines five
projects locally. The entire engine-split bug class is invisible to CI.

### 2.4 Why `sharp` is real

`next.config.mjs` sets `output: "standalone"`, and `sharp` is absent from `package.json`. On the
standalone/VPS path this means `next/image` optimization is broken, not merely noisy. Vercel ships
its own image optimizer, so production today is unaffected.

---

## 3. Scope boundary

TASK-036 ("Catalog redesign + filters") **rewrites `products-content.tsx`** — five filters, four
sort orders, URL-reflected state. The fix code written here is therefore expected to be short-lived.

The durable deliverables of this task, in priority order:

1. The **diagnosis** — so TASK-036's rewrite cannot silently reinherit the defect.
2. The **regression test** — so the rewrite is held to it.
3. The **CI webkit job** — so the test actually fires.

The **fix code itself is the least valuable artifact.** This ordering is deliberate and drives the
circuit-breaker in §4.3.

---

## 4. Workstream A — WebKit diagnosis and fix

### 4.1 Phase 1: Reproduce

```bash
npm run test:e2e -- --project=webkit -g "can filter products by search"
```

Must be confirmed red locally before any fix work. No fix is written against an unreproduced
failure.

### 4.2 Phase 2: One discriminating experiment

The search input is **controlled** (`value={search}`,
[products-content.tsx:221-226](<../../../src/app/(shop)/products/products-content.tsx#L221-L226>)),
so React reasserts its own state onto the DOM on every re-render. That property yields a decisive
read:

> Fill `"test"` **while the product fetch is still in flight**, let the fetch resolve (forcing a
> re-render), then read `input.value` back.

**Required premise — do not omit.** The forcing re-render must be one that does **not** change
`searchParams`. The product-fetch resolution qualifies: it sets `products`, `pagination`, and
`isLoading` only. This premise is what makes the read discriminating. Without it the experiment is
invalid, because a snap-back to `""` is consistent with **both** H1 and H2 — under H1 `onChange`
never fired, and under H2 the effect overwrote the value; both leave `search === ""` and both make
React reassert `value=""`. Holding `searchParams` constant rules H2 out, since its effect cannot
fire.

| Observation              | Conclusion                                                                       |
| ------------------------ | -------------------------------------------------------------------------------- |
| Value snaps back to `""` | **H1.** `onChange` never fired; `fill()` only mutated the DOM.                   |
| Value stays `"test"`     | State genuinely holds it; defect is downstream in `updateFilters`/`router.push`. |

**Make the race deterministic.** Rather than relying on WebKit's natural slowness, delay the API
response with `page.route("**/api/products*", ...)` so the fill provably precedes the re-render on
every engine. This converts a timing-dependent flake into a reproducible experiment, and lets the
same probe run on `chromium` — which reveals whether the defect is genuinely engine-specific or
merely a race that WebKit loses more often.

This read also settles the product-bug-vs-test-artifact fork.

### 4.3 Phase 3: Fix, gated by a circuit-breaker

The fix targets **only** what Phase 2 confirms. Three landing states are all acceptable outcomes:

- **Product bug, minimally fixable** → fix, regression test, done.
- **Test artifact** → fix the test, and **correct `BACKLOG.md:361`**, whose "product bug" claim
  would then be disproven.
- **Product bug, structurally rooted** → **stop.** Do not restructure the component's state/URL
  model. Document the diagnosis, add it as a TASK-036 acceptance criterion, land Workstreams B and
  C, and leave the product code untouched. **Mark the test `test.fail()`** (see §4.4).

**Circuit-breaker trigger**: the minimal fix requires restructuring the component's state or URL
model, rather than a localized change.

### 4.4 Branch-three interaction with CI (required)

Branch three enables `webkit` in CI while the test still fails — which would make CI red and defeat
the purpose of Workstream C. It must therefore be paired with an explicit expected-failure marker:

```ts
// TASK-036 owns the fix; see docs/superpowers/specs/2026-07-15-task-038a-prework-design.md §4.3
test.fail();
```

`test.fail()` is chosen over `test.skip()` deliberately: Playwright **errors if a `test.fail()` test
passes**, so the marker self-flags the moment TASK-036's rewrite fixes the behaviour, rather than
rotting silently as a skipped test would. CI stays green, the expectation stays recorded, and the
regression test still exists in branches one and two as a normal passing test.

### 4.5 On the program spec §2 green-baseline gate

If the work lands in the third branch, the baseline remains technically red against program spec §2.

**Accepted position**: a _known, diagnosed, test-covered_ failure with a scheduled owner (TASK-036)
satisfies the intent of that gate; an _unexplained_ failure does not. This is a judgment call,
approved by the user during design, and recorded here so it does not resurface as a merge-time
surprise.

---

## 5. Workstream B — sharp

Install `sharp` as a **runtime dependency** (not `devDependencies` — standalone needs it at serve
time), at its current version within semver, per the conservative-update policy.

**Validation**: run the build and confirm the
`'sharp' is required to be installed in standalone mode` line is absent from the E2E web-server
logs.

**Rationale**: TASK-038b may force self-hosting on Ukrainian payment/hosting constraints. Adding
`sharp` now is inert on Vercel and cheap insurance for that outcome.

---

## 6. Workstream C — CI coverage

Two edits to `.github/workflows/ci.yml`:

- [ci.yml:136](../../../.github/workflows/ci.yml#L136) — add `webkit` to `playwright install`.
- [ci.yml:161](../../../.github/workflows/ci.yml#L161) — add `--project=webkit` to the E2E run.

**Cost**: CI sets `workers: 1` ([playwright.config.ts:13](../../../playwright.config.ts#L13)), so
E2E runs serially and this **roughly doubles E2E wall-clock**, plus one extra browser download per
run.

**Mobile Safari is deliberately excluded.** Desktop `webkit` covers the same engine and therefore
the same root cause. The Enter-key interaction path stays uncovered in CI and is cheap to run
locally. Revisit under TASK-040 if broader matrix coverage is wanted.

**Note on the deterministic probe.** If §4.2's `page.route` delay reproduces the defect on
`chromium` as well, then the regression test can be written engine-independently and will fail on
`chromium` too — meaning the primary regression guard no longer depends on the webkit job at all.
Webkit in CI then becomes belt-and-braces rather than the sole protection. This is the preferred
outcome and should be pursued if Phase 2 supports it.

---

## 7. Sequencing and delivery

**Approach A — one PR, ordered internally.**

Order is load-bearing: enabling `webkit` in CI before the fix lands turns CI red, so the fix,
regression test, and CI change must be **atomic**.

1. Diagnose (Workstream A, Phases 1-2)
2. Fix + regression test (Workstream A, Phase 3)
3. Enable webkit in CI (Workstream C) — atomic with step 2
4. Add sharp (Workstream B)

**Fallback — Approach B (two PRs).** If `sharp` misbehaves (native binary, devcontainer or lockfile
platform trouble), split it into its own PR so it cannot block the WebKit work.

---

## 8. Acceptance criteria

- [ ] WebKit failure reproduced locally before any fix is written
- [ ] Root cause confirmed by the Phase 2 experiment, with evidence recorded
- [ ] One of the three §4.3 branches taken, and the choice justified in the PR
- [ ] Regression test covering the confirmed cause, failing before the fix and passing after
- [ ] `webkit` E2E green — either genuinely, or via a branch-three `test.fail()` marker (§4.4) with
      a TASK-036 acceptance criterion added
- [ ] CI is green on merge in every branch of §4.3
- [ ] `chromium` E2E still green
- [ ] 246 unit tests green
- [ ] `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` all clean
- [ ] `sharp` present as a runtime dependency; standalone warning absent from E2E web-server logs
- [ ] CI installs and runs both `chromium` and `webkit`
- [ ] `BACKLOG.md:345` (sharp) and `:361` (WebKit) resolved or corrected to match findings

---

## 9. Risks

| Risk                                                  | Mitigation                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `sharp` native binary breaks devcontainer or lockfile | Approach B fallback — split into its own PR                      |
| webkit in CI surfaces _other_ pre-existing failures   | Local baseline says it should not; triage and BACKLOG if it does |
| Diagnosis exceeds its budget                          | Circuit-breaker §4.3 — document and defer to TASK-036            |
| Fix masks rather than resolves the defect             | No fix without a confirmed Phase 2 root cause                    |
| CI E2E time roughly doubles                           | Accepted; revisit under TASK-040                                 |

---

## 10. Out of scope

- Restructuring the state/URL model of `products-content.tsx` (TASK-036 owns this)
- `Mobile Safari`, `firefox`, `Mobile Chrome` in CI (TASK-040 may revisit)
- Lighthouse CI, preview deploys, weekly audit workflow (TASK-040)
- Any v1.3 feature work
