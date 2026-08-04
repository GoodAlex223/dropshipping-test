# G1 — Cart & Drawer Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the cart page and CartDrawer to the Mirox design language with Ukrainian copy per `Mirox Cart.dc.html`, opening with the definitive customer-route staleness audit that scopes G2/G4 and feeds TASK-056.

**Architecture:** Parallel restyles of the two cart surfaces reading one new content module (`src/content/cart.ts`); `CartItem` gains optional `color`/`size` so both surfaces render the handoff's «Колір: X · Розмір: Y» line; all three `addItem` callers pass the new fields and revert `name` to the plain product name. Logic (stock validation, GA4, store semantics) is untouched.

**Tech Stack:** Next.js 14 App Router, Zustand (persisted cart store), Tailwind + shadcn/ui, Vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-04-cart-drawer-restyle-design.md` (approved 2026-08-04). Read it before starting.

## Global Constraints

- Branch: `feat/g1-cart-drawer-restyle` (already checked out). Conventional commits (`feat(cart):`, `docs(audit):`, `test(e2e):`).
- Every customer-facing price render uses `formatPrice()` from `src/lib/format.ts` — never hand-roll a price string.
- All new Ukrainian strings live in `src/content/cart.ts` — none inline in components (TASK-039 i18n extraction point).
- Shipping row copy is the neutral «Розраховується при оформленні» — NOT «за тарифами Нової Пошти» (false until G2; explicit user decision).
- Out of scope: promo-code field, one-click buy, upsell modal (TASK-043); checkout files; Header beyond the cart trigger's sr-only label.
- Monochrome palette only — `tests/unit/no-bright-colors.test.ts` guards this; use existing tokens (`bg-card`, `border-border`, `border-border-strong`, `text-muted-foreground`, `text-foreground`, `destructive`).
- Never add a `NODE_ENV` line to `.env*` or devcontainer files.
- Playwright E2E: run foreground, one project per command (`npx playwright test <file> --project=chromium`). Local dev server is port 3001.
- Do not modify `src/components/ui/*` (shadcn-managed).

---

### Task 1: Route-by-route staleness audit

**Files:**

- Create: `docs/planning/audits/2026-08-04-storefront-staleness-audit.md`
- Modify: `docs/README.md` (index the new doc)
- Read-only inputs: `prisma/seed-data/users.ts` (customer creds), all files under `src/app/(shop)/`, `src/app/(auth)/`, `src/app/newsletter/`, `src/app/error.tsx`, `src/app/not-found.tsx`, `src/components/`

**Interfaces:**

- Consumes: running dev server on port 3001, seeded local DB (`npm run db:seed` if products missing).
- Produces: the audit doc — its G2/G4 rows are those groups' definitive scope lists; its content-gap rows feed G7/TASK-056. No code changes.

- [ ] **Step 1: Ensure infrastructure**

```bash
docker-compose up -d           # postgres + redis if not running
curl -s http://localhost:3001/api/health || (echo "start dev server")
```

If the server is not running, start it in a background Bash shell: `npm run dev` (it binds 3001 locally). Verify `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` returns 200. If `/api/products?limit=1` returns an empty list, run `npm run db:seed`.

- [ ] **Step 2: Read the seeded customer credentials**

Read `prisma/seed-data/users.ts` and note a CUSTOMER-role email + password (plaintext passwords are in that file's comments/fields; admin is `admin@store.com`/`admin123` — use a customer, not the admin).

- [ ] **Step 3: Write the screenshot script**

Create `<scratchpad>/audit/shoot.js` (scratchpad path from the session env — never `/tmp`):

```js
const { chromium } = require("@playwright/test");

const BASE = "http://localhost:3001";
const OUT = __dirname;
const CUSTOMER = { email: "<from Step 2>", password: "<from Step 2>" };

const PUBLIC_ROUTES = [
  ["home", "/"],
  ["products", "/products"],
  ["pdp", "/products/hudi-mirox-basic"],
  ["categories", "/categories"],
  ["category", "/categories/hudi"], // use a real slug from /api/categories
  ["cart-empty", "/cart"],
  ["login", "/login"],
  ["register", "/register"],
  ["newsletter-confirm", "/newsletter/confirm"],
  ["newsletter-unsubscribe", "/newsletter/unsubscribe"],
  ["not-found", "/definitely-missing-404"],
];
const AUTH_ROUTES = [
  ["account", "/account"],
  ["account-orders", "/account/orders"],
  ["checkout", "/checkout"],
];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

(async () => {
  const products = await (await fetch(`${BASE}/api/products?limit=1`)).json();
  const p = products.data?.products?.[0] ?? products.data?.[0]; // adapt to actual shape
  const cartItem = p && {
    productId: p.id,
    name: p.name,
    price: parseFloat(p.price),
    quantity: 1,
    image: p.images?.[0]?.url,
    maxStock: 5,
  };

  const browser = await chromium.launch();
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    for (const [name, path] of PUBLIC_ROUTES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.screenshot({ path: `${OUT}/${vpName}--${name}.png`, fullPage: true });
    }
    // filled cart via persisted-store injection
    if (cartItem) {
      await page.goto(BASE + "/cart");
      await page.evaluate((item) => {
        localStorage.setItem(
          "cart-storage",
          JSON.stringify({ state: { items: [item] }, version: 0 })
        );
      }, cartItem);
      await page.reload({ waitUntil: "networkidle" });
      await page.screenshot({ path: `${OUT}/${vpName}--cart-filled.png`, fullPage: true });
    }
    // login, then auth routes (checkout needs the cart item injected above)
    await page.goto(BASE + "/login");
    await page.fill('input[name="email"], input[type="email"]', CUSTOMER.email);
    await page.fill('input[name="password"], input[type="password"]', CUSTOMER.password);
    await Promise.all([page.waitForURL(/localhost/), page.click('button[type="submit"]')]);
    for (const [name, path] of AUTH_ROUTES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.screenshot({ path: `${OUT}/${vpName}--${name}.png`, fullPage: true });
    }
    await ctx.close();
  }
  await browser.close();
})();
```

Before running: check the actual `/api/products` response shape and the login form field names; adjust the two marked lines. Run with `node <scratchpad>/audit/shoot.js`.

- [ ] **Step 4: Verify screenshots**

`ls <scratchpad>/audit/*.png` — expect ~30 files (2 viewports × ~15 states). Open a few with the Read tool to confirm they rendered (not blank/error pages). `/checkout/confirmation` and the root error boundary cannot be visited directly — mark them grep-only in the doc.

- [ ] **Step 5: EN-string sweep**

For each route, grep its page + component tree for English UI strings (user-visible JSX text and aria-labels, not code identifiers):

```bash
grep -rnE '"[A-Z][a-z]+ [a-z]+|>[A-Z][a-z]+ [a-z]+' \
  "src/app/(shop)/cart" "src/app/(shop)/checkout" "src/app/(shop)/account" \
  "src/app/(auth)" src/app/newsletter src/app/error.tsx src/app/not-found.tsx \
  src/components/checkout src/components/shop src/components/common src/components/reviews \
  --include='*.tsx' | grep -viE 'className|import|aria-hidden|http|data-|//'
```

Review hits manually — record actual user-visible strings per route (e.g. cart's "Shopping Cart", checkout's "Shipping Information", account's "Order History", auth form labels, newsletter pages, error/404 copy, PaymentForm labels, review components if surfaced on PDP).

- [ ] **Step 6: Write the audit doc**

Create `docs/planning/audits/2026-08-04-storefront-staleness-audit.md`:

```markdown
# Storefront Staleness Audit — 2026-08-04

**Task**: G1 opening item (WEEKLY 2026-08-03). Screenshots (session scratchpad, not committed)
reviewed at desktop 1440 and mobile 390. Verdicts: ✅ Mirox / 🟠 partially stale / 🔴 stale.

| Route                          | Verdict | EN strings found                        | Owner           | Content gaps → TASK-056 |
| ------------------------------ | ------- | --------------------------------------- | --------------- | ----------------------- |
| `/`                            | ✅      | —                                       | done (TASK-057) | …                       |
| `/cart`                        | 🔴      | "Shopping Cart", "Continue Shopping", … | **G1**          | …                       |
| `/checkout`                    | 🔴      | (list actual findings)                  | G2              | …                       |
| … every route from Steps 3–5 … |         |                                         |                 |                         |

## G2 definitive scope

(checkout routes/components + exact EN strings)

## G4 definitive scope

(auth/account/newsletter/error routes + exact EN strings)

## Content gaps → G7 / TASK-056

(missing photography, legal copy, contact details, etc. observed during the sweep)
```

Fill every row from the actual screenshots + grep results — no placeholder rows. Add an entry under the appropriate section of `docs/README.md`'s index table (follow its existing row format).

- [ ] **Step 7: Commit**

```bash
git add docs/planning/audits/2026-08-04-storefront-staleness-audit.md docs/README.md
git commit -m "docs(audit): storefront staleness audit — G2/G4 scope + TASK-056 gaps"
```

---

### Task 2: Cart content module

**Files:**

- Create: `src/content/cart.ts`
- Test: `tests/unit/content.test.ts` (extend existing file)

**Interfaces:**

- Consumes: `pluralizeUk(n, one, few, many)` from `@/lib/format` (exists, tested).
- Produces: `export const cart` — shape below, consumed verbatim by Tasks 5–6. Key names are load-bearing.

- [ ] **Step 1: Write failing tests**

Append to `tests/unit/content.test.ts`:

```ts
import { cart } from "@/content/cart";

describe("cart content", () => {
  it("titles both surfaces «Кошик»", () => {
    expect(cart.title).toBe("Кошик");
    expect(cart.drawer.title).toBe("Кошик");
  });

  it("pluralizes the items count (1/2/5/11 товар/товари/товарів)", () => {
    expect(cart.itemsCount(1)).toBe("1 товар");
    expect(cart.itemsCount(2)).toBe("2 товари");
    expect(cart.itemsCount(5)).toBe("5 товарів");
    expect(cart.itemsCount(11)).toBe("11 товарів");
  });

  it("keeps the shipping row neutral until G2 ships NP-style methods", () => {
    expect(cart.summary.shippingValue).toBe("Розраховується при оформленні");
    expect(cart.summary.shippingValue).not.toMatch(/Нової Пошти/i);
  });

  it("shares the uppercase checkout CTA across page and drawer", () => {
    expect(cart.summary.checkoutCta).toBe("ОФОРМИТИ ЗАМОВЛЕННЯ");
  });

  it("provides empty-state, clear-dialog, stock and variant-label copy", () => {
    expect(cart.empty.title).toBe("Кошик порожній");
    expect(cart.empty.cta).toBe("Перейти в каталог");
    expect(cart.clear.action).toBe("Очистити кошик");
    expect(cart.clear.confirm).toBeTruthy();
    expect(cart.clear.cancel).toBeTruthy();
    expect(cart.stock.outOfStock).toBe("Немає в наявності");
    expect(cart.stock.onlyN(3)).toBe("Доступно лише 3");
    expect(cart.variant.color).toBe("Колір:");
    expect(cart.variant.size).toBe("Розмір:");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: FAIL — cannot resolve `@/content/cart`.

- [ ] **Step 3: Implement the module**

Create `src/content/cart.ts`:

```ts
import { pluralizeUk } from "@/lib/format";

/**
 * Cart surfaces copy (cart page + CartDrawer). Single extraction point for
 * TASK-039 i18n — plain typed strings; the only logic is the count formatter.
 */
