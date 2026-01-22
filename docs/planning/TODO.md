# TODO

Active tasks for Dropshipping Website MVP.

**Last Updated**: 2026-01-22

---

## In Progress

<!-- No tasks in progress -->

---

## High Priority

### [TASK-018] - Analytics Integration

**Priority**: High
**Dependencies**: None
**Estimated Effort**: Low

**Description**: Add analytics tracking for visitor insights and behavior analysis.

**Sub-tasks**:

- [ ] Integrate Google Analytics 4
- [ ] Add Google Tag Manager container
- [ ] Configure e-commerce tracking events (view_item, add_to_cart, purchase)
- [ ] Set up conversion tracking
- [ ] Add privacy-compliant cookie consent banner

---

## Medium Priority

### [TASK-019] - Social Sharing & Open Graph

**Priority**: Medium
**Dependencies**: None (TASK-017 complete)
**Estimated Effort**: Low

**Description**: Enable rich previews when sharing links on social media platforms.

**Sub-tasks**:

- [ ] Add Open Graph meta tags (og:title, og:description, og:image)
- [ ] Add Twitter Card meta tags
- [ ] Generate dynamic OG images for products
- [ ] Add social share buttons to product pages
- [ ] Test previews on Facebook, Twitter, LinkedIn debuggers

---

### [TASK-020] - Google Shopping Feed Preparation

**Priority**: Medium
**Dependencies**: None (TASK-017 complete)
**Estimated Effort**: Medium

**Description**: Generate product feed in Google Shopping format (technical preparation for when real products are available).

**Sub-tasks**:

- [ ] Create XML product feed endpoint (`/feed/google-shopping.xml`)
- [ ] Implement required Google Shopping attributes (id, title, description, link, image_link, price, availability)
- [ ] Add product identifiers fields to schema (GTIN, MPN, brand)
- [ ] Create feed validation utility
- [ ] Document Merchant Center setup process

---

### [TASK-021] - Performance Optimization

**Priority**: Medium
**Dependencies**: None
**Estimated Effort**: Medium

**Description**: Optimize Core Web Vitals and overall site performance.

**Sub-tasks**:

- [ ] Implement image lazy loading with blur placeholders
- [ ] Add next/image optimization for all product images
- [ ] Configure static page generation where applicable
- [ ] Implement resource prefetching for critical paths
- [ ] Run Lighthouse audit and fix issues
- [ ] Set up performance monitoring (Web Vitals reporting)

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

All MVP implementation tasks (TASK-001 through TASK-016) and TASK-017 (SEO Technical Setup) have been completed. See [DONE.md](DONE.md) for details.

---

## Notes

- MVP implementation (Phases 1-5.4) is **COMPLETE**
- Demo site deployed to Vercel with Neon database
- Current focus: SEO, Analytics, and Marketing preparation
- Tasks requiring real business moved to [BACKLOG.md](BACKLOG.md)
- Completed tasks move to [DONE.md](DONE.md)
