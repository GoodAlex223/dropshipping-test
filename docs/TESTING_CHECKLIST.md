# Manual Testing Checklist

This checklist covers critical user flows that should be tested before each release.

---

## Customer-Facing Tests

### Homepage

- [ ] Homepage loads without errors
- [ ] Hero section displays correctly
- [ ] Featured products section shows products
- [ ] Category section shows categories with images
- [ ] All navigation links work
- [ ] Footer links work
- [ ] Mobile responsive layout works

### Navigation

- [ ] Header displays correctly
- [ ] Logo links to homepage
- [ ] Products link navigates to /products
- [ ] Categories dropdown shows categories
- [ ] Search opens search dialog (Ctrl+K shortcut)
- [ ] Cart icon shows item count
- [ ] User menu displays login/register for guests
- [ ] User menu shows account links for logged-in users
- [ ] Mobile menu opens and closes correctly

### Product Catalog

- [ ] Products page loads with products
- [ ] Product cards display image, name, price
- [ ] Discount badges show for sale items
- [ ] Out of stock badge shows correctly
- [ ] Pagination works
- [ ] Sort dropdown changes product order
- [ ] Search filters products correctly
- [ ] Category filter works
- [ ] Price range filter works (mobile)

### Product Detail

- [ ] Product page loads with all details
- [ ] Image gallery with thumbnails works
- [ ] Image navigation arrows work
- [ ] Variant selection changes price/stock
- [ ] Quantity selector respects stock limits
- [ ] Add to Cart button adds item
- [ ] "Added to Cart" feedback shows
- [ ] Buy Now opens cart drawer
- [ ] Related products section displays
- [ ] Breadcrumb navigation works
- [ ] Out of stock shows warning

### Categories

- [ ] Categories page lists all categories
- [ ] Category images display
- [ ] Product counts show
- [ ] Category page shows products
- [ ] Subcategory buttons filter products
- [ ] Category banner image displays

### Shopping Cart

- [ ] Cart drawer opens from header
- [ ] Cart page loads correctly
- [ ] Items display with correct info
- [ ] Quantity controls work
- [ ] Remove item button works
- [ ] Clear cart button works
- [ ] Subtotal calculates correctly
- [ ] Continue shopping link works
- [ ] Checkout button navigates to checkout
- [ ] Empty cart shows appropriate message
- [ ] Cart persists after page reload

### Checkout

- [ ] Checkout page loads for guests
- [ ] Contact information form validates
- [ ] Shipping address form validates
- [ ] Shipping method selection works
- [ ] Order summary shows correct items
- [ ] Stripe payment form loads
- [ ] Payment processing works
- [ ] Order confirmation page shows details
- [ ] Confirmation email is sent (if configured)

### User Account

- [ ] Registration works with valid data
- [ ] Registration validates required fields
- [ ] Login works with correct credentials
- [ ] Login shows error for invalid credentials
- [ ] Logout works
- [ ] Account overview displays user info
- [ ] Order history shows past orders
- [ ] Order detail page shows full info
- [ ] Order status timeline displays correctly

### Search

- [ ] Search dialog opens with Ctrl+K
- [ ] Search input debounces correctly
- [ ] Results show as user types
- [ ] Clicking result navigates to product
- [ ] "View all results" link works
- [ ] No results message shows appropriately

---

## Admin Panel Tests

### Admin Authentication

- [ ] Admin login redirects non-admin users
- [ ] Admin dashboard loads for admin users
- [ ] Admin sidebar navigation works

### Admin Dashboard

- [ ] Stats cards show correct data
- [ ] Recent orders list displays
- [ ] Low stock alerts show (if applicable)

### Product Management

- [ ] Product list loads with pagination
- [ ] Search filters products
- [ ] Status filter works
- [ ] Category filter works
- [ ] Create product form validates
- [ ] Image upload works
- [ ] Product saves successfully
- [ ] Edit product loads existing data
- [ ] Delete product with confirmation
- [ ] CSV import uploads and processes
- [ ] CSV template downloads

### Category Management

- [ ] Category list displays
- [ ] Create category works
- [ ] Edit category works
- [ ] Delete category blocked if has products
- [ ] Parent category selection works

### Order Management

- [ ] Order list displays with filters
- [ ] Search by order number works
- [ ] Status filter works
- [ ] Date range filter works
- [ ] Order detail shows all info
- [ ] Status update works
- [ ] Tracking info can be added
- [ ] CSV export downloads

### Supplier Management

- [ ] Supplier list displays
- [ ] Create supplier works
- [ ] API connection test works
- [ ] Edit supplier works
- [ ] Supplier detail shows products/orders
- [ ] Delete supplier blocked if has products

---

## Technical Tests

### Performance

- [ ] Homepage LCP < 2.5s
- [ ] Product pages load in < 3s
- [ ] Images lazy load correctly
- [ ] No console errors in browser

### SEO

- [ ] Meta titles are set correctly
- [ ] Meta descriptions are present
- [ ] OpenGraph tags are set
- [ ] sitemap.xml is accessible
- [ ] robots.txt is correct
- [ ] Structured data validates (Google Rich Results Test)

### Responsive Design

- [ ] Desktop layout (1920px+)
- [ ] Laptop layout (1024px-1919px)
- [ ] Tablet layout (768px-1023px)
- [ ] Mobile layout (320px-767px)

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Form labels present
- [ ] Color contrast sufficient
- [ ] Screen reader compatible (basic)

---

## Pre-Release Checklist

- [ ] All unit tests pass (`npm run test:run`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Environment variables documented
- [ ] Database migrations up to date
- [ ] No sensitive data in codebase

---

## Notes

- Test with fresh browser/incognito mode
- Test with and without user logged in
- Test with empty database state
- Test with sample data
- Document any issues found with steps to reproduce
