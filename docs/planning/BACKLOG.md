# Backlog

Ideas and tasks not yet prioritized for active development.

**Last Updated**: 2026-01-22

---

## Overview

This is the holding area for:

- Feature ideas
- Enhancement suggestions
- Technical debt items
- Research topics
- "Someday/maybe" tasks
- **Marketing & advertising tasks** (require real business)

Items here are **not committed** — they're candidates for future TODO.md promotion.

---

## Marketing & Advertising (Requires Real Business)

These tasks from the advertising/promotion plan require a registered business, real products, or advertising budget.

### Google Advertising & Presence

| Task                   | Description                                | Requirements                                  | Value | Effort |
| ---------------------- | ------------------------------------------ | --------------------------------------------- | ----- | ------ |
| Google Ads Campaigns   | Set up PPC campaigns for product promotion | Business verification, ad budget              | High  | High   |
| Google Maps Listing    | Register business on Google Maps           | Real business address, verification           | High  | Low    |
| Google Merchant Center | Activate Google Shopping product listings  | Merchant Center account, product verification | High  | Med    |
| Google My Business     | Complete business profile setup            | Business registration documents               | Med   | Low    |

### Social Media Marketing

| Platform  | Tasks                                       | Requirements               | Value | Effort |
| --------- | ------------------------------------------- | -------------------------- | ----- | ------ |
| Instagram | Create business account, set up ads manager | Business verification      | High  | Med    |
| Facebook  | Create business page, configure ads         | Meta Business verification | High  | Med    |
| TikTok    | Create business account, set up TikTok Ads  | Business verification      | Med   | Med    |
| YouTube   | Create channel, upload product videos       | Content creation resources | Med   | High   |
| Telegram  | Create channel for promotions               | Content strategy           | Low   | Low    |

### Classifieds & Marketplaces

| Platform           | Description                             | Requirements                  | Value | Effort |
| ------------------ | --------------------------------------- | ----------------------------- | ----- | ------ |
| OLX Listings       | Post products on OLX marketplace        | Real products, seller account | Med   | Low    |
| Other Marketplaces | Expand to additional local marketplaces | Varies by platform            | Med   | Med    |

### Content Marketing

| Task                  | Description                              | Requirements                       | Value | Effort |
| --------------------- | ---------------------------------------- | ---------------------------------- | ----- | ------ |
| AI Video Content      | Create promotional videos with AI tools  | Video creation tools, brand assets | Med   | Med    |
| Blog/Content Strategy | SEO-focused content for organic traffic  | Content writer, keyword research   | Med   | High   |
| Email Marketing       | Set up email campaigns (Mailchimp, etc.) | Email list, campaign content       | High  | Med    |

### CRM Integration

| CRM Platform | Description                        | Value | Effort | Notes                                  |
| ------------ | ---------------------------------- | ----- | ------ | -------------------------------------- |
| HubSpot      | Free CRM with marketing automation | High  | Med    | Good for startups, free tier available |
| Pipedrive    | Sales-focused CRM                  | Med   | Med    | Better for sales pipelines             |
| Zoho CRM     | Full-featured affordable CRM       | Med   | Med    | Good value, many integrations          |
| Salesforce   | Enterprise CRM                     | Low   | High   | Overkill for small business            |

**Integration tasks when ready:**

- [ ] Choose CRM platform based on business needs
- [ ] Set up CRM account and configure pipelines
- [ ] Integrate customer data sync (new customers → CRM contacts)
- [ ] Connect order data to CRM deals/opportunities
- [ ] Set up automated workflows (abandoned cart, follow-ups)
- [ ] Configure email integration with CRM

---

## Post-MVP Features (Moved from TODO)

### [TASK-013] - Enhanced Features (Post-MVP)

**Priority**: Low
**Dependencies**: Deployment complete
**Moved from TODO**: 2026-01-22

**Description**: Additional features for future releases.

**Sub-tasks**:

- [x] Customer reviews and ratings → Moved to TODO as TASK-023
- [ ] Wishlist functionality
- [ ] Advanced search (Meilisearch)
- [ ] Product recommendations
- [ ] Discount codes and promotions

---

### [TASK-014] - Additional Integrations (Post-MVP)

**Priority**: Low
**Dependencies**: Deployment complete
**Moved from TODO**: 2026-01-22

**Description**: Additional third-party integrations.

**Sub-tasks**:

- [ ] Additional payment methods
- [ ] Multiple supplier API integrations
- [ ] Automated inventory sync
- [ ] Shipping rate calculators

---

### [TASK-015] - Growth Features (Post-MVP)

**Priority**: Low
**Dependencies**: Enhanced Features
**Moved from TODO**: 2026-01-22

**Description**: Features for scaling the business.

**Sub-tasks**:

- [ ] Multi-currency support
- [ ] Internationalization (i18n)
- [ ] Customer loyalty program
- [x] Email marketing integration → Moved to TODO as TASK-024
- [ ] Analytics dashboard

---

## Deferred Tasks (Moved from TODO)

### Manual Testing Plan

**Moved from TODO**: 2026-01-22
**Reason**: Deprioritized in favor of marketing preparation tasks

- [ ] Develop comprehensive manual testing plan for the website

---

## Feature Ideas

### Authentication & Security

