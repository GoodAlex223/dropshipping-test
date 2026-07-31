import { test, expect } from "@playwright/test";

test.describe("Product Browsing", () => {
  test("products page displays product grid", async ({ page }) => {
    await page.goto("/products");

    // Wait for products to load
    await page.waitForSelector("[data-testid='product-card']");

    // Should have at least one product
    const products = page.locator("[data-testid='product-card']").first();
    await expect(products).toBeVisible();
  });

  test("can filter products by search", async ({ page }) => {
    await page.goto("/products");

    // Wait for the product grid before interacting with the form. Cards are
    // rendered by a client-side effect (fetchProducts) that only runs after
    // React has hydrated, so their presence is a reliable hydration signal —
    // unlike isVisible() below, which only proves the element has painted.
    // On WebKit specifically, filling an input before hydration produces an
    // `input` event that never reaches React (state stays empty), so a
    // pre-hydration fill() silently no-ops. See BACKLOG.md TASK-038a entry.
    await page.waitForSelector("[data-testid='product-card']");

    // Search moved to the Header dialog in TASK-036 (the catalog filter bar
    // has no search input, per the Mirox mock).
    await page.getByRole("button", { name: "Пошук" }).first().click();
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("test");
    await searchInput.press("Enter");
    await page.waitForURL(/search=test/, { timeout: 15000 });
    await expect(page).toHaveURL(/search=test/);
  });

  test("can sort products", async ({ page }) => {
    await page.goto("/products");
    await page.waitForSelector("[data-testid='product-card']");

    await Promise.all([
      page.waitForURL(/sort=price-asc/, { timeout: 15000 }),
      page.getByRole("button", { name: "Ціна ↑" }).click(),
    ]);

    await page.waitForSelector("[data-testid='product-card']");
    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("size filter chip updates URL and grid", async ({ page }) => {
    await page.goto("/products");
    await page.waitForSelector("[data-testid='product-card']");

    await Promise.all([
      page.waitForURL(/size=M/, { timeout: 15000 }),
      page.getByRole("button", { name: "M", exact: true }).first().click(),
    ]);

    await page.waitForSelector("[data-testid='product-card']");
  });

  test("can view product details", async ({ page }) => {
    await page.goto("/products");

    // Wait for products to load
    await page.waitForSelector("[data-testid='product-card']");

    // Click on first product link
    const productLink = page.locator("[data-testid='product-card'] a").first();
    await productLink.click();

    // Should be on product detail page
    await expect(page).toHaveURL(/\/products\/[^/]+$/);

    // Product details should be visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("product detail shows price", async ({ page }) => {
    await page.goto("/products");

    // Navigate to first product
    await page.locator("[data-testid='product-card'] a").first().click();

    // Wait for product page to load
    await expect(page).toHaveURL(/\/products\/[^/]+$/);

    // Price should be visible (use first match since there may be multiple prices)
    await expect(page.getByText(/\d[\s ]?грн/).first()).toBeVisible();
  });

  test("product detail shows add to cart button", async ({ page }) => {
    await page.goto("/products");

    // Wait for products and navigate to first product
    await page.waitForSelector("[data-testid='product-card']");
    await page.locator("[data-testid='product-card'] a").first().click();

    // Wait for product page to load
    await expect(page).toHaveURL(/\/products\/[^/]+$/);

    // Add to cart button should be visible
    const addToCartButton = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible();
  });
});
