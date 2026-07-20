import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the Mirox hero slogan", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("STYLE.");
    await expect(heading).toContainText("QUALITY.");
    await expect(heading).toContainText("CONFIDENCE.");
  });

  test("primary CTA navigates to the catalog", async ({ page }) => {
    await page.getByRole("link", { name: "Shop the Catalog" }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("secondary CTA navigates to new arrivals", async ({ page }) => {
    await page.getByRole("link", { name: "New Arrivals" }).first().click();
    await expect(page).toHaveURL(/sort=newest/);
  });

  test("shows the why-choose-us block", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /why choose us/i })).toBeVisible();
  });

  test("shows social links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Instagram/ }).first()).toBeVisible();
  });

  test("announcement bar dismisses and stays dismissed", async ({ page }) => {
    const dismiss = page.getByRole("button", { name: /dismiss announcement/i });

    // The bar reveals after mount (localStorage read in an effect), so wait for
    // it rather than asserting immediately — the same pre-hydration race that
    // caused the WebKit failure diagnosed in TASK-038a.
    await expect(dismiss).toBeVisible();
    await dismiss.click();
    await expect(dismiss).toBeHidden();

    await page.reload();
    await expect(dismiss).toBeHidden();
  });
});
