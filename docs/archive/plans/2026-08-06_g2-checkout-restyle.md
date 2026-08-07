# G2 — Checkout Restyle + No-Prepayment COD Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/checkout` to the Mirox handoff as a 3-step no-prepayment COD flow (guest-capable, Nova Poshta shipping methods, new `create-order` API) and restyle `/checkout/confirmation` in Ukrainian.

**Architecture:** The 3-step client state machine in `checkout/page.tsx` is kept but regrouped (contacts → delivery+address → COD confirmation); Stripe is dropped from the live path (its routes/files stay dormant and untouched); a new guest-capable `POST /api/checkout/create-order` creates PENDING/`cod` orders server-side. All copy flows through a new `src/content/checkout.ts` (TASK-039 extraction point) and delivery options through a new `src/lib/shipping.ts`.

**Tech Stack:** Next.js 14 App Router, react-hook-form + zod, Prisma, Tailwind (Mirox dark tokens), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-06-g2-checkout-restyle-cod-design.md` (approved 2026-08-06)

## Global Constraints

- TypeScript strict; Prettier double quotes / 100 chars / 2-space; `npm run typecheck` + `npm run lint` must pass at every commit (husky runs lint-staged).
- `formatPrice()` from `src/lib/format.ts` is the ONLY money formatter — never hand-roll price strings.
- All new user-facing copy is Ukrainian and lives in `src/content/checkout.ts` (pattern: `src/content/cart.ts`) — no literals in JSX beyond what the content module exports.
- Styling idioms from the G1 cart restyle: cards `bg-card border-border rounded-[20px] border p-7` (handoff `#0d0d0d`/`#1a1a1a` map to the `card`/`border` tokens); inputs `border-border-strong`; white CTA `rounded-[10px] bg-white p-4 text-[13.5px] font-extrabold tracking-[0.06em] text-black hover:bg-[#e5e5e5]`; NO raw hex where a token class exists.
- **Dormant-Stripe invariant**: `src/lib/stripe.ts`, `src/lib/stripe-client.ts`, `src/components/checkout/PaymentForm.tsx`, `src/app/api/checkout/create-payment-intent/`, `src/app/api/checkout/confirm-order/` must show **zero diff** in the final PR (exception: none — the email/schema changes live in other files).
- API routes: `try/catch`, no `console.error`, bare `catch` when the error variable is unused, `NextResponse.json` responses.
- Unit tests: `vi.mock()` for `@/lib/auth` / `@/lib/db` / `@/lib/email` declared before imports; `beforeEach(() => vi.clearAllMocks())`.
- Conventional commits on branch `feat/g2-checkout-restyle`.
- Reference for visuals: `docs/design/design_handoff_mirox/Mirox Checkout.dc.html`.

---

### Task 1: Delivery methods module `src/lib/shipping.ts`

**Files:**

- Create: `src/lib/shipping.ts`
- Test: `tests/unit/shipping.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces (later tasks import these exact names):
  - `DELIVERY_METHODS: readonly { id, name, description, price }[]` — ids `"np-office" | "np-courier" | "np-postomat"`, prices `80 | 120 | 70` (UAH numerics).
  - `DEFAULT_DELIVERY_METHOD_ID = "np-office"`
  - `getDeliveryMethod(id: string)` → method or `undefined`
  - `getShippingMethodLabel(id: string): string` — NP ids + legacy ids (`standard`/`express`/`overnight`) → label; unknown id returned verbatim.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/shipping.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  DELIVERY_METHODS,
  DEFAULT_DELIVERY_METHOD_ID,
  getDeliveryMethod,
  getShippingMethodLabel,
} from "@/lib/shipping";

describe("shipping", () => {
  it("exposes the three Nova Poshta methods with UAH prices", () => {
    expect(DELIVERY_METHODS.map((m) => m.id)).toEqual(["np-office", "np-courier", "np-postomat"]);
    expect(DELIVERY_METHODS.map((m) => m.price)).toEqual([80, 120, 70]);
  });

  it("defaults to np-office", () => {
    expect(DEFAULT_DELIVERY_METHOD_ID).toBe("np-office");
  });

  it("getDeliveryMethod finds by id and returns undefined for unknown", () => {
    expect(getDeliveryMethod("np-courier")?.price).toBe(120);
    expect(getDeliveryMethod("dhl")).toBeUndefined();
  });

  it("getShippingMethodLabel maps NP ids to Ukrainian names", () => {
    expect(getShippingMethodLabel("np-office")).toBe("Нова Пошта — відділення");
    expect(getShippingMethodLabel("np-courier")).toBe("Нова Пошта — кур'єр");
    expect(getShippingMethodLabel("np-postomat")).toBe("Нова Пошта — поштомат");
  });

  it("getShippingMethodLabel maps legacy ids (pre-G2 orders) to their labels", () => {
    expect(getShippingMethodLabel("standard")).toBe("Standard Shipping");
    expect(getShippingMethodLabel("express")).toBe("Express Shipping");
    expect(getShippingMethodLabel("overnight")).toBe("Overnight Shipping");
  });

  it("getShippingMethodLabel falls back to the raw id", () => {
    expect(getShippingMethodLabel("mystery")).toBe("mystery");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/shipping.test.ts`
Expected: FAIL — cannot resolve `@/lib/shipping`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/shipping.ts`:

```ts
/**
 * Delivery options for the no-prepayment COD checkout (spec
 * 2026-08-06-g2-checkout-restyle-cod-design.md §3). UAH numerics — with
 * Stripe out of the checkout path these are the real order amounts.
 * Interim NP published rates until TASK-049 (live NP integration).
 */
export const DELIVERY_METHODS = [
  { id: "np-office", name: "Нова Пошта — відділення", description: "1-3 дні", price: 80 },
  { id: "np-courier", name: "Нова Пошта — кур'єр", description: "1-3 дні, до дверей", price: 120 },
  { id: "np-postomat", name: "Нова Пошта — поштомат", description: "1-3 дні", price: 70 },
] as const;

export type DeliveryMethodId = (typeof DELIVERY_METHODS)[number]["id"];

export const DEFAULT_DELIVERY_METHOD_ID: DeliveryMethodId = "np-office";

export function getDeliveryMethod(id: string) {
  return DELIVERY_METHODS.find((method) => method.id === id);
}

// Orders created before G2 store the retired Stripe-era method ids.
const LEGACY_METHOD_LABELS: Record<string, string> = {
  standard: "Standard Shipping",
  express: "Express Shipping",
  overnight: "Overnight Shipping",
};