export const cart = {
  title: "Кошик",
  /** «1 товар» / «2 товари» / «5 товарів» */
  itemsCount: (n: number) => `${n} ${pluralizeUk(n, "товар", "товари", "товарів")}`,
  continueShopping: "Продовжити покупки",
  remove: "Видалити",
  variant: { color: "Колір:", size: "Розмір:" },
  quantity: { increase: "Збільшити кількість", decrease: "Зменшити кількість" },
  empty: {
    title: "Кошик порожній",
    cta: "Перейти в каталог",
  },
  summary: {
    title: "Разом",
    itemsLabel: "Товари",
    shippingLabel: "Доставка",
    // Neutral by explicit decision (spec §2): the handoff's «за тарифами
    // Нової Пошти» is false until G2 converts the ship methods; G2 flips
    // this string when that lands.
    shippingValue: "Розраховується при оформленні",
    totalLabel: "До сплати",
    checkoutCta: "ОФОРМИТИ ЗАМОВЛЕННЯ",
    validating: "Перевірка…",
    securePayment: "Безпечна оплата",
    stockIssues: {
      title: "Деякі товари недоступні в потрібній кількості",
      description: "Оновіть кількість або видаліть недоступні товари перед оформленням.",
    },
  },
  stock: {
    outOfStock: "Немає в наявності",
    onlyN: (n: number) => `Доступно лише ${n}`,
  },
  clear: {
    action: "Очистити кошик",
    dialogTitle: "Очистити кошик?",
    dialogDescription: "Усі товари буде видалено з кошика. Цю дію не можна скасувати.",
    confirm: "Очистити",
    cancel: "Скасувати",
  },
  drawer: {
    title: "Кошик",
    viewCart: "Переглянути кошик",
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: PASS (all existing site/home tests still green).

- [ ] **Step 5: Commit**

```bash
git add src/content/cart.ts tests/unit/content.test.ts
git commit -m "feat(cart): Ukrainian cart content module"
```

---

### Task 3: CartItem color/size fields

**Files:**

- Modify: `src/stores/cart.store.ts` (the `CartItem` interface only)
- Test: `tests/unit/cart.store.test.ts` (extend)

**Interfaces:**

- Produces: `CartItem` gains `color?: string; size?: string`. `addItem` signature unchanged (`Omit<CartItem, "quantity"> & { quantity?: number }` picks the new fields up automatically). Tasks 4–6 rely on these exact field names.

- [ ] **Step 1: Write failing test**

Add to the `addItem` describe block in `tests/unit/cart.store.test.ts` (follow the file's existing fixture style):

```ts
it("carries optional color and size through addItem", () => {
  useCartStore.getState().addItem({
    productId: "p1",
    variantId: "v1",
    name: "Худі Mirox Basic",
    price: 1290,
    maxStock: 5,
    color: "Чорний",
    size: "L",
  });
  const item = useCartStore.getState().items[0];
  expect(item.color).toBe("Чорний");
  expect(item.size).toBe("L");
});

it("accepts legacy items without color/size (old persisted carts)", () => {
  useCartStore.getState().addItem({
    productId: "p2",
    name: "Худі Mirox Basic — L",
    price: 1290,
    maxStock: 5,
  });
  const item = useCartStore.getState().items[0];
  expect(item.color).toBeUndefined();
  expect(item.size).toBeUndefined();
});
```

- [ ] **Step 2: Run to verify the first test fails**

Run: `npx vitest run tests/unit/cart.store.test.ts`
Expected: FAIL — TypeScript rejects unknown `color`/`size` properties.

- [ ] **Step 3: Implement**

In `src/stores/cart.store.ts`, extend the interface:

```ts
export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxStock: number;
  /** Display-only variant parts (spec §2) — absent on legacy persisted items. */
  color?: string;
  size?: string;
}
```

No other store changes (merge key, persist config untouched).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/cart.store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/cart.store.ts tests/unit/cart.store.test.ts
git commit -m "feat(cart): CartItem optional color/size display fields"
```

---

### Task 4: addItem callers pass color/size; name reverts to plain

**Files:**

- Modify: `src/app/(shop)/products/[slug]/product-detail-client.tsx` (`addLine`, ~line 132; `currentAsCompanion`, ~line 185)
- Modify: `src/app/(shop)/products/[slug]/page.tsx` (`companionSelect`, ~line 96; companion mapping, ~line 151)
- Modify: `src/types/index.ts` (`BundleCompanion`, ~line 163)
- Modify: `src/components/products/QuickViewDialog.tsx` (`handleAddToCart`, ~line 126)
- Modify: `src/components/products/BoughtTogether.tsx` (`handleAddBundle`, ~line 98)
- Test: `tests/unit/product-detail-client.test.tsx`, `tests/unit/quick-view-dialog.test.tsx`, `tests/unit/bought-together.test.tsx` (update assertions)

**Interfaces:**

- Consumes: `CartItem.color`/`CartItem.size` from Task 3.
- Produces: every `addItem` call passes `name: product.name` (plain), `size: <selected variant value | undefined>`, `color: <product colorValue | undefined>`. `BundleCompanion` gains `colorValue: string | null`. GA4 `item_name` becomes the plain product name — `item_variant` (already sent) carries the size; this is the standard GA4 item model and an accepted consequence of the naming change.
- NOTE: E2E `products.spec.ts` drawer-line assertions (`Худі Mirox Basic — S`) go RED after this task and are updated in Task 6 when the drawer renders the variant line. Do not run products.spec between Tasks 4 and 6 and expect green.

- [ ] **Step 1: Update unit-test expectations (failing first)**

In each of the three test files, find assertions expecting the combined `"<name> — <size>"` in `addItem` / `trackAddToCart` calls (e.g. `quick-view-dialog.test.tsx:49` `name: "Худі Mirox Basic — M"`). Update them to expect:

```ts
expect.objectContaining({
  name: "Худі Mirox Basic", // plain
  size: "M", // from the selected variant
  color: "Чорний", // from the fixture's Color variant / colorValue — omit the
}); // assertion where the fixture has no color
```

and for `trackAddToCart`: `item_name` → the plain fixture name (e.g. `"Худі Mirox Basic"`), `item_variant` unchanged. In `bought-together.test.tsx`, the fixtures are `BundleCompanion`s — add `colorValue: null` (or a real value where the test wants to assert `color`) to each fixture to satisfy the type after Step 3.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/unit/product-detail-client.test.tsx tests/unit/quick-view-dialog.test.tsx tests/unit/bought-together.test.tsx`
Expected: FAIL on the updated assertions (implementation still sends combined names).

- [ ] **Step 3: Implement the caller changes**

`src/types/index.ts` — extend `BundleCompanion`:

```ts
export interface BundleCompanion {
  // …existing fields…
  /** This product's own colorway value (first Color variant), for cart lines. */
  colorValue: string | null;
  sizeVariants: { id: string; value: string; stock: number; price: string | null }[];
}
```

`src/app/(shop)/products/[slug]/page.tsx` — `companionSelect`: broaden the variant fetch and add `name` to the select:

```ts
variants: {
  where: { name: { in: ["Size", "Color"] } },
  select: { id: true, name: true, value: true, stock: true, price: true },
},
```

…and in the companion mapping split the rows:

```ts
sizeVariants: c.variants
  .filter((v) => v.name === "Size")
  .map((v) => ({ id: v.id, value: v.value, stock: v.stock, price: v.price?.toString() ?? null })),
colorValue: c.variants.find((v) => v.name === "Color")?.value ?? null,
```

`product-detail-client.tsx` — `addLine`:

```ts
const addLine = () => {
  addItem({
    productId: product.id,
    variantId: selectedSize?.id,
    name: product.name,
    price: currentPrice,
    image: product.images[0]?.url,
    maxStock: currentStock,
    color: product.colorValue ?? undefined,
    size: selectedSize?.value,
  });
  trackAddToCart({
    item_id: product.id,
    item_name: product.name,
    item_category: product.category.name,
    item_variant: selectedSize?.value,
    price: currentPrice,
    quantity: 1,
  });
};
```

…and `currentAsCompanion` gains `colorValue: product.colorValue ?? null`.

`QuickViewDialog.tsx` — `handleAddToCart` (the API sends ALL variants, so Color rows are present):

```ts
const color = product.variants.find((v) => v.name === "Color")?.value;
addItem({
  productId: product.id,
  variantId: selectedSize?.id,
  name: product.name,
  price,
  image: product.images[0]?.url,
  maxStock: selectedSize ? selectedSize.stock : product.stock,
  color,
  size: selectedSize?.value,
});
trackAddToCart({
  item_id: product.id,
  item_name: product.name,
  item_category: product.category?.name,
  item_variant: selectedSize?.value,
  price,
  quantity: 1,
});
```

`BoughtTogether.tsx` — inside `handleAddBundle`'s loop:

```ts
addItem({
  productId: product.id,
  variantId: variant?.id,
  name: product.name,
  price,
  image: product.image?.url,
  maxStock: variant ? variant.stock : product.stock,
  color: product.colorValue ?? undefined,
  size: variant?.value,
});
trackAddToCart({
  item_id: product.id,
  item_name: product.name,
  item_category: product.category?.name,
  item_variant: variant?.value,
  price,
  quantity: 1,
});
```

Delete the now-unused `const name = …` combined-string lines in all three callers.

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run tests/unit/product-detail-client.test.tsx tests/unit/quick-view-dialog.test.tsx tests/unit/bought-together.test.tsx && npm run typecheck`
Expected: PASS. Typecheck will also surface any other `BundleCompanion` literal missing `colorValue` — fix by adding `colorValue: null` (fixtures) or the real mapping (app code).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts "src/app/(shop)/products/[slug]/page.tsx" \
  "src/app/(shop)/products/[slug]/product-detail-client.tsx" \
  src/components/products/QuickViewDialog.tsx src/components/products/BoughtTogether.tsx \
  tests/unit/product-detail-client.test.tsx tests/unit/quick-view-dialog.test.tsx tests/unit/bought-together.test.tsx
git commit -m "feat(cart): addItem callers pass color/size; cart-line name reverts to plain"
```

---

### Task 5: Cart page restyle

**Files:**

- Modify: `src/app/(shop)/cart/page.tsx` (presentation only — all hooks/logic stay)
- Test: `tests/e2e/cart.spec.ts` (string/locator updates; full run happens in Task 7)

**Interfaces:**

- Consumes: `cart` from `@/content/cart` (Task 2 shape), `CartItem.color/size` (Task 3), `formatPrice`, existing store actions.
- Produces: the restyled page. Accessible names later tasks/tests rely on: remove buttons `aria-label={cart.remove}` («Видалити»), stepper buttons `aria-label={cart.quantity.increase|decrease}`, `<h1>` «Кошик».

- [ ] **Step 1: Update `tests/e2e/cart.spec.ts` expectations first**

- "cart page shows empty state": `page.getByText(/порожній/i)` replaces the `/empty/i`-or-`/no items/i` pair.
- "can update quantity in cart": `page.getByRole("button", { name: /збільшити/i }).first()`.
- "can remove item from cart": `page.getByRole("button", { name: /видалити/i }).first()`, and the post-remove assertion becomes `page.getByText(/порожній/i)`.
- "can add product to cart" and "cart persists" already use Ukrainian PDP strings — leave them.

- [ ] **Step 2: Rewrite the page presentation**

Keep in `cart/page.tsx` unchanged: `"use client"`, `dynamic` export, all state/hooks (`mounted`, `stockInfo`, `isValidating`), `validateStock` effect (drop only its `console.error` — use bare `catch`), `getItemKey`, `getItemStockStatus`, `hasStockIssues`, GA4 effect, router usage. Remove now-unused imports (`Table*`, `Input`, `Separator` if unused, `ArrowLeft/ArrowRight` if replaced by text arrows).

Add imports:

```tsx
import { cart } from "@/content/cart";
```

**Empty state** (replaces the early-return block):

```tsx
if (items.length === 0) {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{cart.title}</h1>
      <div className="border-border mt-8 rounded-2xl border border-dashed p-14 text-center">
        <p className="text-foreground text-base font-bold">{cart.empty.title}</p>
        <Link
          href="/products"
          className="text-foreground mt-2 inline-block text-sm font-bold underline underline-offset-4"
        >
          {cart.empty.cta}
        </Link>
      </div>
    </div>
  );
}
```

**Filled state** — outer structure:

```tsx
return (
  <div className="container py-12">
    <h1 className="text-3xl font-extrabold tracking-tight">{cart.title}</h1>
    <p className="text-muted-foreground mt-2 text-sm font-semibold">
      {cart.itemsCount(items.length)}
    </p>

    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:items-start">
      <div>
        <div className="flex flex-col gap-3.5">{/* item cards */}</div>
        <div className="mt-6 flex items-center justify-between">
          <Link
            href="/products"
            className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors"
          >
            ← {cart.continueShopping}
          </Link>
          {/* AlertDialog: trigger is a quiet text button */}
        </div>
      </div>
      {/* summary column */}
    </div>
  </div>
);
```

**Item card** (one responsive card replaces both the table and the mobile cards; `flex-wrap` folds the stepper/total row under the info on narrow screens):

```tsx
{
  items.map((item) => {
    const stockStatus = getItemStockStatus(item);
    const variantLine = [
      item.color && `${cart.variant.color} ${item.color}`,
      item.size && `${cart.variant.size} ${item.size}`,
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <div
        key={getItemKey(item)}
        className="bg-card border-border flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:gap-5 sm:py-4 sm:pr-6 sm:pl-4"
      >
        <div className="h-[110px] w-24 shrink-0 overflow-hidden rounded-xl">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={96}
              height={110}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <ShoppingBag className="text-muted-foreground h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 basis-40">
          <h3 className="text-[15.5px] font-bold">{item.name}</h3>
          {variantLine && (
            <p className="text-muted-foreground mt-1 text-[12.5px] font-semibold">{variantLine}</p>
          )}
          <p className="mt-1 text-[14.5px] font-extrabold">{formatPrice(item.price)}</p>
          {stockStatus && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-sm",
                stockStatus.type === "error" ? "text-destructive" : "text-muted-foreground"
              )}
            >
              <AlertCircle className="h-3 w-3" />
              {stockStatus.message}
            </p>
          )}
        </div>
        <div className="border-border-strong flex items-center overflow-hidden rounded-[10px] border">
          <button
            type="button"
            aria-label={cart.quantity.decrease}
            className="text-foreground hover:bg-muted h-9 w-9 text-base transition-colors"
            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
          <button
            type="button"
            aria-label={cart.quantity.increase}
            className="text-foreground hover:bg-muted h-9 w-9 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
            disabled={item.quantity >= item.maxStock}
          >
            +
          </button>
        </div>
        <p className="w-[90px] text-right text-[15.5px] font-extrabold">
          {formatPrice(item.price * item.quantity)}
        </p>
        <button
          type="button"
          aria-label={cart.remove}
          className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
          onClick={() => removeItem(item.productId, item.variantId)}
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </div>
    );
  });
}
```

`getItemStockStatus` messages switch to the content module:

```ts
if (info.currentStock === 0) return { type: "error", message: cart.stock.outOfStock };
if (info.currentStock < item.quantity)
  return { type: "warning", message: cart.stock.onlyN(info.currentStock) };
```

**Clear-cart** (same AlertDialog, quiet trigger, UA copy):

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button
      type="button"
      className="text-muted-foreground hover:text-destructive text-sm font-bold transition-colors"
    >
      {cart.clear.action}
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{cart.clear.dialogTitle}</AlertDialogTitle>
      <AlertDialogDescription>{cart.clear.dialogDescription}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{cart.clear.cancel}</AlertDialogCancel>
      <AlertDialogAction
        onClick={clearCart}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {cart.clear.confirm}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Summary column** (sticky; handoff geometry; no promo field):

```tsx
<div className="bg-card border-border rounded-[20px] border p-7 lg:sticky lg:top-24">
  <h2 className="text-xl font-extrabold">{cart.summary.title}</h2>
  <div className="mt-5 flex flex-col gap-3 text-sm">
    <div className="flex justify-between">
      <span className="text-muted-foreground">
        {cart.summary.itemsLabel} ({totalQuantity})
      </span>
      <span className="font-bold">{formatPrice(subtotal)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">{cart.summary.shippingLabel}</span>
      <span className="text-muted-foreground text-[13px]">{cart.summary.shippingValue}</span>
    </div>
  </div>
  <div className="border-border mt-5 flex items-center justify-between border-t pt-4">
    <span className="text-[15px] font-bold">{cart.summary.totalLabel}</span>
    <span className="text-xl font-extrabold">{formatPrice(total)}</span>
  </div>
  {hasStockIssues() && (
    <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-3 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-4 w-4" />
        {cart.summary.stockIssues.title}
      </p>
      <p className="text-muted-foreground mt-1">{cart.summary.stockIssues.description}</p>
    </div>
  )}
  <button
    type="button"
    className="mt-5 w-full rounded-[10px] bg-white p-4 text-[13.5px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
    onClick={() => router.push("/checkout")}
    disabled={hasStockIssues() || isValidating}
  >
    {isValidating ? cart.summary.validating : cart.summary.checkoutCta}
  </button>
  <p className="text-muted-foreground mt-3.5 flex items-center justify-center gap-2 text-xs font-semibold">
    <Lock className="h-3.5 w-3.5" />
    {cart.summary.securePayment}
  </p>
</div>
```

`totalQuantity` is `items.reduce((s, i) => s + i.quantity, 0)` (or the store's `getTotalItems()`). Import `Lock` from lucide-react. The white CTA styling copies the PDP buy button (`product-detail-client.tsx` ~line 326) — the sanctioned precedent for the inverted CTA; the "Taxes calculated at checkout" footnote is dropped (spec §3).

**Skeleton**: reshape `CartPageSkeleton` to the new geometry — heading bar, 3 card-row rectangles (`h-[142px] rounded-2xl`), summary card rectangle (`h-[320px] rounded-[20px]`), same `bg-muted animate-pulse` idiom as today.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: PASS (no unit tests target the cart page; the full suite guards against import fallout — including `no-bright-colors`).

Then start the dev server (`npm run dev`, port 3001), inject a cart item (Task 1's localStorage trick) and eyeball `/cart` at 1440 and 390 for gross breakage (detailed fidelity comes at the Task 7 gate). Verify empty state at `/cart` after `localStorage.clear()`.

- [ ] **Step 4: Run the cart E2E spec (chromium only, foreground)**

Run: `npx playwright test tests/e2e/cart.spec.ts --project=chromium`
Expected: PASS — the page now renders «порожній»/«Видалити»/«Збільшити кількість». (products.spec is still expectedly red until Task 6.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(shop)/cart/page.tsx" tests/e2e/cart.spec.ts
git commit -m "feat(cart): cart page restyle to Mirox Cart.dc.html with Ukrainian copy"
```

---

### Task 6: CartDrawer restyle + header cart label + E2E sweep

**Files:**

- Modify: `src/components/shop/CartDrawer.tsx`
- Modify: `src/components/common/Header.tsx:485` (sr-only `Cart` → «Кошик»)
- Test: `tests/e2e/products.spec.ts` (drawer-line assertions), `tests/e2e/navigation.spec.ts:105` (cart-icon locator)

**Interfaces:**

- Consumes: `cart` content module, `CartItem.color/size`, `formatPrice`.
- Produces: restyled drawer whose line items render name + «Колір: X · Розмір: Y». Header cart trigger's accessible name becomes «Кошик» (existing E2E locators `/кошик|cart/i` in cart/products specs already match it).

- [ ] **Step 1: Update E2E expectations first**

`tests/e2e/products.spec.ts` — the two drawer-line tests:

```ts
// "PDP adds a sized cart line …" — combined-name assertion becomes:
await expect(page.getByText("Худі Mirox Basic", { exact: true }).first()).toBeVisible();
await expect(page.getByText(/Розмір: S/).first()).toBeVisible();
await expect(page.getByText(/— Size/)).toHaveCount(0);

// "PDP colorway swatch navigates …" — final assertion becomes:
await expect(page.getByText("Худі Mirox White", { exact: true }).first()).toBeVisible();
await expect(page.getByText(/Розмір: S/).first()).toBeVisible();
```

`tests/e2e/navigation.spec.ts` "cart icon is visible in header" — the header trigger's accessible name comes from its sr-only span (not an aria-label), so the current `[aria-label*='cart' i]` locator only worked via its `button:has-text('cart')` fallback. Replace with the robust role query:

```ts
const cartButton = page.getByRole("button", { name: /кошик|cart/i }).first();
```

- [ ] **Step 2: Restyle the drawer**

In `CartDrawer.tsx` (mechanics, analytics, handlers unchanged), import `{ cart }` from `@/content/cart` and `{ cn }` if needed:

- Header: `<SheetTitle>` → `{cart.drawer.title} ({totalItems})` with the ShoppingBag icon kept.
- Empty state:

```tsx
<div className="border-border mx-1 my-auto rounded-2xl border border-dashed p-10 text-center">
  <p className="text-foreground text-base font-bold">{cart.empty.title}</p>
  <Link
    href="/products"
    onClick={closeCart}
    className="text-foreground mt-2 inline-block text-sm font-bold underline underline-offset-4"
  >
    {cart.empty.cta}
  </Link>
</div>
```

(wrap in a flex-1 centering container as today; the Button import goes if unused.)

- Line item (inside the existing map): image container `h-20 w-20 overflow-hidden rounded-xl`; after the `<h4>` name add the variant line (same composition as the page):

```tsx
{
  (item.color || item.size) && (
    <p className="text-muted-foreground mt-0.5 text-xs font-semibold">
      {[
        item.color && `${cart.variant.color} ${item.color}`,
        item.size && `${cart.variant.size} ${item.size}`,
      ]
        .filter(Boolean)
        .join(" · ")}
    </p>
  );
}
```

- Remove button: `aria-label={cart.remove}` on the existing X button.
- Stepper: replace the two outline `Button`s + span with the page's joined-group pattern at drawer scale (`h-7 w-7` buttons, `border-border-strong rounded-[10px]` wrapper, aria-labels `cart.quantity.decrease`/`increase`).
- Summary block strings: `cart.summary.itemsLabel ({totalItems})`, `cart.summary.shippingLabel` / `cart.summary.shippingValue`, `cart.summary.totalLabel`; primary button label `cart.summary.checkoutCta` styled like the page CTA (`bg-white text-black font-extrabold tracking-[0.06em] rounded-[10px]`), secondary outline button `cart.drawer.viewCart`.

- [ ] **Step 3: Update the header label**

`Header.tsx:485`: `<span className="sr-only">Cart</span>` → `<span className="sr-only">Кошик</span>`.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run tests/unit/header.test.tsx`
Expected: PASS (header test may assert the sr-only label — if it expects "Cart", update it to «Кошик»).

Run: `npx playwright test tests/e2e/products.spec.ts tests/e2e/navigation.spec.ts --project=chromium`
Expected: PASS — drawer now renders plain name + «Розмір: S».

- [ ] **Step 5: Commit**

```bash
git add src/components/shop/CartDrawer.tsx src/components/common/Header.tsx \
  tests/e2e/products.spec.ts tests/e2e/navigation.spec.ts tests/unit/header.test.tsx
git commit -m "feat(cart): CartDrawer restyle + Ukrainian strings; header cart label"
```

---

### Task 7: Full verification + visual-fidelity gate

**Files:** none (verification only; fix-forward commits as needed)

- [ ] **Step 1: Full local gates**

```bash
npm run lint && npm run typecheck && npm run test:run && npm run build
```

Expected: all green (unit suite ~600 tests). `npm run build` must complete without the stale-cache gotcha — if CSS looks wrong afterward, `rm -rf .next` and rebuild.

- [ ] **Step 2: E2E — foreground, one project per command**

```bash
npx playwright test --project=chromium
npx playwright test --project=webkit
```

Expected: PASS both (the known pre-existing `navigation "can navigate to products page"` failure against local `next dev` is documented on main — check it against the production build or note it as pre-existing, do not chase it here).

- [ ] **Step 3: Visual-fidelity gate (STOP — user sign-off required)**

Screenshot the RENDERED app against `docs/design/design_handoff_mirox/Mirox Cart.dc.html`:

1. Desktop 1440: cart filled, cart empty.
2. Mobile 390: cart filled, cart empty.
3. Drawer open (desktop + mobile) with a multi-variant item (color + size visible).

Present screenshots to the user side-by-side with the handoff and wait for explicit sign-off. Do NOT open a PR before the gate passes (standing rule: green CI never verifies the look). Iterate revision rounds here as needed.

- [ ] **Step 4: After sign-off — request code review**

Use superpowers:requesting-code-review / finishing-a-development-branch per the standing workflow before any PR.

## Self-review notes

- Spec coverage: §1 audit → Task 1; §2 content module + store → Tasks 2–4; §3 page → Task 5; §4 drawer → Task 6; §5 tests/gates → Tasks 5–7. Shipping-copy, promo-exclusion, qty-span decisions encoded in Tasks 2 and 5.
- Deviation from spec §2 (documented): the plural helper is the existing `pluralizeUk` in `format.ts` (already tested) rather than a new `Intl.PluralRules` helper — DRY wins; spec's intent ("a Ukrainian plural helper") is satisfied.
- Type consistency: `cart.*` keys used in Tasks 5–6 match Task 2's module; `color`/`size` names match Task 3; `colorValue` on `BundleCompanion` matches Task 4's mapping and `product-detail-client`'s existing `Product.colorValue`.
