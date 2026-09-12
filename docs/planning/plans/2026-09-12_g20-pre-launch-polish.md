# G20 — Pre-Launch Polish Plan

**Last Updated**: 2026-09-12
**Task**: G20 (WEEKLY [G20](../WEEKLY.md#g20-pre-launch-polish-batch)) · 🔵 User (by steer, 2026-08-11 "ask + polish", confirmed 2026-08-20) · members are 🟤-origin: BACKLOG [2026-08-15] G14 audit (mobile rail) + TODO.md § Medium Priority [2026-08-14] (G8 feedback/marquee residue)
**Branch**: `feat/g20-pre-launch-polish` (from `main` @ `6e98f4d`)
**Status**: In progress
**Spec**: none — classified **bounded** at brainstorming (2026-09-12): both members change flows that already exist in this repo. Design approved in chat; this plan is the project-convention record.

> **For agentic workers:** steps use checkbox (`- [ ]`) syntax for tracking. TDD per task: failing test first, run it red, then implement.

**Goal:** Ship the last two pre-launch polish items — the mobile «Новинки» horizontal-scroll rail from the design handoff, and the four-part G8 feedback/marquee residue batch — without touching checkout chrome (deferred by user ruling 2026-08-20).

**Architecture:** Two independent commits. Member 1 is confined to one component's responsive classes ([src/components/home/ProductRail.tsx](../../../src/components/home/ProductRail.tsx)); the same element switches from a horizontal flex scroller below `sm:` to the existing grid at `sm:` and up. Member 2 is a cross-cutting one-line idiom applied to eight API handlers, one `ResizeObserver` target added, six tests, and one comment.

**Tech Stack:** Next.js 14 App Router, Tailwind v4, Vitest + Testing Library (jsdom).

---

## Global Constraints

- **`/etc/environment` still carries `NODE_ENV="development"`** (verified 2026-09-12; the G4 contaminant, unfixed — it is outside the repo, so `.env.example` and `devcontainer.json` being clean does not help). A plain local `next build` therefore compiles **corrupted responsive utilities**, which is exactly what this task produces. Every compiled-CSS check MUST run as `env -u NODE_ENV npm run build`. Running it without that is a check that cannot fail — see CLAUDE.md § Abort Conditions.
- **Verify against the compiled CSS, never the className.** Tailwind v4 in this repo silently drops some authored CSS (nested commas in arbitrary values; bare `@media` inside `@layer utilities` in prod builds). Member 1 deliberately introduces **no new CSS utility** so it cannot hit the `@layer` class of failure, but the emitted `sm:` rules still get grepped out of the build output.
- **`rm -rf .next` before every visual-gate round** — `next dev` serves a stale cache ([[next-dev-serves-stale-next-cache]]).
- **Gate screenshots ship as one Artifact URL per round**, never chat-inline ([[gate-screenshots-via-artifact]]).
- **Negative margins are a matched pair.** `-mr-4` must be paired with an equal `pr-4`, and the test asserts the two values **match each other** rather than asserting a literal class string — an assertion that merely restates the source cannot fail ([[negative-margin-pairs-and-overlay-scoped-assertions]], [[guards-need-teeth-and-token-layer-coverage]]).
- **TDD** — failing test first for every code task. `npm run test:run` before every commit; `.husky/pre-commit` runs lint-staged only, not the unit suite.
- **Docs freshness is enforced by a test.** This plan needs its `docs/README.md` Implementation Plans row in the same commit, and the index's own `**Last Updated**` must be ≥ every date it lists.
- **Bare `catch`** when the error variable is unused; **Prettier**: double quotes, semicolons, 2-space indent, 100-char width, trailing commas (es5).
- **No string changes.** Neither member adds or edits UI copy, so no catalog work and no E2E locator sweep is triggered.

---

## Member 1 — Mobile «Новинки» horizontal-scroll rail

Source: BACKLOG [2026-08-15] G14 audit. Mockup: [`Mirox Mobile.dc.html`](../../design/design_handoff_mirox/Mirox%20Mobile.dc.html) — 160px cards, 12px gap, `display:flex`, bleeding off the right edge inside a `padding:24px 20px` section.

### Task 1.1: Rail responsive mode switch

**Files:** Modify `src/components/home/ProductRail.tsx` · Test `tests/unit/product-rail.test.tsx`

**Design (approved 2026-09-12):**

- One element, two modes: `flex overflow-x-auto sm:grid sm:overflow-visible`, keeping `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` untouched. `gap-6` applies in both modes.
- Each card gains a `w-40 shrink-0 sm:w-auto` wrapper (160px = `w-40` = the mockup width). `ProductCard`'s `h-full` survives: flex and grid items both stretch by default.
- Full-bleed right: `-mr-4 pr-4 sm:mr-0 sm:pr-0`, matched against the container's own `px-4` ([src/app/globals.css](../../../src/app/globals.css) `.container`).

**Deliberately excluded** (recorded so a later reviewer does not read these as oversights):

- **No scroll-snap** — not in the mockup; adds interaction the design never specified.
- **No `scrollbar-hide` utility** — mobile scrollbars are already overlay-style, and skipping it avoids the Tailwind-v4 `@layer` landmine entirely.
- **No `tabIndex` on the scroller** — its children are links, so the region is already keyboard-reachable; adding one would create a redundant desktop tab stop.

- [x] **Step 1: Write the failing tests**

Extend `tests/unit/product-rail.test.tsx`:

1. the scroll container carries both modes (`flex`/`overflow-x-auto` and the `sm:` grid reset);
2. every card sits in a fixed-width wrapper that releases at `sm:`;
3. **the bleed guard with teeth** — extract the negative-margin value and the padding value from the class list and assert they are numerically equal, so an edit to one without the other fails.

- [x] **Step 2: Implement** the class changes and the wrapper element.
- [x] **Step 3: Verify** — `npm run test:run`, `npm run lint`, `npm run typecheck`.
- [x] **Step 4: Compiled-CSS check** — `env -u NODE_ENV npm run build`, then grep the emitted CSS chunk for the `sm:` grid rules and the margin/padding pair. Record the grep output in this plan; a check with no quoted matched line proves nothing ([[concept-grep-proves-nothing]]).
- [x] **Step 5: Visual gate** — `rm -rf .next`, dev server, homepage at 390px and at ≥`sm:`, screenshots delivered as one Artifact URL.

**Gate round 1 (2026-09-12)** — <https://claude.ai/code/artifact/c287738f-4733-4cb1-8170-ba1aa2ce0aa2>

Captured with Playwright driven directly from the repo (`--no-sandbox`; the MCP
browser cannot sandbox as root in this container), `deviceScaleFactor: 2`, on a
cleared `.next`. Every number was read off the live DOM in the same pass rather
than restated from source:

| viewport | display | overflow-x | margin/padding-right | card width | scroll / client |
| -------- | ------- | ---------- | -------------------- | ---------- | --------------- |
| 390      | flex    | auto       | −16px / 16px         | 160px      | 728 / 374       |
| 768      | grid    | visible    | 0px / 0px            | 224px      | 720 / 720       |
| 1280     | grid    | visible    | 0px / 0px            | 286px      | 1216 / 1216     |

The rail's right edge lands at exactly 390 at mobile — full bleed, no overhang —
and the bleed pair is fully zeroed above the breakpoint, so the desktop grid is
unchanged. **Verdict: matches the mockup.**

**One finding, pre-existing and out of scope.** At 390px the _document_ is 396px
wide — the homepage scrolls sideways by 6px. The rail does not cause it: its own
right edge is 390 and everything beyond sits inside the scroller. Walking the DOM
for elements overflowing **without a clipping ancestor** returns exactly one
culprit, the footer's `nav.flex.gap-6`. Proven pre-existing by measuring three
rail-free pages:

```
path        docScrollWidth  hasRail  offending nav right
/                      396    true                  396
/feedback              396   false                  396
/track                 396   false                  396
/cart                  396   false                  396
```

Filed 🟤 BACKLOG [2026-09-12]; surfaced to the user as a decision rather than
absorbed, since it is live on every mobile page but belongs to neither G20 member.

**Second observation, no action.** The shipped card is 421px tall against the
mockup's ~260px, because `ProductCard` also carries category, short description,
swatch and size list. That component is shared with the catalog, quick view and
bought-together, so slimming it here would change four surfaces. The backlog item
asked for 160px-wide cards in a scroller; card density is a separate question.

**Step 1 evidence (guard proven to fail).** The bleed test was mutation-checked
before being trusted: changing `-mr-4` → `-mr-6` in the component produced

```
AssertionError: expected [ '-mr-6', 'mt-8', 'flex', …(10) ] to include '-mr-4'
× bleeds right by exactly the container's own horizontal padding
Tests  1 failed | 5 passed (6)
```

so the pair assertion is a control, not a restatement.

**Step 4 evidence (compiled CSS, `env -u NODE_ENV npm run build`, exit 0).**
Two CSS chunks are emitted; the rail's rules live in
`.next/static/css/1587a4d57afeb6c7.css`. Matched lines, quoted:

```
.overflow-x-auto{overflow-x:auto}
.-mr-4{margin-right:calc(var(--spacing)*-4)}
.pr-4{padding-right:calc(var(--spacing)*4)}
.w-40{width:calc(var(--spacing)*40)}
.shrink-0{flex-shrink:0}
.container{…;padding-inline:calc(var(--spacing)*4);…}
```

`.container`'s inline padding is `spacing*4` and the rail's bleed pair is
`-4` / `+4` — an exact cancellation, confirmed against the build output rather
than the className. The `sm:` resets all compiled **inside** a
`@media (min-width:40rem)` block (3 such blocks, 2093 bytes total):

```
.sm\:grid{display:grid}
.sm\:overflow-visible{overflow:visible}
.sm\:mr-0{margin-right:calc(var(--spacing)*0)}
.sm\:pr-0{padding-right:calc(var(--spacing)*0)}
.sm\:w-auto{width:auto}
.sm\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
```

The presence of populated `min-width:40rem` blocks is itself the evidence the
`env -u NODE_ENV` workaround did its job — a NODE_ENV-contaminated build is
precisely the one that drops these.

### Task 1.2: Mobile-PDP contextual header — assessment only

The backlog entry asks for this to be _assessed_ in the same pass, not built (user ruling 2026-09-12, mirroring the 2026-08-20 checkout-header deferral).

- [x] Compare the mockup's mobile PDP header (back arrow + product name) against the shipped PDP; write the delta, a recommendation, and an effort estimate into this plan and file the BACKLOG entry. **No implementation.**

**Assessment (2026-09-12).** The mockup's mobile PDP replaces the global chrome
with a contextual header — back arrow, product name centred, wishlist heart
right; no logo, nav, search, cart icon or announcement bar. Shipped keeps the
full sticky `Header` + `AnnouncementBar` from the shop layout and offers a text
breadcrumb («Головна / Каталог / {name}», `product-detail-client.tsx:200`) as
the only back affordance. The `ArrowLeft` button at line 434 is in the
**not-found** branch, not the product view — worth stating, because grepping
that file for a back arrow finds it and suggests the affordance already exists.

Four deltas: no contextual back arrow · product name absent from the header ·
heart absent (already TASK-041, not double-counted here) · chrome not stripped.

**Recommendation: defer**, same class as the deferred checkout header. Three
reasons, in order of weight:

1. It cannot be done inside the PDP. `src/app/(shop)/layout.tsx` wraps
   `Header`/`AnnouncementBar` for the whole route group, so stripping them on
   one route needs a route-scoped layout override or a pathname conditional
   that would push that layout client-side.
2. It collides with a standing ruling. The announcement bar is sticky **by the
   2026-08-12 gate decision**; hiding it on the PDP re-opens that decision
   rather than implementing around it.
3. The capability is not missing — the breadcrumb already provides the way
   back. This is polish, and it is structurally invasive polish on the route
   that carries the conversion, days before launch.

Estimated **2–3 SP** including its own visual-gate round. Filed 🟤 BACKLOG
[2026-09-12]; revisit post-launch alongside the checkout header.

---

## Member 2 — G8 feedback/marquee residue batch

Source: TODO.md § Medium Priority [2026-08-14], ranked by the PR #35 re-review. One commit.

### Task 2.1: Malformed JSON → 400 `VALIDATION_ERROR`

The defect: `await request.json()` throws a `SyntaxError` on a malformed body, which falls through to the route's generic `catch` and answers **500**. That is a status-code lie — the caller's bad request is reported as our failure. G18 already fixed this class at [src/app/api/orders/lookup/route.ts:22](../../../src/app/api/orders/lookup/route.ts#L22); this task applies the same idiom.

**Idiom:** `const body = await request.json().catch(() => null);`

`null` then flows into the route's existing validation. Routes using `safeParse` return their existing `VALIDATION_ERROR` 400; routes using throwing `.parse()` raise a `ZodError` and land on their existing 400 branch. **No route gains a new branch.**

**Scope — 8 handlers** (user ruling 2026-09-12: all public POST routes, not just the two named in the backlog):

| Route                                         | Handler | Guard       | Parse style |
| --------------------------------------------- | ------- | ----------- | ----------- |
| `src/app/api/feedback/route.ts`               | POST    | public      | safeParse   |
| `src/app/api/newsletter/subscribe/route.ts`   | POST    | public      | safeParse   |
| `src/app/api/newsletter/unsubscribe/route.ts` | POST    | public      | safeParse   |
| `src/app/api/auth/register/route.ts`          | POST    | public      | see step    |
| `src/app/api/checkout/create-order/route.ts`  | POST    | public      | `.parse()`  |
| `src/app/api/checkout/confirm-order/route.ts` | POST    | public      | `.parse()`  |
| `src/app/api/reviews/route.ts`                | POST    | requireAuth | see step    |
| `src/app/api/reviews/[id]/route.ts`           | PUT     | requireAuth | see step    |

**Excluded, with reason** (not silently skipped):

- `src/app/api/checkout/create-payment-intent/route.ts` — the Stripe payment-intent path is **dormant since G2** (2026-08-06). Touching it would imply it is live.
- All 15 `src/app/api/admin/**` handlers — `requireAdmin()`-guarded, so an authenticated administrator is the only caller that can send a malformed body; near-zero exposure against a large diff days before launch.

- [x] **Step 1: Write the failing tests** — one per handler, POSTing a body that is not valid JSON, asserting **400** and (where the route has one) the `VALIDATION_ERROR` code. Run red: each must currently fail with 500, which is the proof the tests are not vacuous.
- [x] **Step 2: Implement** the `.catch(() => null)` on each of the 8 handlers.
- [x] **Step 3: Verify** each route's _existing_ tests still pass — the `null` body must not disturb any success or validation path.

### Task 2.2: `observer.observe(first)` font-swap guard

[src/components/common/AnnouncementBar.tsx](../../../src/components/common/AnnouncementBar.tsx) observes only the marquee **viewport**. A late webfont swap changes the width of the **copy**, not the viewport — so `--marquee-shift` keeps a pre-swap value and the marquee shows a seam. Fix: observe the first copy as well, so either resize re-measures.

- [x] **Step 1: Write the failing test** — a stub `ResizeObserver` recording its observed targets; assert both the viewport and the first copy are observed. Run red.
- [x] **Step 2: Implement** — add `observer.observe(first)` next to the existing `observer.observe(viewport)`; the existing `observer.disconnect()` cleanup already covers both.

### Task 2.3: Test debt

The six paths the PR #35 re-review listed as untested:

- [x] whitespace-only honeypot (`website: "   "` — currently passes the `.trim() !== ""` check and sends; confirm intended)
- [x] JSON-parse route paths (covered by Task 2.1's tests — cross-referenced, not duplicated)
- [x] `VALIDATION_ERROR` toast path in the feedback form
- [x] `\r\n` newline handling in the feedback email template
- [x] name-only / email-only conditional template rows
- [x] boundary values: name=100, message=5 and message=2000

**These are coverage debt, not bug fixes** — every one passed on first run
against unchanged source. An always-green test proves nothing, so each was
mutation-checked before being trusted:

| Mutation                                      | Caught by                                       |
| --------------------------------------------- | ----------------------------------------------- |
| `/\r?\n/g` → `/\n/g` in the feedback template | the CRLF test only — the `\n` test still passed |
| contact-row guard `data.name` → `true`        | the email-only and anonymous tests              |
| `message.min(5)` → `.min(6)`                  | the 5-character boundary test                   |
| `name.max(100)` → `.max(99)`                  | the 100-character boundary test                 |

The pre-existing rejection tests (4 chars, 2001 chars) survived both schema
mutations, which is precisely the gap these fill.

### Task 2.4: Static-variant inset note

The non-marquee announcement variant has an asymmetric `pr-3`-only inset. It is unreachable today (`site.announcement.marquee === true`).

- [x] Add a code comment recording the asymmetry and that it must be fixed **before** that variant is ever activated. **No behavior change.**

---

## Close-out

- [x] Extract improvements → BACKLOG.md (min 2, 🟤 for Claude-surfaced) and actionable items → TODO.md
- [ ] Archive this plan → `docs/archive/plans/` — **four** edits: move the file, move its index row to the archive table, repoint inbound links, fix this file's own outbound relative links (depth changes by one)
- [ ] WEEKLY.md: G20 Summary-Table status → `✅ PR #N` and the Thursday Daily-Schedule entry
- [ ] TODO.md → DONE.md transition; commit docs; capture durable learnings → memory