/** Display label for any stored Order.shippingMethod value, old or new. */
export function getShippingMethodLabel(id: string): string {
  return getDeliveryMethod(id)?.name ?? LEGACY_METHOD_LABELS[id] ?? id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/shipping.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/shipping.ts tests/unit/shipping.test.ts
git commit -m "feat(checkout): add Nova Poshta delivery methods module with legacy label lookup"
```

---

### Task 2: Checkout schema — phone required, postalCode optional, UA messages

**Files:**

- Modify: `src/lib/validations/index.ts:71-88` (`shippingAddressSchema`, `checkoutSchema`)
- Test: `tests/unit/checkout-schema.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `checkoutSchema` / `CheckoutInput` with `shippingAddress.phone` **required** and `shippingAddress.postalCode` **optional**. Ukrainian error messages for rendered fields.

- [ ] **Step 1: Verify the schema's consumers before touching it**

Run: `grep -rn "shippingAddressSchema\|checkoutSchema" src/`
Expected consumers: `src/lib/validations/index.ts` (definition), `src/app/(shop)/checkout/page.tsx` (form resolver). The dormant `confirm-order` route defines its own inline schema — must NOT appear in results as an importer. If anything else imports these schemas, STOP and reassess before changing requiredness.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/checkout-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { checkoutSchema } from "@/lib/validations";

const validInput = {
  email: "test@example.com",
  shippingAddress: {
    name: "Тест Тестовий",
    line1: "Відділення №12",
    city: "Київ",
    country: "UA",
    phone: "+380501234567",
  },
  shippingMethod: "np-office",
};

describe("checkoutSchema (G2 slim UA form)", () => {
  it("accepts the slim form payload without postalCode/company/line2/state", () => {
    const result = checkoutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a missing phone (required for COD fulfillment)", () => {
    const { phone: _phone, ...addressNoPhone } = validInput.shippingAddress;
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: addressNoPhone,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty phone with the Ukrainian message", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: { ...validInput.shippingAddress, phone: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Вкажіть номер телефону");
    }
  });

  it("still accepts an explicit postalCode (legacy/dormant-path compatibility)", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: { ...validInput.shippingAddress, postalCode: "01001" },
    });
    expect(result.success).toBe(true);
  });

  it("keeps country required", () => {
    const { country: _c, ...addressNoCountry } = validInput.shippingAddress;
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: addressNoCountry,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/checkout-schema.test.ts`
Expected: FAIL — "accepts the slim form payload" fails (postalCode currently required) and the phone tests fail (phone currently optional).

- [ ] **Step 4: Update the schema**

In `src/lib/validations/index.ts` replace the `shippingAddressSchema` and `checkoutSchema` block with:

```ts
// Checkout validations — G2 slim UA form (spec §7): phone is the COD
// fulfillment channel (required); NP branch number replaces the postal code
// (optional); country stays required — the client always submits "UA".
export const shippingAddressSchema = z.object({
  name: z.string().min(1, "Вкажіть ім'я"),
  company: z.string().optional(),
  line1: z.string().min(1, "Вкажіть відділення або адресу"),
  line2: z.string().optional(),
  city: z.string().min(1, "Вкажіть місто"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2, "Вкажіть країну"),
  phone: z.string().min(1, "Вкажіть номер телефону"),
});

export const checkoutSchema = z.object({
  email: z.string().email("Введіть коректну email-адресу"),
  shippingAddress: shippingAddressSchema,
  shippingMethod: z.string().min(1, "Оберіть спосіб доставки"),
  customerNotes: z.string().max(500).optional(),
});
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run tests/unit/checkout-schema.test.ts && npm run typecheck`
Expected: tests PASS. Typecheck: the checkout page may error on `phone` requiredness in `defaultValues` — if so that is expected until Task 6 rebuilds the page; note it, and only fix `defaultValues` minimally (`phone: ""` already present — required strings with `""` defaults typecheck fine, so no error is actually expected).

- [ ] **Step 6: Run the full unit suite to catch collateral**

Run: `npm run test:run`
Expected: PASS (existing 606 + new). If a dormant-path test fails on the schema change, STOP — the dormant `confirm-order` has its own inline schema, so failures indicate an unexpected coupling.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validations/index.ts tests/unit/checkout-schema.test.ts
git commit -m "feat(checkout): require phone, relax postalCode, Ukrainian validation messages"
```

---

### Task 3: Content module `src/content/checkout.ts`

**Files:**

- Create: `src/content/checkout.ts`

**Interfaces:**

- Consumes: `site` from `./site` (socials), nothing else.
- Produces: `checkout` object with the exact keys shown below — Tasks 6 and 7 import `{ checkout }` and reference these paths verbatim (e.g. `checkout.steps.contacts`, `checkout.payment.prepay.cardNumber`, `checkout.confirmation.title`).

- [ ] **Step 1: Create the content module**

Create `src/content/checkout.ts`:

```ts
import { site } from "./site";

/**
 * Checkout + confirmation copy (spec 2026-08-06-g2-checkout-restyle-cod-design.md
 * §2/§6/§8). Single extraction point for TASK-039 i18n — plain typed strings.
 *
 * CLIENT-SUPPLIED, PENDING (TASK-056 ask, added 2026-08-06): `payment.prepay.cardNumber`
 * / `cardHolder` (manual full-prepayment card details) and `contacts` whatsapp href.
 * While null, the UI renders the contact-the-manager fallback / hides the link —
 * filling the value lights the block up with no code change.
 */
export const checkout = {
  title: "Оформлення замовлення",
  secureNote: "Захищене оформлення",
  steps: {
    contacts: "Контакти",
    delivery: "Доставка",
    payment: "Оплата",
  },
  contact: {
    heading: "Контактні дані",
    name: { label: "Ім'я", placeholder: "Олександр Коваленко" },
    phone: { label: "Телефон", placeholder: "+380 __ ___ __ __" },
    email: { label: "Email", placeholder: "you@example.com" },
    next: "ДАЛІ — ДОСТАВКА",
  },
  delivery: {
    heading: "Доставка",
    city: { label: "Місто", placeholder: "Київ" },
    address: { label: "Відділення / адреса", placeholder: "Відділення №12" },
    notes: {
      label: "Коментар до замовлення (необов'язково)",
      placeholder: "Побажання до замовлення…",
    },
    back: "← НАЗАД",
    next: "ДАЛІ — ОПЛАТА",
  },
  payment: {
    heading: "Оплата",
    cod: {
      name: "Оплата при отриманні",
      description: "Без передоплати · готівкою або карткою у відділенні",
    },
    noPrepay: "Працюємо без передоплати",
    prepay: {
      /** CLIENT-SUPPLIED, PENDING — see module doc comment. */
      cardNumber: null as string | null,
      cardHolder: null as string | null,
      offer: "Хочете оплатити повну вартість наперед? Напишіть менеджеру — надішлемо реквізити.",
      cardLabel: "Оплата повної вартості на картку:",
      contactLabel: "Питання — напишіть менеджеру:",
    },
    back: "← НАЗАД",
    /** The live total is appended in the page: «ПІДТВЕРДИТИ ЗАМОВЛЕННЯ — 1 960 грн». */
    submit: "ПІДТВЕРДИТИ ЗАМОВЛЕННЯ",
    submitting: "Обробка…",
    errors: {
      orderFailed: "Не вдалося оформити замовлення. Спробуйте ще раз.",
    },
  },
  /** Manager contact links. whatsapp is CLIENT-SUPPLIED, PENDING (null hides the link). */
  contacts: {
    instagram: site.socials.find((s) => s.platform === "instagram")?.href ?? null,
    telegram: site.socials.find((s) => s.platform === "telegram")?.href ?? null,
    whatsapp: null as string | null,
  },
  summary: {
    heading: "Ваше замовлення",
    itemsLabel: "Товари",
    shippingLabel: "Доставка",
    totalLabel: "До сплати",
    /** «1 шт» — quantity unit used in the variant line «Чорний · L · 1 шт». */
    qty: (n: number) => `${n} шт`,
  },
  empty: {
    title: "Кошик порожній",
    description: "Додайте товари до кошика, щоб оформити замовлення.",
    cta: "Перейти в каталог",
  },
  confirmation: {
    title: "Замовлення прийнято!",
    emailSentPrefix: "Дякуємо! Ми надіслали підтвердження на",
    orderNumberLabel: "Замовлення №",
    detailsHeading: "Деталі замовлення",
    paymentCod: "Оплата при отриманні у відділенні",
    paymentCard: "Карткою онлайн",
    paymentLabel: "Оплата",
    subtotalLabel: "Товари",
    shippingLabel: "Доставка",
    totalLabel: "До сплати",
    addressHeading: "Адреса доставки",
    methodHeading: "Спосіб доставки",
    emailCardTitle: "Лист із підтвердженням",
    emailCardTextPrefix: "Деталі замовлення надіслано на",
    continueShopping: "Продовжити покупки",
    viewOrders: "Історія замовлень",
    notFoundTitle: "Замовлення не знайдено",
    notFoundText: "Ми не знайшли замовлення за вказаним номером.",
    loading: "Завантажуємо деталі замовлення…",
  },
};
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run typecheck && npx eslint src/content/checkout.ts`
Expected: clean. (No unit test — pure content module, same as `cart.ts`/`site.ts`; consumers' tests cover it.)

- [ ] **Step 3: Commit**

```bash
git add src/content/checkout.ts
git commit -m "feat(checkout): add checkout/confirmation content module (UA copy, content-gated prepay + contacts)"
```

---

### Task 4: `POST /api/checkout/create-order` + email postalCode relaxation

**Files:**

- Create: `src/app/api/checkout/create-order/route.ts`
- Modify: `src/lib/email.ts:33` (`OrderEmailData.shippingAddress.postalCode` → optional) and `src/lib/email.ts:62` (template interpolation)
- Test: `tests/unit/checkout-create-order-api.test.ts`

**Interfaces:**

- Consumes: `checkoutSchema` (Task 2), `getDeliveryMethod` (Task 1), `generateOrderNumber` from `@/lib/stripe` (existing — importing it does NOT initialize Stripe; `getStripe()` is lazy), `sendOrderConfirmationEmail` from `@/lib/email`.
- Produces: `POST /api/checkout/create-order` returning `{ orderId, orderNumber }` (200) — Task 6's submit handler posts `CheckoutInput & { items }` to it.

- [ ] **Step 1: Relax the email type**

In `src/lib/email.ts`, change line 33 from `postalCode: string;` to `postalCode?: string;` and change the template line 62 interpolation `${data.shippingAddress.postalCode}` to `${data.shippingAddress.postalCode ?? ""}`.

Run: `npm run typecheck`
Expected: clean (the dormant confirm-order still passes a string — narrowing to optional is backward compatible).

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/checkout-create-order-api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "../helpers/api-test-utils";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/checkout/create-order/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.product.findMany as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

const validBody = {
  email: "guest@example.com",
  shippingAddress: {
    name: "Тест Тестовий",
    line1: "Відділення №12",
    city: "Київ",
    country: "UA",
    phone: "+380501234567",
  },
  shippingMethod: "np-office",
  items: [{ productId: "prod-1", quantity: 2 }],
};

const dbProduct = {
  id: "prod-1",
  name: "Худі Mirox Basic",
  sku: "HUDI-1",
  price: 1290,
  variants: [],
};

function mockTx() {
  const tx = {
    order: {
      create: vi.fn().mockResolvedValue({
        id: "order-1",
        orderNumber: "ORD-TEST",
        items: [],
      }),
    },
    product: { update: vi.fn() },
    productVariant: { update: vi.fn() },
  };
  mockTransaction.mockImplementation(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx));
  return tx;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);
  mockFindMany.mockResolvedValue([dbProduct]);
});

