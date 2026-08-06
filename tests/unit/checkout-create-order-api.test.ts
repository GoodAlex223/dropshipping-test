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
