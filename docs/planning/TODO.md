# TODO

Active tasks for Dropshipping Website MVP.

**Last Updated**: 2026-01-05

---

## In Progress

<!-- No tasks currently in progress -->

---

## High Priority

### [TASK-001] - Project Setup & Foundation

**Priority**: High
**Estimated effort**: 2-3 days
**Dependencies**: None
**Plan**: [docs/plans/2026-01-05_dropshipping-mvp-plan.md](../plans/2026-01-05_dropshipping-mvp-plan.md)

**Description**: Initialize Next.js 14 project with TypeScript, configure tooling, set up database.

**Sub-tasks**:

- [ ] Initialize Next.js 14 with TypeScript
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up Prisma with PostgreSQL
- [ ] Configure ESLint, Prettier, Husky
- [ ] Set up project folder structure
- [ ] Create Docker Compose for local dev
- [ ] Create .env.example with all variables

**Acceptance Criteria**:

- [ ] `npm run dev` starts the application
- [ ] Database connection works
- [ ] Pre-commit hooks run on commit
- [ ] Project structure matches plan

---

### [TASK-002] - Database Schema & Auth

**Priority**: High
**Estimated effort**: 2 days
**Dependencies**: TASK-001

**Description**: Create Prisma schema for all entities and implement authentication.

**Sub-tasks**:

- [ ] Create Prisma schema (all models from plan)
- [ ] Run initial migrations
- [ ] Set up NextAuth.js with credentials provider
- [ ] Implement registration endpoint
- [ ] Implement login/logout
- [ ] Add role-based access control middleware
- [ ] Seed database with test data

**Acceptance Criteria**:

- [ ] All database tables created
- [ ] Users can register and login
- [ ] Admin role works correctly
- [ ] Protected routes block unauthorized access

---

### [TASK-003] - Basic UI Shell

**Priority**: High
**Estimated effort**: 1-2 days
**Dependencies**: TASK-001

**Description**: Create the basic layout components and navigation.

**Sub-tasks**:

- [ ] Header component with navigation
- [ ] Footer component
- [ ] Mobile-responsive navigation (hamburger menu)
- [ ] Basic layout wrapper
- [ ] Admin layout (separate from shop)

**Acceptance Criteria**:

- [ ] Header displays on all pages
- [ ] Navigation is responsive
- [ ] Admin layout has sidebar

---

## Medium Priority

### [TASK-004] - Admin Product Management

**Priority**: Medium
**Estimated effort**: 3-4 days
**Dependencies**: TASK-002, TASK-003

**Description**: Build admin interface for product CRUD and CSV import.

**Sub-tasks**:

- [ ] Product list page with pagination
- [ ] Product create form
- [ ] Product edit form
- [ ] Product delete with confirmation
- [ ] Image upload to R2
- [ ] CSV import functionality
- [ ] Category management CRUD

**Acceptance Criteria**:

- [ ] Admin can create products with images
- [ ] Admin can edit/delete products
- [ ] CSV import works for bulk products
- [ ] Categories can be managed

---

### [TASK-005] - Customer Product Catalog

**Priority**: Medium
**Estimated effort**: 3-4 days
**Dependencies**: TASK-004

**Description**: Build customer-facing product browsing experience.

**Sub-tasks**:

- [ ] Homepage with featured products
- [ ] Product listing page with pagination
- [ ] Product detail page
- [ ] Category pages
- [ ] Search functionality
- [ ] Filter by category, price
- [ ] Sort options

**Acceptance Criteria**:

- [ ] Products display correctly
- [ ] Search returns relevant results
- [ ] Filters work correctly
- [ ] Pages are SEO-friendly

---

### [TASK-006] - Shopping Cart

**Priority**: Medium
**Estimated effort**: 2-3 days
**Dependencies**: TASK-005

**Description**: Implement shopping cart functionality.

**Sub-tasks**:

- [ ] Cart Zustand store
- [ ] Add to cart button
- [ ] Cart drawer/sidebar
- [ ] Cart page
- [ ] Quantity update
- [ ] Remove item
- [ ] Stock validation
- [ ] Cart persistence (localStorage + DB)

**Acceptance Criteria**:

- [ ] Items can be added/removed
- [ ] Quantities can be updated
- [ ] Cart persists across sessions
- [ ] Stock limits are enforced

---

### [TASK-007] - Checkout & Payments

**Priority**: Medium
**Estimated effort**: 4-5 days
**Dependencies**: TASK-006

**Description**: Implement checkout flow with Stripe payment.

**Sub-tasks**:

- [ ] Checkout page layout
- [ ] Shipping address form
- [ ] Shipping method selection
- [ ] Stripe integration
- [ ] Create Checkout Session
- [ ] Stripe webhook handler
- [ ] Order creation on success
- [ ] Confirmation page
- [ ] Confirmation email

**Acceptance Criteria**:

- [ ] Full checkout flow works
- [ ] Stripe payment processes
- [ ] Order is created in database
- [ ] Confirmation email is sent

---

### [TASK-008] - Order Management

**Priority**: Medium
**Estimated effort**: 3 days
**Dependencies**: TASK-007

**Description**: Build order management for customers and admin.

**Sub-tasks**:

- [ ] Customer order history page
- [ ] Customer order detail page
- [ ] Admin order list with filters
- [ ] Admin order detail view
- [ ] Order status updates
- [ ] Order export to CSV

**Acceptance Criteria**:

- [ ] Customers can view their orders
- [ ] Admin can manage all orders
- [ ] Status updates work correctly

---

### [TASK-009] - Supplier Integration

**Priority**: Medium
**Estimated effort**: 3-4 days
**Dependencies**: TASK-008

**Description**: Integrate supplier management and order forwarding.

**Sub-tasks**:

- [ ] Supplier CRUD
- [ ] Link products to suppliers
- [ ] Order forwarding queue (BullMQ)
- [ ] Basic supplier API integration
- [ ] Order status sync job

**Acceptance Criteria**:

- [ ] Suppliers can be configured
- [ ] Orders are queued for forwarding
- [ ] Status syncs from supplier

---

## Low Priority / Backlog

### [TASK-010] - SEO & Performance

**Priority**: Low
**Dependencies**: TASK-005

**Description**: Optimize for search engines and performance.

**Sub-tasks**:

- [ ] Meta tags and OpenGraph
- [ ] Sitemap generation
- [ ] JSON-LD structured data
- [ ] Image optimization
- [ ] Performance audit (Lighthouse)

---

### [TASK-011] - Testing

**Priority**: Low
**Dependencies**: All features

**Description**: Write unit and E2E tests.

**Sub-tasks**:

- [ ] Unit tests for services
- [ ] E2E tests for critical flows
- [ ] Test coverage report

---

### [TASK-012] - Deployment Setup

**Priority**: Low
**Dependencies**: TASK-011

**Description**: Set up production deployment.

**Sub-tasks**:

- [ ] Production environment setup
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (Sentry, Uptime)
- [ ] Documentation update

---

## Blocked

<!-- No blocked tasks -->

---

## Notes

- Tasks are organized by implementation phase
- Each task should be completed and tested before moving to dependent tasks
- All significant changes require a plan update
- Completed tasks move to [DONE.md](DONE.md)
