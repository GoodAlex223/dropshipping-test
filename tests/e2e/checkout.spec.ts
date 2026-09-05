import { test, expect } from "@playwright/test";

// Guest COD checkout flow (G2). The checkout page renders a loader until the
// client mounts (mounted gate), so form fields existing at all implies
// hydration — no pre-hydration fill risk (WebKit lesson: never fill() before
// a hydration-only render signal).
test.describe("Checkout (guest COD)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("guest reaches checkout without a login redirect", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/checkout/);
    // Empty cart → Ukrainian empty state (still proves no auth redirect)
    await expect(page.getByText(/кошик порожній/i)).toBeVisible();
  });

  test("guest can place a COD order end-to-end", async ({ page }) => {
    // Add a product to the cart (same pattern as cart.spec.ts: click the
    // card heading, not the card center — quick-view overlay).
    await page.goto("/products");
    await page.waitForSelector("[data-testid='product-card']");
    await Promise.all([
      page.waitForURL(/\/products\/[^/]+$/),
      page.locator("[data-testid='product-card']").first().getByRole("heading").click(),
    ]);
    await page.waitForSelector('[data-hydrated="true"]');
    await page.getByRole("button", { name: /^додати в кошик$/i }).click();
    await expect(page.getByRole("button", { name: /додано в кошик/i })).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/checkout");

    // Step 1 — Контакти (fields only exist post-mount, so fill is safe)
    await page.getByLabel(/^ім'я$/i).fill("Тест Тестовий");
    await page.getByLabel(/^телефон$/i).fill("+380501234567");
    await page.getByLabel(/^email$/i).fill("guest-e2e@example.com");
    await page.getByRole("button", { name: /далі — доставка/i }).click();

    // Step 2 — Доставка (np-office pre-selected; fill city + branch)
    await expect(page.getByText("Нова Пошта — відділення")).toBeVisible();
    await page.getByLabel(/^місто$/i).fill("Київ");
    await page.getByLabel(/відділення \/ адреса/i).fill("Відділення №12");
    await page.getByRole("button", { name: /далі — оплата/i }).click();

    // Step 3 — Оплата (COD, no payment processing)
    await expect(page.getByText(/працюємо без передоплати/i)).toBeVisible();
    await page.getByRole("button", { name: /підтвердити замовлення/i }).click();

    // Confirmation — a real PENDING order was created
    await page.waitForURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });
    await expect(page.getByText(/замовлення прийнято/i)).toBeVisible();
    // Deviation from the task-8 brief's verbatim /оплата при отриманні/i: the
    // site-wide Footer BenefitStrip (src/content/site.ts footerBenefits) also
    // renders the exact title "Оплата при отриманні" on every page, so that
    // regex is a strict-mode violation (2 matches) here — confirmed failing
    // identically on all 5 local browser projects, not a browser flake.
    // Matching the confirmation page's own longer copy («…у відділенні»,
    // checkout.confirmation.paymentCod) is unique and also asserts the
    // specific order.paymentMethod === "cod" branch, not just any COD text
    // on the page.
    await expect(page.getByText(/оплата при отриманні у відділенні/i)).toBeVisible();

    // --- G18: the grant cookie carried the confirmation; a cold visit must not.
    const confirmationUrl = page.url();
    const orderNumber = new URL(confirmationUrl).searchParams.get("order")!;
    expect(orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]{4}$/);

    await page.context().clearCookies();
    await page.goto(confirmationUrl);
    await page.waitForURL(/\/track\?order=ORD-/, { timeout: 15000 });

    // The rejection itself must carry none of the order's values: fetch the
    // bearer URL cold (page.request shares the cleared cookie jar) and check
    // the response body, not the page we were redirected to.
    const cold = await page.request.get(confirmationUrl);
    const coldBody = await cold.text();
    expect(coldBody).not.toContain("Тест Тестовий");
    // Not the branch address ("Відділення №12"): that string is also the
    // shipping-step input's i18n PLACEHOLDER (messages/uk.json), which is
    // baked into every page's hydration payload regardless of this order —
    // asserting against it here is a guaranteed false positive, not a real
    // leak check. The phone number carries no such collision.
    expect(coldBody).not.toContain("+380501234567");

    // Verify the rejection, not just the redirect: no order data reached the page.
    await expect(page.getByText(/адреса доставки/i)).toHaveCount(0);
    await expect(page.getByText("Тест Тестовий")).toHaveCount(0);
    await expect(page.getByText("Відділення №12")).toHaveCount(0);
    await expect(page.getByLabel(/^номер замовлення$/i)).toHaveValue(orderNumber);

    // WebKit hydration race (project lesson): fields render in the SSR HTML,
    // so a fill() before React hydrates silently drops on WebKit — wait for
    // the mount signal before the first fill on this page.
    await page.waitForSelector('form[data-hydrated="true"]');

    // Wrong e-mail → uniform not-found copy, still on the form.
    await page.getByLabel(/^email$/i).fill("someone-else@example.com");
    await page.getByRole("button", { name: /^перевірити$/i }).click();
    await expect(page.getByText(/з таким номером та email не знайдено/i)).toBeVisible();
    await expect(page).toHaveURL(/\/track\?order=/);

    // Right e-mail → the status page, PENDING in Ukrainian, the number on screen.
    await page.getByLabel(/^email$/i).fill("guest-e2e@example.com");
    await page.getByRole("button", { name: /^перевірити$/i }).click();
    await page.waitForURL(new RegExp(`/track/${orderNumber}$`), { timeout: 15000 });
    await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
    await expect(page.getByText("Очікує підтвердження")).toBeVisible();
    await expect(page.getByText(/адреса доставки/i)).toBeVisible();
    await expect(page.getByText("Тест Тестовий")).toBeVisible();
    await expect(page.getByText("Відділення №12")).toBeVisible();
  });

  test("step 1 shows Ukrainian validation errors on empty submit", async ({ page }) => {
    // Need a non-empty cart to see the form at all
    await page.goto("/products");
    await page.waitForSelector("[data-testid='product-card']");
    await Promise.all([
      page.waitForURL(/\/products\/[^/]+$/),
      page.locator("[data-testid='product-card']").first().getByRole("heading").click(),
    ]);
    await page.waitForSelector('[data-hydrated="true"]');
    await page.getByRole("button", { name: /^додати в кошик$/i }).click();
    await expect(page.getByRole("button", { name: /додано в кошик/i })).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/checkout");
    await page.getByRole("button", { name: /далі — доставка/i }).click();
    await expect(page.getByText("Вкажіть ім'я")).toBeVisible();
    await expect(page.getByText("Вкажіть номер телефону")).toBeVisible();
  });
});
