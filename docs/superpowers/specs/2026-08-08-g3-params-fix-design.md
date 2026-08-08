# G3 — `use(params)` Fix on Next 14.2.35 (4 Broken Client Routes)

**Status:** Approved (design sign-off 2026-08-08)
**Date:** 2026-08-08
**Task:** WEEKLY G3 "Params Fix [solo]" — 🟤 Auto · 2 SP · Wed
**Origin:** BACKLOG [2026-07-18] "From: TASK-034 Task 12 verification pass" — `use(params)` breaks 4 dynamic routes [HIGH]
**Branch:** `feat/g3-params-fix`

---

## 1. Problem

Four client-component pages (`"use client"`) type their route params as `params: Promise<{ id: string }>` and unwrap them with React's `use()`:

| Route                   | Call site                                          |
| ----------------------- | -------------------------------------------------- |
| `/admin/orders/[id]`    | `src/app/(admin)/admin/orders/[id]/page.tsx:151`   |
| `/admin/products/[id]`  | `src/app/(admin)/admin/products/[id]/page.tsx:34`  |
| `/admin/suppliers/[id]` | `src/app/(admin)/admin/suppliers/[id]/page.tsx:99` |
| `/account/orders/[id]`  | `src/app/(shop)/account/orders/[id]/page.tsx:89`   |

The pinned Next.js 14.2.35 passes `params` to client components as a **plain object** (Promise-based params is Next 15 behavior), so each page 500s at runtime with `An unsupported type was passed to use(): [object Object]`. All four 500s were verified first-hand in the TASK-034 verification pass (direct `page.goto()` + captured `pageerror`/server-log text).

The server-component `[slug]` pages and the API route handlers also type `params` as a Promise but unwrap with `await`, which is a no-op on a plain object — they work today and are forward-correct for Next 15+. They are untouched.

## 2. Decision

**Fix pattern: `useParams()` hook** (chosen over plain-object props and over upgrading Next):

- `useParams<{ id: string }>()` from `next/navigation` works identically on Next 14, 15, and 16 — zero re-migration when the ROADMAP'd Next.js 16 + React 19 upgrade lands. Plain-object props would be version-honest for 14 but would have to be migrated _back_ to Promise/`use(params)` at that upgrade (client params become Promises again in 15+).
- Upgrading Next now is out of scope for a 2 SP slot; it is its own ROADMAP infrastructure item.

**Regression check: RTL render tests now, E2E later.** Vitest + RTL + jsdom are already in use for component tests. The E2E suite has no auth/login helper, and middleware redirects unauthenticated visitors away from `/admin/*` and `/account/*`, so a browser-level regression test cannot reach these pages without new login infrastructure — that is deferred to a new 🟤 BACKLOG entry.

## 3. The Fix (4 files, one mechanical pattern)

In each of the four pages:

1. Replace `const { id } = use(params);` with `const { id } = useParams<{ id: string }>();`
2. Add `useParams` to the existing `next/navigation` import (or create it); remove `use` from the `react` import.
3. Delete the now-unused `…PageProps` interface (`params: Promise<{ id: string }>` is its only member) and the `{ params }` prop — the components become prop-less.

Nothing downstream changes: fetch URLs, `useEffect` deps keyed on `id`, error/404 handling all stay as-is.

## 4. Regression Tests (TDD)

One new unit test file (`tests/unit/` — a `.test.tsx` covering all four pages) that:

- Mocks `next/navigation` (`useParams` → `{ id: "test-id" }`, plus `useRouter` where used) and global `fetch`.
- Renders each page component and asserts it renders without throwing **and** that `fetch` was called with the id-bearing URL (e.g. `/api/orders/test-id`, `/api/admin/products/test-id`) — proving the id actually flows into data fetching, not just that render survives (non-vacuous per the guards-need-teeth rule).
- **Teeth check:** the tests are written first and run against the current broken code, where rendering throws from `use()` — observed red before the fix, green after.

## 5. Docs Propagation

The break is documented as live fact in three surfaces that must flip to describe the fixed pattern:

- Root `CLAUDE.md` — "Async params unwrapping (currently broken)" bullet under Detected Patterns.
- `src/app/CLAUDE.md` — "Async params (broken on the pinned Next 14.2.35)" bullet under Module-Specific Conventions.
- BACKLOG [2026-07-18] entry — resolved through the normal completion flow (WEEKLY G3 row → ✅ PR #N).

New 🟤 BACKLOG entry to add: E2E auth/login helper (admin + customer) + authenticated smoke tests for the four dynamic routes — the deferred browser-level regression coverage.

## 6. Verification

- `npm run typecheck`, `npm run lint`, full `npm run test:run` (new tests red-then-green per §4).
- Real-browser pass: dev server, log in as seeded admin and as a seeded customer, load all four routes with real ids, confirm HTTP 200 and rendered detail views — the same method that confirmed the original 500s.

## 7. Out of Scope

- API-route `Promise<{ id }>` param typings and the `[slug]` server pages' `await params` (working, forward-correct).
- `tests/helpers/api-test-utils.ts` `createRouteParams` (matches the handler typings it serves).
- The Next.js 16 + React 19 upgrade (separate ROADMAP item).
