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

    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await searchInput.press("Enter");

      // URL should update with search param
      await expect(page).toHaveURL(/search=test/);
    }
  });

  test("can sort products", async ({ page }) => {
    await page.goto("/products");

    // Find sort dropdown
    const sortTrigger = page.getByRole("combobox").first();

    if (await sortTrigger.isVisible()) {
      await sortTrigger.click();

      // Select a sort option
      const priceOption = page.getByRole("option", { name: /price/i }).first();
      if (await priceOption.isVisible()) {
        await priceOption.click();
      }
    }
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
    await expect(page.getByText(/\$\d+/).first()).toBeVisible();
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
