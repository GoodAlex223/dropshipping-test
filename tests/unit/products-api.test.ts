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
import { getSalesRanking } from "@/lib/product-queries";
const salesRanking = getSalesRanking as unknown as ReturnType<typeof vi.fn>;

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

describe("GET /api/products — sort", () => {
  it("maps sort=new to createdAt desc", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "new" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: "desc" });
  });

  it("maps sort=price-asc and sort=price-desc to price ordering", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "price-asc" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ price: "asc" });
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "price-desc" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ price: "desc" });
  });

  it("falls back to new for an invalid sort value", async () => {
    await GET(createNextRequest({ url: "/api/products", searchParams: { sort: "hack" } }));
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: "desc" });
  });

  it("keeps the legacy sortBy/sortOrder path when sort is absent", async () => {
    await GET(
      createNextRequest({
        url: "/api/products",
        searchParams: { sortBy: "name", sortOrder: "asc" },
      })
    );
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ name: "asc" });
  });

  it("sort=popular orders ranked products first, backfills newest-first, and paginates", async () => {
    salesRanking.mockResolvedValue(["sold-2", "sold-1"]);
    const d = (day: number) => new Date(2026, 6, day);
    // id-only query for ranking (first findMany call)
    findMany
      .mockResolvedValueOnce([
        { id: "unranked-new", createdAt: d(30) },
        { id: "sold-1", createdAt: d(1) },
        { id: "unranked-old", createdAt: d(2) },
        { id: "sold-2", createdAt: d(3) },
      ])
      // page-row fetch (second findMany call) returns arbitrary order
      .mockResolvedValueOnce([
        { id: "sold-1", createdAt: d(1) },
        { id: "sold-2", createdAt: d(3) },
        { id: "unranked-new", createdAt: d(30) },
        { id: "unranked-old", createdAt: d(2) },
      ]);
    count.mockResolvedValue(4);

    const res = await GET(
      createNextRequest({ url: "/api/products", searchParams: { sort: "popular" } })
    );
    const body = await res.json();

    expect(salesRanking).toHaveBeenCalledWith(90);
    expect(body.data.map((p: { id: string }) => p.id)).toEqual([
      "sold-2",
      "sold-1",
      "unranked-new",
      "unranked-old",
    ]);
    expect(body.pagination.total).toBe(4);
  });
});
