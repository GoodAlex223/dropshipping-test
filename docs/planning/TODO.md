# TODO

Project freeze week — stability, cleanup, and documentation. No new features.

**Last Updated**: 2026-02-09 (updated)
**Freeze Period**: 2026-02-09 to 2026-02-13

---

## In Progress

<!-- No tasks in progress -->

---

## High Priority

### [TASK-028] Test Coverage Improvement

**Priority**: High
**Date**: 2026-02-10 — 2026-02-11
**Estimated effort**: 6-8 hours

**Description**: Add missing unit tests for API routes and critical business logic. Focus on review and newsletter endpoints identified in BACKLOG.

**Sub-tasks**:

- [ ] Add unit tests for review API routes (create, eligibility, admin reply, visibility toggle)
- [ ] Add unit tests for newsletter API routes (subscribe, confirm, unsubscribe, admin endpoints)
- [ ] Add unit tests for `newsletter.ts` utility functions (token generation, HMAC verification)
- [ ] Add unit tests for `seo.ts` JSON-LD generation (product, review structured data)
- [ ] Run `npm run test:coverage` and document current coverage baseline
- [ ] Ensure all new tests pass in CI

---

## Medium Priority

### [TASK-029] Technical Debt Cleanup

**Priority**: Medium
**Date**: 2026-02-11 — 2026-02-12
**Estimated effort**: 4-5 hours

**Description**: Address technical debt items from BACKLOG and code review findings.

**Sub-tasks**:

- [ ] Validate `parseInt()` results for rating query params in review API routes (NaN guard)
- [ ] Merge `getReviewsJsonLd()` into `getProductJsonLd()` — single Product JSON-LD per page
- [ ] Extract shared Review interfaces to `src/types/index.ts` (remove duplication)
- [ ] Simplify type assertions in subscriber seeding (use optional chaining)
- [ ] Add cross-field validation for `comparePrice > price` in admin ProductForm
- [ ] Replace `console.error` with structured error responses where appropriate

---

### [TASK-030] Documentation Finalization

**Priority**: Medium
**Date**: 2026-02-12
**Estimated effort**: 3-4 hours

**Description**: Ensure all project documentation is current, accurate, and complete before freeze.

**Sub-tasks**:

- [ ] Review and update README.md (features list, setup instructions, current state)
- [ ] Verify all docs/ files match actual code state (no stale references)
- [ ] Update ARCHITECTURE.md if any structural changes were missed
- [ ] Add deployment documentation (Vercel setup steps, required env vars)
- [ ] Review and update `.env.example` with all current environment variables
- [ ] Verify DONE.md has complete records of all finished tasks

---

### [TASK-031] Code Quality Sweep

**Priority**: Medium
**Date**: 2026-02-12 — 2026-02-13
**Estimated effort**: 3-4 hours

**Description**: Final code quality pass — fix lint warnings, TypeScript strict issues, and remove dead code.

**Sub-tasks**:

- [ ] Run `npm run lint` and fix all warnings (not just errors)
- [ ] Run `npm run typecheck` and resolve any non-critical type issues
- [ ] Search for and remove any `TODO`, `FIXME`, `HACK` comments that are resolved
- [ ] Remove unused imports, variables, and dead code paths
- [ ] Verify all pre-commit hooks pass cleanly on a full repo check

---

## Low Priority

### [TASK-032] Freeze Finalization & Release Tag

**Priority**: Low
**Date**: 2026-02-13
**Estimated effort**: 1-2 hours

**Description**: Final freeze steps — tag the release, update project status, and document the freeze state.

**Sub-tasks**:

- [ ] Ensure all TASK-027 through TASK-031 are completed or deferred with reasoning
- [ ] Create git tag `v1.0.0-freeze` on main branch
- [ ] Update TODO.md — move remaining items back to BACKLOG with freeze note
- [ ] Update ROADMAP.md with freeze status and future resumption plan
- [ ] Final `npm run build && npm run test:run && npm run test:e2e` validation

---

## Blocked

<!-- No blocked tasks -->

---

## Completed

All MVP implementation tasks (TASK-001 through TASK-016), TASK-017 through TASK-022, TASK-023 (Customer Reviews), TASK-024 (Newsletter), TASK-025 (Fix E2E Tests), and TASK-026 (Fix Vercel Deploy) have been completed. See [DONE.md](DONE.md) for details.

---

## Notes

- MVP implementation (Phases 1-5.4) is **COMPLETE**
- **PROJECT FREEZE**: Feb 9-13, 2026 — no new features, stability and cleanup only
- Demo site deployed to Vercel with Neon database
- Tasks requiring real business moved to [BACKLOG.md](BACKLOG.md)
- Completed tasks move to [DONE.md](DONE.md)
- After freeze: all remaining enhancement ideas stay in BACKLOG for future resumption
