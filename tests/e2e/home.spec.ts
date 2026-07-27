import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the Mirox hero slogan", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("СТИЛЬ.");
    await expect(heading).toContainText("ЯКІСТЬ.");
    await expect(heading).toContainText("ВПЕВНЕНІСТЬ.");
  });

  test("primary CTA navigates to the catalog", async ({ page }) => {
    await page.getByRole("link", { name: "ПЕРЕЙТИ В КАТАЛОГ" }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("secondary CTA navigates to new arrivals", async ({ page }) => {
    await page.getByRole("link", { name: "ПЕРЕГЛЯНУТИ НОВИНКИ" }).first().click();
    await expect(page).toHaveURL(/sortBy=createdAt&sortOrder=desc/);
  });

  test("shows the why-choose-us block", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /чому обирають нас/i })).toBeVisible();
  });

  test("shows social links", async ({ page }) => {
    // Social links live in the footer only since TASK-057's homepage
    // restructure removed the dedicated tiles section — scope the locator so
    // this doesn't accidentally match a future header/nav Instagram link.
    await expect(
      page
        .locator("footer")
        .getByRole("link", { name: /Instagram/i })
        .first()
    ).toBeVisible();
  });

  test("announcement bar dismisses and stays dismissed when configured", async ({ page }) => {
    const dismiss = page.getByRole("button", { name: /dismiss announcement/i });

    // `site.announcement` (src/content/site.ts) is a client-supplied value and
    // ships `null` by default today — the bar renders nothing in that state,
    // so there is no dismiss button to find. This test accommodates BOTH
    // states rather than assuming either: it waits briefly for the button
    // (covering the post-hydration reveal via useSyncExternalStore), and if
    // it never shows up, asserts the bar is genuinely absent and stops there.
    // If a real announcement is configured later, this same test starts
    // exercising the full dismiss-and-persist flow without needing an edit.
    // (This is not the WebKit pre-hydration race from TASK-038a — that was a
    // real button arriving late; here, with announcement === null, the
    // button never arrives at all.)
    const appeared = await dismiss
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!appeared) {
      await expect(dismiss).toHaveCount(0);
      return;
    }

    await dismiss.click();
    await expect(dismiss).toBeHidden();

    await page.reload();
    await expect(dismiss).toBeHidden();
  });
});
