import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "../helpers/api-test-utils";

// G17 / F7 (MEDIUM, 2/3 panel): this unauthenticated endpoint took a
// client-supplied paymentIntentId AND a client-supplied item list, checked only
// that the intent had status "succeeded", then priced the items from the
// database and wrote the order PAID. The amount actually paid was never
// compared with the computed total, so one cheap genuine payment could be
// replayed against a cart of the most expensive goods in the catalogue.
//
// The card path has been dormant since G2, but the route is still exported and
// callable wherever STRIPE_SECRET_KEY is configured.

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    order: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
  getShippingMethod: vi.fn(),
  generateOrderNumber: vi.fn(() => "ORD-TEST-1"),
}));

import { POST } from "@/app/api/checkout/confirm-order/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, getShippingMethod } from "@/lib/stripe";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.product.findMany as unknown as ReturnType<typeof vi.fn>;
const mockFindFirst = prisma.order.findFirst as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const mockGetStripe = getStripe as unknown as ReturnType<typeof vi.fn>;
const mockGetShipping = getShippingMethod as unknown as ReturnType<typeof vi.fn>;

// 2 x 1290 + 80 shipping = 2660 -> 266000 minor units.
const EXPECTED_MINOR = 266000;

const body = {
  paymentIntentId: "pi_test_123",
  email: "guest@example.com",
  shippingAddress: {
    name: "Тест Тестовий",
    line1: "Відділення №12",
    city: "Київ",
    postalCode: "01001",
    country: "UA",
    phone: "+380501234567",
  },
  shippingMethod: "np-office",
  items: [{ productId: "prod-1", quantity: 2 }],
};

function mockIntent(over: Record<string, unknown> = {}) {
  const intent = {
    status: "succeeded",
    amount: EXPECTED_MINOR,
    amount_received: EXPECTED_MINOR,
    currency: "usd",
    metadata: { orderNumber: "ORD-TEST-1" },
    ...over,
  };
  mockGetStripe.mockReturnValue({
    paymentIntents: { retrieve: vi.fn().mockResolvedValue(intent) },
  });
  return intent;
}

function mockTx() {
  const tx = {
    order: {
      create: vi.fn().mockResolvedValue({ id: "order-1", orderNumber: "ORD-TEST-1", items: [] }),
    },
    product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    productVariant: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    product_update: vi.fn(),
  };
  mockTransaction.mockImplementation(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx));
  return tx;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);
  mockFindFirst.mockResolvedValue(null);
  mockGetShipping.mockReturnValue({ id: "np-office", price: 80 });
  mockFindMany.mockResolvedValue([
    { id: "prod-1", name: "Худі Mirox Basic", sku: "HUDI-1", price: 1290, variants: [] },
  ]);
});

describe("POST /api/checkout/confirm-order — payment amount (G17 F7)", () => {
  it("rejects an intent that paid less than the order total", async () => {
    mockIntent({ amount_received: 100 });
    const tx = mockTx();

    const res = await POST(
      createNextRequest({ url: "/api/checkout/confirm-order", method: "POST", body })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(expect.objectContaining({ code: "PAYMENT_AMOUNT_MISMATCH" }));
    // Nothing may be written: no order, no stock movement, no email.
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("rejects the replay described in the finding: cheap intent, expensive cart", async () => {
    // Attacker paid for one cheap item, then submits ten expensive ones.
    mockIntent({ amount_received: 12900 }); // one 129.00 unit
    mockFindMany.mockResolvedValue([
      { id: "prod-1", name: "Дороге пальто", sku: "COAT-1", price: 9999, variants: [] },
    ]);
    const tx = mockTx();

    const res = await POST(
      createNextRequest({
        url: "/api/checkout/confirm-order",
        method: "POST",
        body: { ...body, items: [{ productId: "prod-1", quantity: 10 }] },
      })
    );

    expect(res.status).toBe(400);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("rejects a currency the intent was not charged in", async () => {
    mockIntent({ currency: "eur" });
    const tx = mockTx();

    const res = await POST(
      createNextRequest({ url: "/api/checkout/confirm-order", method: "POST", body })
    );

    expect(res.status).toBe(400);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("accepts an intent that covers the total", async () => {
    mockIntent();
    const tx = mockTx();

    const res = await POST(
      createNextRequest({ url: "/api/checkout/confirm-order", method: "POST", body })
    );

    expect(res.status).toBe(200);
    expect(tx.order.create).toHaveBeenCalled();
  });

  it("accepts an overpayment rather than stranding a real customer's order", async () => {
    mockIntent({ amount_received: EXPECTED_MINOR + 500 });
    const tx = mockTx();

    const res = await POST(
      createNextRequest({ url: "/api/checkout/confirm-order", method: "POST", body })
    );

    expect(res.status).toBe(200);
    expect(tx.order.create).toHaveBeenCalled();
  });

  it("still rejects an unsucceeded intent", async () => {
    mockIntent({ status: "requires_payment_method" });
    const res = await POST(
      createNextRequest({ url: "/api/checkout/confirm-order", method: "POST", body })
    );
    expect(res.status).toBe(400);
  });
});