| Idea                   | Description                                                     | Value | Effort | Source                  |
| ---------------------- | --------------------------------------------------------------- | ----- | ------ | ----------------------- |
| Email verification     | Verify user email addresses before allowing full account access | High  | Med    | Phase 5.4 deployment    |
| Password reset         | Allow users to reset forgotten passwords via email              | High  | Med    | Phase 5.4 deployment    |
| OAuth providers        | Add Google, GitHub, etc. social login options                   | Med   | Med    | Phase 5.4 deployment    |
| Rate limiting          | Protect auth endpoints from brute force attacks                 | High  | Med    | Phase 5.4 deployment    |
| Session timeout        | Configure explicit session expiration (24h recommended)         | Med   | Low    | Phase 5.4 deployment    |
| 2FA/MFA support        | Two-factor authentication for enhanced security                 | Med   | High   | Security best practices |
| Login attempt tracking | Track failed logins, implement account lockout                  | Med   | Med    | Security best practices |

### User Experience

| Idea                          | Description                                   | Value | Effort | Source               |
| ----------------------------- | --------------------------------------------- | ----- | ------ | -------------------- |
| Cart operation error handling | Show toast notifications for cart errors      | Med   | Low    | Phase 5.4 deployment |
| Better network error messages | Distinguish network errors from server errors | Low   | Low    | Phase 5.4 deployment |

---

## Enhancements

Improvements to existing functionality.

| Enhancement                           | Area           | Value | Effort | Notes                                    |
| ------------------------------------- | -------------- | ----- | ------ | ---------------------------------------- |
| Standardize toast usage               | UI             | Med   | Low    | Use Sonner consistently across all forms |
| Add loading states to cart operations | Cart           | Med   | Low    | Prevent double-clicks, show feedback     |
| Improve error boundary UI             | Error handling | Low   | Low    | More helpful error pages                 |

### [2026-01-22] From: TASK-017 SEO Technical Setup

**Origin**: docs/archive/plans/2026-01-22_seo-technical-setup.md

- [ ] Replace placeholder SEO assets with branded images — OG image, favicons are simple placeholders
- [ ] Add dynamic OG image generation — Use `opengraph-image.tsx` for product-specific social images
- [ ] Add category metaTitle/metaDesc fields — Similar to Product model, for category SEO
- [ ] Implement proper i18n with hreflang — Current setup is preparation only (`en`)

### [2026-02-01] From: TASK-018 Analytics Integration

**Origin**: docs/archive/plans/2026-02-01_analytics-integration.md

- [ ] Extract hardcoded `"USD"` currency to `NEXT_PUBLIC_CURRENCY` env var for multi-currency support
- [ ] Add additional e-commerce events: `remove_from_cart`, `view_promotion`, `select_promotion`
- [ ] Implement GA4 Measurement Protocol for server-side purchase validation
- [ ] Build admin analytics dashboard showing conversion funnel from GTM data

---

## Technical Debt

Known issues that should be addressed eventually.

| Item                          | Impact                              | Effort | Added      |
| ----------------------------- | ----------------------------------- | ------ | ---------- |
| Unused Account/Session tables | Minor DB overhead with JWT strategy | Low    | 2026-01-13 |
| Console.error logging         | Could leak sensitive info in logs   | Low    | 2026-01-13 |
| Generic 500 error responses   | Users don't know what went wrong    | Med    | 2026-01-13 |
| S3 cleanup failures silent    | Orphaned files in storage           | Low    | 2026-01-13 |
| Email send failures silent    | Users don't know email wasn't sent  | Med    | 2026-01-13 |

---

## Research Topics

Areas requiring investigation before implementation.

| Topic                   | Question                                          | Why Important | Added      |
| ----------------------- | ------------------------------------------------- | ------------- | ---------- |
| Callback URL validation | How to prevent open redirect vulnerabilities?     | Security      | 2026-01-13 |
| Structured logging      | What logging solution for production?             | Debugging     | 2026-01-13 |
| Live Payment Activation | What's needed to activate Stripe live mode?       | Business      | 2026-01-22 |
| Business Registration   | What documents/steps needed for Ukraine business? | Legal         | 2026-01-22 |

---

## Someday / Maybe

Ideas that might be valuable but aren't prioritized.

- [ ] Remove unused Prisma Account/Session tables if staying with JWT-only
- [ ] Add structured logging with error masking (replace console.error)
- [ ] Email templates for verification/reset flows
- [ ] User consent/privacy policy flow
- [ ] Audit logging for auth events
- [ ] Add JSDoc comments to auth functions
- [ ] Extract password validation rules to shared schema

---

## Rejected Ideas

Ideas considered but decided against (with reasoning).

| Idea                             | Reason for Rejection                               | Date       |
| -------------------------------- | -------------------------------------------------- | ---------- |
| Database sessions instead of JWT | JWT is more scalable for serverless, simpler setup | 2026-01-13 |

---

## Promotion Criteria

Move items to [TODO.md](TODO.md) when:

- [ ] Aligns with current [ROADMAP.md](ROADMAP.md) phase
- [ ] Value clearly exceeds effort
- [ ] Dependencies are resolved
- [ ] Capacity exists to complete
- [ ] Stakeholder approval (if needed)
- [ ] **For marketing tasks**: Real business requirements met

---

## Adding to Backlog

When adding new items:

1. Choose appropriate category
2. Provide brief description
3. Estimate Value and Effort (High/Med/Low)
4. Note the source (who suggested it)
5. Add date if relevant

---

_Promoted items go to [TODO.md](TODO.md)._
_Rejected items stay here with reasoning._
_See [ROADMAP.md](ROADMAP.md) for strategic direction._
