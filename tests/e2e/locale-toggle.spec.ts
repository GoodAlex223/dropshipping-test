import { test, expect } from "@playwright/test";

test.describe("Locale toggle", () => {
  test("switches html lang to ru, persists across reload, and switches back", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");

    if (isMobile) {
      // Toggle lives in the mobile menu sheet
      await page.getByRole("button", { name: "Відкрити меню" }).click();
    }
    await page.getByTestId("locale-switcher-ru").first().click();

    // Authoritative assertion: cookie-driven re-render lands lang=ru
    await expect(page.locator("html")).toHaveAttribute("lang", "ru", { timeout: 15000 });

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    // The switcher itself re-labels in RU (common.localeSwitcher)
    await expect(page.getByTestId("locale-switcher").first()).toHaveAttribute("aria-label", "Язык");

    if (isMobile) {
      await page
        .getByRole("button", { name: "Открыть меню" })
        .or(page.getByRole("button", { name: "Відкрити меню" }))
        .first()
        .click();
    }
    await page.getByTestId("locale-switcher-uk").first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk", { timeout: 15000 });
  });
});
