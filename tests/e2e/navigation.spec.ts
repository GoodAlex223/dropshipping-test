import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads successfully", async ({ page, isMobile }) => {
    await page.goto("/");

    // Check page title. Deliberately matches only the brand-name segment
    // ("Mirox"), never BRAND_META_SUFFIX's text: that suffix is now Ukrainian
    // ("Сучасний одяг", src/content/brand.ts) and locale work (TASK-039) may
    // change it again, while siteConfig.name (src/lib/seo.ts) reads
    // NEXT_PUBLIC_STORE_NAME and falls back to BRAND_NAME — CI leaves that
    // var unset, so the title is "Mirox Shop — Сучасний одяг"; a local .env
    // may override the name to something else entirely. /Mirox/ is the one
    // substring stable across both environments and future locale changes —
    // do not "tighten" this to the suffix text.
    // Kept as a literal rather than importing BRAND_NAME: this is the only
    // E2E spec that would import app source, and brand.ts's zero-import rule
    // is a comment, not an enforced invariant — if it ever gained an import
    // this would fail at transform time instead of as a readable diff.
    await expect(page).toHaveTitle(/Mirox/);

    // Check main navigation elements (only on desktop - mobile has hamburger
    // menu). Header.tsx's `navigation` array (Task 6, per this branch's
    // design handoff) is Ukrainian and matches Mirox Home.dc.html:28-34
    // exactly. G12 (user decision 2026-08-18) added a fourth desktop entry
    // alongside it — a plain «Категорії» link to the index, matching the
    // mobile menu's own entry — because the G4 visual gate found the desktop
    // header had no way to reach categories at all. It is a standalone
    // <Link>, not a `navigation` array member (that array also feeds the
    // mobile menu, which already renders its own «Категорії» link).
    // Scoped to the <header> landmark: Footer.tsx has its own "Каталог" /
    // "Новинки" / categories links (to the same hrefs), so an unscoped
    // getByRole match resolves to 2 elements and throws a strict-mode
    // violation.
    if (!isMobile) {
      const header = page.getByRole("banner");
      await expect(header.getByRole("link", { name: "Каталог", exact: true })).toHaveAttribute(
        "href",
        "/products"
      );
      await expect(header.getByRole("link", { name: "Новинки", exact: true })).toHaveAttribute(
        "href",
        "/products?sort=new"
      );
      await expect(header.getByRole("link", { name: "Бестселери", exact: true })).toHaveAttribute(
        "href",
        "/products?sort=popular"
      );
      await expect(header.getByRole("link", { name: "Категорії", exact: true })).toHaveAttribute(
        "href",
        "/categories"
      );
    }

    // Check hero section
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("can navigate to products page", async ({ page, isMobile }) => {
    await page.goto("/");

    // "Каталог" ("Catalog") is the nav item that links to the bare /products
    // route; "Новинки"/"Бестселери" also point at /products but with query
    // params (new-arrivals / featured sort), so this must match the exact
    // label rather than a generic /products/i or /catalog/i regex. On mobile
    // viewports the desktop <nav> is `md:hidden` (genuinely not visible, not
    // just off-screen) — real mobile users reach it via the hamburger menu
    // instead, so open that first rather than clicking an invisible element.
    if (isMobile) {
      await page.getByRole("button", { name: /меню/i }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Каталог", exact: true }).click();
    } else {
      // Scoped to <header>: Footer.tsx has its own "Каталог" link too.
      await page.getByRole("banner").getByRole("link", { name: "Каталог", exact: true }).click();
    }

    // Anchored at the end: distinguishes the bare /products landing from the
    // query-string variants the other two nav items would also satisfy.
    await expect(page).toHaveURL(/\/products$/);
    // TASK-036 renamed the catalog H1 from "Products" to «Каталог». This
    // assertion was stale after the rename but masked locally: against `next
    // dev` the test dies earlier at the URL assertion (pre-existing dev-server
    // race, fails on main too), so only CI's production build ever reached it.
    await expect(page.getByRole("heading", { level: 1, name: "Каталог" })).toBeVisible();
  });

  test("can navigate to categories page via mobile menu", async ({ page }) => {
    // The desktop header has no Categories entry point (see the absence
    // assertion above) — the mobile Sheet menu is the only surviving nav
    // path to /categories (Header.tsx's mobile-only "Категорії" link from
    // site.header.categories). Scoped to the sheet's role="dialog" so this
    // doesn't also match Footer.tsx's own categories links.
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.getByRole("button", { name: /меню/i }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Категорії", exact: true }).click();

    await expect(page).toHaveURL(/\/categories/);
    // Task 11 renamed the /categories H1 to «Категорії» (src/app/(shop)/categories/page.tsx).
    await expect(page.getByRole("heading", { level: 1, name: "Категорії" })).toBeVisible();
  });

  test("cart icon is visible in header", async ({ page }) => {
    await page.goto("/");

    // Cart button/icon should be visible
    const cartButton = page.getByRole("button", { name: /кошик|cart/i }).first();
    await expect(cartButton).toBeVisible();
  });

  test("mobile menu works on small screens", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Look for mobile menu button
    const menuButton = page.getByRole("button", { name: /меню/i });

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Navigation links should become visible: the Ukrainian nav items
      // (Каталог/Новинки/Бестселери) plus the mobile-only Категорії entry.
      // Scoped to the sheet's role="dialog": Footer.tsx (always in the DOM,
      // regardless of scroll position) has its own Каталог/Новинки links.
      const sheet = page.getByRole("dialog");
      await expect(sheet.getByRole("link", { name: "Каталог", exact: true })).toBeVisible();
      await expect(sheet.getByRole("link", { name: "Новинки", exact: true })).toBeVisible();
      await expect(sheet.getByRole("link", { name: "Бестселери", exact: true })).toBeVisible();
      await expect(sheet.getByRole("link", { name: "Категорії", exact: true })).toBeVisible();
    }
  });
});
