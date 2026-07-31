import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findMany: vi.fn(), count: vi.fn() },
  },
}));
vi.mock("@/lib/product-queries", () => ({
  getSalesRanking: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { GET } from "@/app/api/products/route";
import { createNextRequest } from "../helpers/api-test-utils";

const findMany = prisma.product.findMany as unknown as ReturnType<typeof vi.fn>;
const count = prisma.product.count as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  findMany.mockResolvedValue([]);
  count.mockResolvedValue(0);
});

function whereOf(call = 0) {
  return findMany.mock.calls[call][0].where;
}

describe("GET /api/products — filters", () => {
  it("filters by size via a Size-variant some-condition", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { size: "M" } }));
    expect(whereOf().AND).toEqual([{ variants: { some: { name: "Size", value: "M" } } }]);
  });

  it("combines size and color as two independent some-conditions", async () => {
    await GET(
      createNextRequest({ url: "/api/products", searchParams: { size: "M", color: "Чорний" } })
    );
    expect(whereOf().AND).toEqual([
      { variants: { some: { name: "Size", value: "M" } } },
      { variants: { some: { name: "Color", value: "Чорний" } } },
    ]);
  });

  it("filters by brand equality and inStock as stock > 0", async () => {
    await GET(
      createNextRequest({ url: "/api/products", searchParams: { brand: "Mirox", inStock: "true" } })
    );
    expect(whereOf()).toEqual(
      expect.objectContaining({ isActive: true, brand: "Mirox", stock: { gt: 0 } })
    );
  });

  it("ignores inStock values other than 'true'", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { inStock: "yes" } }));
    expect(whereOf().stock).toBeUndefined();
  });

  it("combines new filters with existing category and price params", async () => {
    await GET(
      createNextRequest({
        url: "/api/products",
        searchParams: { size: "L", category: "hudi", minPrice: "500", maxPrice: "1500" },
      })
    );
    expect(whereOf()).toEqual(
      expect.objectContaining({
        category: { slug: "hudi" },
        price: { gte: 500, lte: 1500 },
        AND: [{ variants: { some: { name: "Size", value: "L" } } }],
      })
    );
  });

  it("selects variants (id/name/value/stock/price), createdAt, and two images", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: {} }));
    const select = findMany.mock.calls[0][0].select;
    expect(select.variants).toEqual({
      select: { id: true, name: true, value: true, stock: true, price: true },
    });
    expect(select.createdAt).toBe(true);
    expect(select.images.take).toBe(2);
  });
});
