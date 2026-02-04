# TODO

Active tasks for Dropshipping Website MVP.

**Last Updated**: 2026-02-04

---

## In Progress

<!-- No tasks in progress -->

---

## High Priority

### [TASK-026] - Fix Vercel Deploy in CI

**Priority**: High
**Dependencies**: None
**Estimated Effort**: Low

**Description**: The "Deploy to Vercel" job in the CI workflow is failing on every push to main. Likely missing `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` in GitHub Actions secrets, or the deploy workflow configuration needs updating.

**Sub-tasks**:

- [ ] Diagnose deploy job failure (check logs for missing secrets/config)
- [ ] Add or update required Vercel secrets in GitHub Actions
- [ ] Verify deploy succeeds on next push to main

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

All MVP implementation tasks (TASK-001 through TASK-016), TASK-017 (SEO Technical Setup), TASK-018 (Analytics Integration), TASK-019 (Social Sharing Enhancement), TASK-020 (Google Shopping Feed), TASK-021 (Performance Optimization), and TASK-025 (Fix E2E Test Infrastructure) have been completed. See [DONE.md](DONE.md) for details.

---

## Notes

- MVP implementation (Phases 1-5.4) is **COMPLETE**
- Demo site deployed to Vercel with Neon database
- Current focus: SEO, Analytics, and Marketing preparation
- Tasks requiring real business moved to [BACKLOG.md](BACKLOG.md)
- Completed tasks move to [DONE.md](DONE.md)
