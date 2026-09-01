// tests/unit/admin-products-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest, createRouteParams } from "../helpers/api-test-utils";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    category: { findUnique: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { POST } from "@/app/api/admin/products/route";
import { PUT } from "@/app/api/admin/products/[id]/route";

const adminSession = { user: { id: "admin-1", email: "a@t.com", role: "ADMIN" }, expires: "" };

const validBody = {
  name: "Олімпійка з лампасами, чорна",
  slug: "olimpiyka-lampasy-chorna",
  price: 1749,
  sku: "MRX-101",
  stock: 20,
  categoryId: "cat-1",
};

const existing = {
  id: "p1",
  name: "Old",
  slug: "old",
  sku: "MRX-001",
  categoryId: "cat-1",
  styleGroup: null,
  excludeFromFeed: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(adminSession as never);
  vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: "cat-1" } as never);
  vi.mocked(prisma.product.create).mockImplementation(
    async ({ data }: never) => ({ id: "new", ...(data as object) }) as never
  );
  vi.mocked(prisma.product.update).mockImplementation(
    async ({ data }: never) => ({ ...existing, ...(data as object) }) as never
  );
});

describe("POST /api/admin/products — G16 fields", () => {
  it("persists styleGroup and excludeFromFeed when sent", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const req = createNextRequest({
      url: "/api/admin/products",
      method: "POST",
      body: { ...validBody, styleGroup: "olimpiyka-lampasy", excludeFromFeed: true },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = vi.mocked(prisma.product.create).mock.calls[0][0].data;
    expect(data).toEqual(
      expect.objectContaining({ styleGroup: "olimpiyka-lampasy", excludeFromFeed: true })
    );
  });

  it("leaves excludeFromFeed to the DB default when omitted (does not force false)", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const res = await POST(
      createNextRequest({ url: "/api/admin/products", method: "POST", body: validBody })
    );
    expect(res.status).toBe(201);
    const data = vi.mocked(prisma.product.create).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.excludeFromFeed).toBeUndefined();
  });

  it("rejects a styleGroup longer than 100 characters", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const res = await POST(
      createNextRequest({
        url: "/api/admin/products",
        method: "POST",
        body: { ...validBody, styleGroup: "x".repeat(101) },
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/admin/products/[id] — G16 fields", () => {
  beforeEach(() => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(existing as never);
  });

  it("updates styleGroup and excludeFromFeed when sent", async () => {
    const req = createNextRequest({
      url: "/api/admin/products/p1",
      method: "PUT",
      body: { styleGroup: "svetr-blyskavka", excludeFromFeed: false },
    });
    const res = await PUT(req, createRouteParams({ id: "p1" }));
    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.product.update).mock.calls[0][0].data;
    expect(data).toEqual(
      expect.objectContaining({ styleGroup: "svetr-blyskavka", excludeFromFeed: false })
    );
  });

  it("clears styleGroup when null is sent (un-links the colourway)", async () => {
    const req = createNextRequest({
      url: "/api/admin/products/p1",
      method: "PUT",
      body: { styleGroup: null },
    });
    await PUT(req, createRouteParams({ id: "p1" }));
    const data = vi.mocked(prisma.product.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.styleGroup).toBeNull();
  });

  // The teeth: Zod 4 keeps .default() under .partial(), so a defaulted flag
  // would be reset to false by ANY partial PUT and silently re-enter the feed.
  it("a partial PUT that omits excludeFromFeed does not touch it", async () => {
    const req = createNextRequest({
      url: "/api/admin/products/p1",
      method: "PUT",
      body: { name: "Renamed" },
    });
    const res = await PUT(req, createRouteParams({ id: "p1" }));
    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.product.update).mock.calls[0][0].data as Record<string, unknown>;
    expect("excludeFromFeed" in data).toBe(false);
    expect("styleGroup" in data).toBe(false);
  });
});