describe("POST /api/checkout/create-order", () => {
  it("returns 400 when phone is missing", async () => {
    const { phone: _p, ...noPhone } = validBody.shippingAddress;
    const res = await POST(
      createNextRequest({
        url: "/api/checkout/create-order",
        method: "POST",
        body: { ...validBody, shippingAddress: noPhone },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when items is empty", async () => {
    const res = await POST(
      createNextRequest({
        url: "/api/checkout/create-order",
        method: "POST",
        body: { ...validBody, items: [] },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an unknown shipping method", async () => {
    const res = await POST(
      createNextRequest({
        url: "/api/checkout/create-order",
        method: "POST",
        body: { ...validBody, shippingMethod: "standard" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("creates a guest COD order with PENDING status and server-computed totals", async () => {
    const tx = mockTx();
    const res = await POST(
      createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orderNumber).toBe("ORD-TEST");
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: null,
          status: "PENDING",
          paymentMethod: "cod",
          paymentStatus: "PENDING",
          subtotal: 2580, // 2 × 1290 from the DB price, never the client's
          shippingCost: 80, // np-office
          total: 2660,
        }),
      })
    );
  });

  it("links the order to the signed-in user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-7", email: "user@example.com" } });
    const tx = mockTx();
    await POST(
      createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
    );
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-7" }) })
    );
  });

  it("decrements product stock (no variant)", async () => {
    const tx = mockTx();
    await POST(
      createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
    );
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { stock: { decrement: 2 } },
    });
  });

  it("decrements variant stock and uses the variant price when variantId given", async () => {
    mockFindMany.mockResolvedValue([
      {
        ...dbProduct,
        variants: [{ id: "var-1", name: "Розмір", value: "L", price: 1390 }],
      },
    ]);
    const tx = mockTx();
    await POST(
      createNextRequest({
        url: "/api/checkout/create-order",
        method: "POST",
        body: { ...validBody, items: [{ productId: "prod-1", variantId: "var-1", quantity: 1 }] },
      })
    );
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: "var-1" },
      data: { stock: { decrement: 1 } },
    });
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subtotal: 1390, shippingCost: 80, total: 1470 }),
      })
    );
  });

  it("returns 400 when no ordered product exists in the DB", async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await POST(
      createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
    );
    expect(res.status).toBe(400);
  });

  it("fires the confirmation email non-blocking", async () => {
    mockTx();
    await POST(
      createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
    );
    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ orderNumber: "ORD-TEST", email: "guest@example.com" })
    );
  });

  it("returns 500 when the transaction fails", async () => {
    mockTransaction.mockRejectedValue(new Error("db down"));
    const res = await POST(
      createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
    );
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/checkout-create-order-api.test.ts`
Expected: FAIL — cannot resolve `@/app/api/checkout/create-order/route`.

- [ ] **Step 4: Write the route**

Create `src/app/api/checkout/create-order/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/stripe";
import { getDeliveryMethod } from "@/lib/shipping";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { checkoutSchema } from "@/lib/validations";
import { z } from "zod";

// No-prepayment COD order creation (spec §4). Guest-capable: session optional.
// The dormant Stripe path (create-payment-intent + confirm-order) is untouched.
const createOrderSchema = checkoutSchema.extend({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const deliveryMethod = getDeliveryMethod(data.shippingMethod);
    if (!deliveryMethod) {
      return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });
    }

    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    // Prices always come from the DB — the client payload is never trusted.
    let subtotal = 0;
    const orderItemsData: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      productSku: string;
      variantInfo?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      let price = Number(product.price);
      let variantInfo: string | undefined;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          if (variant.price) price = Number(variant.price);
          variantInfo = `${variant.name}: ${variant.value}`;
        }
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        variantId: item.variantId,
        productName: product.name,
        productSku: product.sku,
        variantInfo,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
      });
    }

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: "No valid items in order" }, { status: 400 });
    }

    const shippingCost = deliveryMethod.price;
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session?.user?.id || null,
          email: data.email,
          phone: data.shippingAddress.phone,
          status: "PENDING",
          subtotal,
          shippingCost,
          tax,
          total,
          shippingAddress: data.shippingAddress,
          shippingMethod: data.shippingMethod,
          paymentMethod: "cod",
          paymentStatus: "PENDING",
          customerNotes: data.customerNotes,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              productSku: item.productSku,
              variantInfo: item.variantInfo,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of data.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    sendOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      email: data.email,
      items: orderItemsData.map((item) => ({
        productName: item.productName,
        variantInfo: item.variantInfo,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal,
      shippingCost,
      tax,
      total,
      shippingAddress: data.shippingAddress,
      shippingMethod: data.shippingMethod,
    }).catch(() => {
      // Email failure is non-critical — order is already created
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid order data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/checkout-create-order-api.test.ts && npm run typecheck`
Expected: PASS (10 tests), typecheck clean.

- [ ] **Step 6: Confirm the dormant path is untouched**

Run: `git status --short src/app/api/checkout/ src/lib/stripe.ts src/components/checkout/`
Expected: only `src/app/api/checkout/create-order/` is new; `create-payment-intent`, `confirm-order`, `stripe.ts`, `PaymentForm.tsx` show no changes.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/checkout/create-order/route.ts src/lib/email.ts tests/unit/checkout-create-order-api.test.ts
git commit -m "feat(checkout): guest-capable COD order creation endpoint (PENDING, no payment)"
```

---

### Task 5: Guest checkout — middleware

**Files:**

- Modify: `src/middleware.ts:8`

**Interfaces:**

- Consumes: nothing. Produces: `/checkout` publicly reachable (Task 8's E2E asserts it end-to-end).

- [ ] **Step 1: Edit the protected-routes list**

In `src/middleware.ts` change:

```ts
// Routes that require authentication
const protectedRoutes = ["/account", "/checkout"];
```

to:

```ts
// Routes that require authentication. /checkout is deliberately public —
// guest COD checkout (G2 spec §5); orders still link to the account when a
// session exists.
const protectedRoutes = ["/account"];
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run test:run`
Expected: clean; no existing test asserts the checkout redirect (E2E coverage lands in Task 8).

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(checkout): allow guest checkout (remove /checkout auth gate)"
```

---

### Task 6: Checkout page rebuild

**Files:**

- Rewrite: `src/app/(shop)/checkout/page.tsx`

**Interfaces:**

- Consumes: `checkout` content (Task 3), `DELIVERY_METHODS`/`DEFAULT_DELIVERY_METHOD_ID` (Task 1), `checkoutSchema`/`CheckoutInput` (Task 2), `POST /api/checkout/create-order` (Task 4), `useCartStore`, `formatPrice`, `trackBeginCheckout`/`trackAddShippingInfo`/`trackAddPaymentInfo` (existing signatures: `(items: GA4Item[], value: number)` / `(..., shippingTier: string)` / `(..., paymentType: string)`).
- Produces: the live `/checkout` page. Step ids stay `"information" | "shipping" | "payment"` (internal state values — analytics and tests key off visible UA labels, not these).

- [ ] **Step 1: Rewrite the page**

Replace the full contents of `src/app/(shop)/checkout/page.tsx` with:

```tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingBag, Lock, Instagram, Send, MessageCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/stores/cart.store";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { DELIVERY_METHODS, DEFAULT_DELIVERY_METHOD_ID } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";
import { checkout } from "@/content/checkout";
import { trackBeginCheckout, trackAddShippingInfo, trackAddPaymentInfo } from "@/lib/analytics";

type CheckoutStep = "information" | "shipping" | "payment";

const STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: "information", label: checkout.steps.contacts },
  { id: "shipping", label: checkout.steps.delivery },
  { id: "payment", label: checkout.steps.payment },
];

const inputClass = "border-border-strong bg-background rounded-[10px] border px-3.5 py-3 text-sm";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("information");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: session?.user?.email || "",
      shippingAddress: {
        name: session?.user?.name || "",
        company: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "UA",
        phone: "",
      },
      shippingMethod: DEFAULT_DELIVERY_METHOD_ID,
      customerNotes: "",
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      form.setValue("email", session.user.email);
    }
    if (session?.user?.name) {
      form.setValue("shippingAddress.name", session.user.name);
    }
  }, [session, form]);

  // GA4: Track begin checkout (once)
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !checkoutTracked.current) {
      checkoutTracked.current = true;
      trackBeginCheckout(
        items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          item_variant: item.size,
          price: item.price,
          quantity: item.quantity,
        })),
        getTotalPrice()
      );
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = getTotalPrice();
  const selectedShipping = DELIVERY_METHODS.find((m) => m.id === form.watch("shippingMethod"));
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal + shippingCost;

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleContinueToShipping = async () => {
    const isValid = await form.trigger(["email", "shippingAddress.name", "shippingAddress.phone"]);
    if (isValid) {
      setCurrentStep("shipping");
    }
  };

  const handleContinueToPayment = async () => {
    const isValid = await form.trigger([
      "shippingAddress.city",
      "shippingAddress.line1",
      "shippingMethod",
    ]);
    if (!isValid) return;

    const gaItems = items.map((item) => ({
      item_id: item.productId,
      item_name: item.name,
      item_variant: item.size,
      price: item.price,
      quantity: item.quantity,
    }));
    trackAddShippingInfo(gaItems, getTotalPrice(), selectedShipping?.name || "");
    trackAddPaymentInfo(gaItems, getTotalPrice(), "cod");
    setCurrentStep("payment");
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = form.getValues();
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || checkout.payment.errors.orderFailed);
      }

      clearCart();
      router.push(`/checkout/confirmation?order=${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : checkout.payment.errors.orderFailed);
      setIsProcessing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <ShoppingBag className="text-muted-foreground mx-auto h-16 w-16" />
          <h1 className="mt-6 text-2xl font-extrabold">{checkout.empty.title}</h1>
          <p className="text-muted-foreground mt-2">{checkout.empty.description}</p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-[10px] bg-white px-7 py-4 text-[13.5px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
          >
            {checkout.empty.cta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 lg:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{checkout.title}</h1>

      {/* Step nav — numbered circles per handoff */}
      <div className="mt-6 mb-8 flex items-center gap-2 text-[13px] font-bold">
        {STEPS.map((step, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground mx-1">→</span>}
              <button
                type="button"
                className={`flex items-center gap-2 ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                } disabled:cursor-default`}
                onClick={() => isDone && setCurrentStep(step.id)}
                disabled={!isDone || isProcessing}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11.5px] ${
                    isActive
                      ? "border-white bg-white text-black"
                      : isDone
                        ? "border-white bg-transparent"
                        : "border-border-strong bg-transparent"
                  }`}
                >
                  {i + 1}
                </span>
                {step.label}
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
        <div>
          <Form {...form}>
            <form className="space-y-6">
              {/* Step 1 — Контакти */}
              {currentStep === "information" && (
                <div className="bg-card border-border rounded-[20px] border p-7 lg:p-8">
                  <h2 className="text-xl font-extrabold">{checkout.contact.heading}</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="shippingAddress.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.contact.name.label}</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder={checkout.contact.name.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddress.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.contact.phone.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              className={inputClass}
                              placeholder={checkout.contact.phone.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{checkout.contact.email.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              className={inputClass}
                              placeholder={checkout.contact.email.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-6 rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
                    onClick={handleContinueToShipping}
                  >
                    {checkout.contact.next}
                  </button>
                </div>
              )}

              {/* Step 2 — Доставка */}
              {currentStep === "shipping" && (
                <div className="bg-card border-border rounded-[20px] border p-7 lg:p-8">
                  <h2 className="text-xl font-extrabold">{checkout.delivery.heading}</h2>
                  <FormField
                    control={form.control}
                    name="shippingMethod"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col gap-3"
                          >
                            {DELIVERY_METHODS.map((method) => (
                              <Label
                                key={method.id}
                                htmlFor={method.id}
                                className={`flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border p-5 transition-colors ${
                                  field.value === method.id
                                    ? "border-white"
                                    : "border-border-strong hover:border-muted-foreground"
                                }`}
                              >
                                <span className="flex items-center gap-3.5">
                                  <RadioGroupItem value={method.id} id={method.id} />
                                  <span>
                                    <span className="block text-[14.5px] font-bold">
                                      {method.name}
                                    </span>
                                    <span className="text-muted-foreground mt-0.5 block text-[12.5px]">
                                      {method.description}
                                    </span>
                                  </span>
                                </span>
                                <span className="text-sm font-extrabold whitespace-nowrap">
                                  {formatPrice(method.price)}
                                </span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mt-5 grid gap-4">
                    <FormField
                      control={form.control}
                      name="shippingAddress.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.delivery.city.label}</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder={checkout.delivery.city.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddress.line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.delivery.address.label}</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder={checkout.delivery.address.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.delivery.notes.label}</FormLabel>
                          <FormControl>
                            <Textarea
                              className={`${inputClass} resize-none`}
                              placeholder={checkout.delivery.notes.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      className="border-border-strong hover:border-muted-foreground rounded-[10px] border px-6 py-4 text-[13px] font-bold transition-colors"
                      onClick={() => setCurrentStep("information")}
                    >
                      {checkout.delivery.back}
                    </button>
                    <button
                      type="button"
                      className="rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
                      onClick={handleContinueToPayment}
                    >
                      {checkout.delivery.next}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Оплата (no payment processing — COD, spec §2) */}
              {currentStep === "payment" && (
                <div className="bg-card border-border rounded-[20px] border p-7 lg:p-8">
                  <h2 className="text-xl font-extrabold">{checkout.payment.heading}</h2>

                  <div className="border-border mt-6 rounded-[14px] border border-white p-5">
                    <p className="text-[14.5px] font-bold">{checkout.payment.cod.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                      {checkout.payment.cod.description}
                    </p>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm font-semibold">
                    {checkout.payment.noPrepay}
                  </p>

                  {/* Content-gated prepay block (spec §2): card details when the
                      client supplies them, contact-the-manager fallback until then. */}
                  <div className="bg-muted/40 border-border mt-5 rounded-[14px] border p-5 text-sm">
                    {checkout.payment.prepay.cardNumber ? (
                      <>
                        <p className="font-semibold">{checkout.payment.prepay.cardLabel}</p>
                        <p className="mt-1 text-base font-extrabold tracking-wider">
                          {checkout.payment.prepay.cardNumber}
                        </p>
                        {checkout.payment.prepay.cardHolder && (
                          <p className="text-muted-foreground mt-0.5">
                            {checkout.payment.prepay.cardHolder}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-3">
                          {checkout.payment.prepay.contactLabel}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">{checkout.payment.prepay.offer}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4">
                      {checkout.contacts.instagram && (
                        <a
                          href={checkout.contacts.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground flex items-center gap-1.5 text-[13px] font-bold transition-colors"
                        >
                          <Instagram className="h-4 w-4" /> Instagram
                        </a>
                      )}
                      {checkout.contacts.whatsapp && (
                        <a
                          href={checkout.contacts.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground flex items-center gap-1.5 text-[13px] font-bold transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      {checkout.contacts.telegram && (
                        <a
                          href={checkout.contacts.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground flex items-center gap-1.5 text-[13px] font-bold transition-colors"
                        >
                          <Send className="h-4 w-4" /> Telegram
                        </a>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 text-destructive mt-5 rounded-lg p-4 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="border-border-strong hover:border-muted-foreground rounded-[10px] border px-6 py-4 text-[13px] font-bold transition-colors disabled:opacity-50"
                      onClick={() => setCurrentStep("shipping")}
                      disabled={isProcessing}
                    >
                      {checkout.payment.back}
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={handleSubmitOrder}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {checkout.payment.submitting}
                        </span>
                      ) : (
                        `${checkout.payment.submit} — ${formatPrice(total)}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Ваше замовлення */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card border-border rounded-[20px] border p-7">
            <h2 className="text-lg font-extrabold">{checkout.summary.heading}</h2>
            <div className="mt-5 flex max-h-64 flex-col gap-3.5 overflow-y-auto">
              {items.map((item) => {
                const variantLine = [item.color, item.size, checkout.summary.qty(item.quantity)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div
                    key={`${item.productId}-${item.variantId || ""}`}
                    className="flex items-center gap-3.5"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={56}
                        height={64}
                        className="h-16 w-14 shrink-0 rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-16 w-14 shrink-0 items-center justify-center rounded-[10px]">
                        <ShoppingBag className="text-muted-foreground h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold">{item.name}</p>
                      <p className="text-muted-foreground text-xs">{variantLine}</p>
                    </div>
                    <p className="text-[13.5px] font-extrabold whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-border mt-5 flex flex-col gap-2.5 border-t pt-4 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{checkout.summary.itemsLabel}</span>
                <span className="font-bold whitespace-nowrap">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{checkout.summary.shippingLabel}</span>
                <span className="font-bold whitespace-nowrap">{formatPrice(shippingCost)}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-base">
                <span className="font-bold">{checkout.summary.totalLabel}</span>
                <span className="font-extrabold whitespace-nowrap">{formatPrice(total)}</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5" />
              {checkout.secureNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck, lint, and confirm no Stripe references remain**

Run: `npm run typecheck && npx eslint "src/app/(shop)/checkout/page.tsx" && grep -n "stripe\|Stripe\|PaymentForm\|clientSecret" "src/app/(shop)/checkout/page.tsx"`
Expected: typecheck + lint clean; grep returns **nothing**.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: successful production build (catches server/client boundary issues the dev server hides).

- [ ] **Step 4: Manual dev-server walk-through**

Run: `npm run dev -- --port 3001`, then in a browser (or `curl -sI http://localhost:3001/checkout` for the redirect check first — expect `200`, not `307` to `/login`):

1. Add a product to the cart from a PDP, open `/checkout` while logged out.
2. Step 1: submit empty → UA validation messages («Вкажіть ім'я», «Вкажіть номер телефону»); fill and continue.
3. Step 2: NP radios show «80 грн»/«120 грн»/«70 грн» via formatPrice; fill Місто + Відділення; continue.
4. Step 3: «Працюємо без передоплати», manager links (Instagram/Telegram render, WhatsApp hidden), submit → confirmation redirect; verify in Prisma Studio (`npm run db:studio`) the order has `status: PENDING`, `paymentMethod: cod`, `paymentStatus: PENDING`, `shippingCost: 80`.
5. Order summary shows the variant line «Чорний · L · 1 шт» for a colorway/size item.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(shop)/checkout/page.tsx"
git commit -m "feat(checkout): rebuild 3-step checkout to Mirox handoff — UA copy, NP methods, COD step, guest submit"
```

---

### Task 7: Confirmation page — Ukrainian + Mirox restyle

**Files:**

- Rewrite: `src/app/(shop)/checkout/confirmation/page.tsx`

**Interfaces:**

- Consumes: `checkout.confirmation` strings (Task 3), `getShippingMethodLabel` (Task 1), existing `PurchaseTracker`, `formatPrice`, `prisma`.
- Produces: the live `/checkout/confirmation` page.

- [ ] **Step 1: Rewrite the page**

Replace the full contents of `src/app/(shop)/checkout/confirmation/page.tsx` with:

```tsx
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { CheckCircle2, Package, Mail, ArrowRight, Loader2, Banknote } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { formatPrice } from "@/lib/format";
import { getShippingMethodLabel } from "@/lib/shipping";
import { checkout } from "@/content/checkout";

const t = checkout.confirmation;

interface ConfirmationPageProps {
  searchParams: Promise<{ order?: string }>;
}

async function OrderConfirmation({ orderNumber }: { orderNumber: string }) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddress as {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };

  return (
    <div className="container py-12">
      <PurchaseTracker
        orderNumber={order.orderNumber}
        total={Number(order.total)}
        tax={Number(order.tax)}
        shippingCost={Number(order.shippingCost)}
        items={order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          variantInfo: item.variantInfo,
        }))}
      />
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-foreground h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold">{t.title}</h1>
          <p className="text-muted-foreground mt-2">
            {t.emailSentPrefix} <span className="text-foreground font-medium">{order.email}</span>
          </p>
          <p className="mt-4 text-lg font-bold">
            {t.orderNumberLabel}
            {order.orderNumber}
          </p>
        </div>

        <div className="bg-card border-border mt-8 rounded-[20px] border p-7">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Package className="h-5 w-5" />
            {t.detailsHeading}
          </h2>

          <div className="mt-6 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold">{item.productName}</p>
                  {item.variantInfo && (
                    <p className="text-muted-foreground text-sm">{item.variantInfo}</p>
                  )}
                  <p className="text-muted-foreground text-sm">
                    {checkout.summary.qty(item.quantity)} × {formatPrice(Number(item.unitPrice))}
                  </p>
                </div>
                <p className="font-bold whitespace-nowrap">
                  {formatPrice(Number(item.totalPrice))}
                </p>
              </div>
            ))}
          </div>

          <div className="border-border mt-6 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.subtotalLabel}</span>
              <span className="font-bold">{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.shippingLabel}</span>
              <span className="font-bold">{formatPrice(Number(order.shippingCost))}</span>
            </div>
            <div className="mt-1 flex justify-between text-base">
              <span className="font-bold">{t.totalLabel}</span>
              <span className="font-extrabold">{formatPrice(Number(order.total))}</span>
            </div>
          </div>

          <div className="border-border mt-6 border-t pt-4">
            <h3 className="mb-2 flex items-center gap-2 font-bold">
              <Banknote className="h-4 w-4" />
              {t.paymentLabel}
            </h3>
            <p className="text-muted-foreground text-sm">
              {order.paymentMethod === "cod" ? t.paymentCod : t.paymentCard}
            </p>
          </div>

          <div className="border-border mt-6 border-t pt-4">
            <h3 className="mb-2 font-bold">{t.addressHeading}</h3>
            <p className="text-muted-foreground text-sm">
              {shippingAddress.name}
              {shippingAddress.company && (
                <>
                  <br />
                  {shippingAddress.company}
                </>
              )}
              <br />
              {shippingAddress.line1}
              {shippingAddress.line2 && (
                <>
                  <br />
                  {shippingAddress.line2}
                </>
              )}
              <br />
              {shippingAddress.city}
              {shippingAddress.state && `, ${shippingAddress.state}`}
              {shippingAddress.postalCode && ` ${shippingAddress.postalCode}`}
            </p>
          </div>

          {order.shippingMethod && (
            <div className="border-border mt-6 border-t pt-4">
              <h3 className="mb-2 font-bold">{t.methodHeading}</h3>
              <p className="text-muted-foreground text-sm">
                {getShippingMethodLabel(order.shippingMethod)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-card border-border mt-6 rounded-[20px] border">
          <div className="flex items-center gap-4 p-5">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Mail className="text-foreground h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold">{t.emailCardTitle}</p>
              <p className="text-muted-foreground text-sm">
                {t.emailCardTextPrefix} {order.email}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
          >
            {t.continueShopping}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/account/orders"
            className="border-border-strong hover:border-muted-foreground inline-flex items-center justify-center rounded-[10px] border px-7 py-4 text-[13px] font-bold transition-colors"
          >
            {t.viewOrders}
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingConfirmation() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4">{t.loading}</p>
      </div>
    </div>
  );
}

function NoOrderNumber() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-extrabold">{t.notFoundTitle}</h1>
        <p className="text-muted-foreground mt-2">{t.notFoundText}</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
        >
          {t.continueShopping}
        </Link>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const orderNumber = params.order;

  if (!orderNumber) {
    return <NoOrderNumber />;
  }

  return (
    <Suspense fallback={<LoadingConfirmation />}>
      <OrderConfirmation orderNumber={orderNumber} />
    </Suspense>
  );
}
```

Notes on deviations from the old file (all deliberate, spec §6): the Tax row is dropped from display (DB still stores `tax`), country line dropped from the address block (always UA), `capitalize`+`.replace()` shipping concat replaced by `getShippingMethodLabel()`, payment line added.

- [ ] **Step 2: Typecheck + lint + build**

Run: `npm run typecheck && npx eslint "src/app/(shop)/checkout/confirmation/page.tsx" && npm run build`
Expected: all clean.

- [ ] **Step 3: Manual verification**

With the dev server from Task 6 still running: place a fresh COD order and confirm the confirmation page renders «Замовлення прийнято!», «Оплата при отриманні у відділенні», «Нова Пошта — відділення», UA totals without a Tax row. Also open an old seeded card order's confirmation URL (`/checkout/confirmation?order=<seeded orderNumber from Prisma Studio>`) and confirm the legacy method renders via the label fallback («Standard Shipping», not "standard Shipping").

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shop)/checkout/confirmation/page.tsx"
git commit -m "feat(checkout): Ukrainian Mirox confirmation page with COD payment line and method-label lookup"
```

---

### Task 8: Cart shipping-string flip + checkout E2E

**Files:**

- Modify: `src/content/cart.ts:22-26` (`summary.shippingValue` + its comment)
- Create: `tests/e2e/checkout.spec.ts`
- Verify (modify only if grep hits): `tests/e2e/cart.spec.ts`

**Interfaces:**

- Consumes: the deployed pages from Tasks 5–7; cart E2E conventions (`data-testid='product-card'`, heading-click navigation, `[data-hydrated="true"]` PDP gate).
- Produces: E2E coverage of the guest COD flow.

- [ ] **Step 1: Flip the cart shipping string**

In `src/content/cart.ts` replace:

```ts
    // Neutral by explicit decision (spec §2): the handoff's «за тарифами
    // Нової Пошти» is false until G2 converts the ship methods; G2 flips
    // this string when that lands.
    shippingValue: "Розраховується при оформленні",
```

with:

```ts
    // G2 flipped this from the G1-era neutral «Розраховується при
    // оформленні» — the checkout now really ships via Nova Poshta methods
    // (src/lib/shipping.ts), so the handoff's original copy is true.
    shippingValue: "За тарифами Нової Пошти",
```

- [ ] **Step 2: Check nothing asserts the old string**

Run: `grep -rn "Розраховується при оформленні" src tests`
Expected: no remaining hits (the cart page and CartDrawer read `cart.summary.shippingValue`). If a test asserts the literal, update it to the new string.

- [ ] **Step 3: Write the checkout E2E spec**

Create `tests/e2e/checkout.spec.ts`:

```ts
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
    await expect(page.getByText(/оплата при отриманні/i)).toBeVisible();
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
```

- [ ] **Step 4: Run the E2E suite locally**

Run: `npm run test:e2e -- checkout.spec.ts cart.spec.ts` (dev server port 3001 per playwright config; seeded DB required — `npm run db:seed` first if needed).
Expected: PASS on chromium at minimum. If a webkit-only failure appears, apply the like-for-like control check on `main` before treating it as a regression (known next-dev cold-compile race precedent from G1).

- [ ] **Step 5: Run the full local gate**

Run: `npm run typecheck && npm run lint && npm run test:run && npm run format:check`
Expected: all clean, full unit suite green.

- [ ] **Step 6: Commit**

```bash
git add src/content/cart.ts tests/e2e/checkout.spec.ts
git commit -m "test(e2e): guest COD checkout flow; flip cart shipping row to NP tariffs copy"
```

---

### Task 9: Docs bookkeeping + visual-fidelity gate

**Files:**

- Modify: `docs/planning/WEEKLY.md` (G2 group note), `docs/planning/BACKLOG.md` (new intake group), `docs/planning/TODO.md` (TASK-056 checklist additions), `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (addendum)

**Interfaces:** none — documentation only, but it MUST land in the same PR (spec §10).

- [ ] **Step 1: WEEKLY scope-change note**

In `docs/planning/WEEKLY.md`, inside the G2 group blockquote (after the existing `> Visual + language only…` line), append a new line to the blockquote:

```markdown
> **Scope change (client steer, 2026-08-06, ruled in-task)**: launch WITHOUT payment processing — checkout is now a guest-capable no-prepayment COD flow (new `create-order` API, NP methods, content-gated prepay block); Stripe path dormant. 5 SP → ~8 SP. Spec: [2026-08-06-g2-checkout-restyle-cod-design.md](../superpowers/specs/2026-08-06-g2-checkout-restyle-cod-design.md).
```

- [ ] **Step 2: Payments decision doc addendum**

At the top of `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (immediately after its title/header block), add:

```markdown
> **Addendum 2026-08-06 (client steer, supersedes the launch sequencing below):** the client
> directed launching **without any payment processing** — COD at the Nova Poshta branch is the
> only rail at launch, with optional manual full prepayment via card details shown on the
> checkout page (content-gated) and manager contacts (Instagram/WhatsApp/Telegram). Implemented
> in G2 (spec `2026-08-06-g2-checkout-restyle-cod-design.md`): guest checkout, `create-order`
> API (orders `PENDING`/`cod`), NP-style methods at 80/120/70 грн. The LiqPay/card gateway work
> (TASK-048) is **deferred until the client asks for online payments**; this doc's gateway
> analysis remains the blueprint for that day. The document body below is unchanged (frozen).
```

- [ ] **Step 3: BACKLOG intake group**

In `docs/planning/BACKLOG.md`, add a new intake group (routing per 📌 Process Rules — Claude-surfaced → 🟤, user/client-raised → 🔵):

```markdown
### [2026-08-06] From: G2 brainstorm / client steer

- 🟤 **create-order idempotency key** — the COD endpoint has no server-side double-submit
  protection (the Stripe path had paymentIntent uniqueness); client-side button disabling only.
  Add an idempotency token when order volume makes duplicates plausible. [G2 spec §4]
- 🟤 **Dormant Stripe path: retire or revive decision** — `create-payment-intent`,
  `confirm-order`, `PaymentForm.tsx`, `stripe.ts`, `stripe-client.ts` are unreferenced by the
  live checkout since G2. Decide at TASK-048 time whether they're the revival base (LiqPay
  adapter) or dead code to remove. Until then they must stay untouched. [G2 spec §5]
- 🟤 **Stripe-Elements dark-theme BACKLOG note is moot for checkout** — the existing entry about
  Elements' dark theme being unverifiable locally no longer applies to the live checkout (no
  Elements rendered); annotate that entry rather than delete (dormant path may return). [G2]
- 🔵 **Free-shipping threshold revisit** — with real UAH shipping amounts now charged
  (80/120/70), the retracted «безкоштовна доставка від X грн» announcement becomes
  implementable the day the client confirms a threshold (site.ts announcement + shipping.ts
  price rule + honest copy). Client-gated. [G2 / TASK-056]
```

- [ ] **Step 4: TODO TASK-056 additions**

In `docs/planning/TODO.md`, find the TASK-056 (client content inventory) checklist and add two items:

```markdown
- [ ] Bank-card details for the checkout prepay block (card number + holder name) — lights up
      `src/content/checkout.ts` `payment.prepay` (G2, 2026-08-06)
- [ ] WhatsApp contact number/link for checkout manager contacts — `src/content/checkout.ts`
      `contacts.whatsapp` (G2, 2026-08-06)
```

- [ ] **Step 5: docs/README.md index manual check**

Per the WEEKLY mitigation note (docs-freshness linter not yet landed): verify `docs/README.md` index rows ↔ doc headers in both directions **plus neighbouring rows** for every doc touched this task (WEEKLY, BACKLOG, TODO, decision doc, G2 spec — the spec row was already added at `docs/README.md:62` during brainstorming; confirm it still matches the file's title and date).

- [ ] **Step 6: Commit**

```bash
git add docs/planning/WEEKLY.md docs/planning/BACKLOG.md docs/planning/TODO.md docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md
git commit -m "docs(planning): G2 scope-change bookkeeping — WEEKLY note, payments-doc addendum, BACKLOG intake, TASK-056 asks"
```

- [ ] **Step 7: Visual-fidelity gate (human sign-off — do NOT self-approve)**

With the dev server running, capture screenshots of `/checkout` step 1, 2, 3, the order summary, the empty state, and `/checkout/confirmation` at **1440×900 and 390×844** (Playwright script in the session scratchpad, per the G1 audit precedent — screenshots stay out of the repo). Present them side-by-side with `docs/design/design_handoff_mirox/Mirox Checkout.dc.html` rendered in a browser, and ask the user for explicit visual sign-off. **The task is not complete until the user approves the visuals.** Iterate on gaps they flag.

---

## Final PR checklist (after Task 9 sign-off)

- [ ] `npm run typecheck && npm run lint && npm run test:run && npm run format:check && npm run build` — all green
- [ ] `git diff main --stat` shows **zero changes** to: `src/lib/stripe.ts`, `src/lib/stripe-client.ts`, `src/components/checkout/PaymentForm.tsx`, `src/app/api/checkout/create-payment-intent/`, `src/app/api/checkout/confirm-order/`
- [ ] Push branch, open PR with `gh pr create` (repo slug via `gh repo view --json nameWithOwner` — never inferred from the directory name); body summarizes the scope change with a spec link
- [ ] E2E green in CI (chromium + webkit); if webkit-only failures, run the like-for-like main-branch control before debugging
- [ ] User approval → completion workflow (DONE/WEEKLY/BACKLOG extraction ≥2, plan archive, memory capture) per CLAUDE.md
