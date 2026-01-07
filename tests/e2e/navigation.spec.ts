import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads successfully", async ({ page, isMobile }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/Store/);

    // Check main navigation elements (only on desktop - mobile has hamburger menu)
    if (!isMobile) {
      await expect(page.getByRole("link", { name: "Products", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Categories", exact: true })).toBeVisible();
    }

    // Check hero section
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("can navigate to products page", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: /products/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible();
  });

  test("can navigate to categories page", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: /categories/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/categories/);
    await expect(page.getByRole("heading", { name: /categories/i })).toBeVisible();
  });

  test("cart icon is visible in header", async ({ page }) => {
    await page.goto("/");

    // Cart button/icon should be visible
    const cartButton = page.locator("[aria-label*='cart' i], button:has-text('cart')").first();
    await expect(cartButton).toBeVisible();
  });

  test("mobile menu works on small screens", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Look for mobile menu button
    const menuButton = page.getByRole("button", { name: /menu/i });

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Navigation links should become visible
      await expect(page.getByRole("link", { name: /products/i })).toBeVisible();
    }
  });
});
