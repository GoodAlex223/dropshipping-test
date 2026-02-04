# TODO

Active tasks for Dropshipping Website MVP.

**Last Updated**: 2026-02-03

---

## In Progress

<!-- No tasks in progress -->

---

## High Priority

### [TASK-025] - Fix E2E Test Infrastructure

**Priority**: High
**Dependencies**: None
**Estimated Effort**: Medium

**Description**: E2E tests are failing in CI due to infrastructure issues. Tests timeout waiting for `[data-testid='product-card']` to be visible, indicating database seeding or environment configuration problems.

**Evidence**: All recent CI runs on main branch show E2E failures (f8997dd, 571f27c, a990b52).

**Sub-tasks**:

- [ ] Investigate CI E2E test environment setup
- [ ] Verify database seeding runs correctly in CI
- [ ] Check if test database has required product data
- [ ] Review Playwright configuration for CI timeouts
- [ ] Fix root cause of missing product cards in test environment
- [ ] Verify E2E tests pass locally and in CI

---

## Medium Priority

<!-- No medium priority tasks -->

---

## Low Priority

### [TASK-023] - Customer Feedback & Review System

**Priority**: Low
**Dependencies**: None
**Estimated Effort**: Medium

**Description**: Allow customers to leave reviews and ratings on products they've purchased.

**Sub-tasks**:

- [ ] Add Review model to Prisma schema (rating, comment, userId, productId, verified)
- [ ] Create API endpoints for reviews (CRUD operations)
- [ ] Build review submission form component
- [ ] Display reviews on product pages with average rating
- [ ] Add review moderation in admin panel
- [ ] Implement "verified purchase" badge
- [ ] Add review schema markup for SEO (JSON-LD)

---

### [TASK-024] - Email Newsletter Subscription

**Priority**: Low
**Dependencies**: None
**Estimated Effort**: Low

**Description**: Capture email subscribers for marketing campaigns and product updates.

**Sub-tasks**:

- [ ] Add Subscriber model to Prisma schema (email, status, subscribedAt)
- [ ] Create subscription API endpoint with validation
- [ ] Build newsletter signup form component (footer, popup)
- [ ] Implement double opt-in email confirmation
- [ ] Add unsubscribe functionality
- [ ] Create admin view for subscriber management
- [ ] Document integration with email marketing platforms (Mailchimp, etc.)

---

### [TASK-022] - Demo Content Enhancement

**Priority**: Low
**Dependencies**: None
**Estimated Effort**: Low

**Description**: Improve demo site presentation with quality content.

**Sub-tasks**:

- [ ] Upload high-quality images for demo products
- [ ] Add realistic product descriptions
- [ ] Create sample categories with proper hierarchy
- [ ] Add sample customer reviews (demo data)

---

## Blocked

<!-- No blocked tasks -->

---

## Completed

All MVP implementation tasks (TASK-001 through TASK-016), TASK-017 (SEO Technical Setup), TASK-018 (Analytics Integration), TASK-019 (Social Sharing Enhancement), TASK-020 (Google Shopping Feed), and TASK-021 (Performance Optimization) have been completed. See [DONE.md](DONE.md) for details.

---

## Notes

- MVP implementation (Phases 1-5.4) is **COMPLETE**
- Demo site deployed to Vercel with Neon database
- Current focus: SEO, Analytics, and Marketing preparation
- Tasks requiring real business moved to [BACKLOG.md](BACKLOG.md)
- Completed tasks move to [DONE.md](DONE.md)
