import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: vi.fn() } } }));
vi.mock("@/lib/seo", () => ({ siteConfig: { name: "Mirox Shop", url: "https://mirox.test" } }));

import { prisma } from "@/lib/db";
import { GET } from "@/app/feed/google-shopping.xml/route";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  sku: string;
  barcode: string | null;
  brand: string | null;
  mpn: string | null;
  stock: number;
  isActive: boolean;
  excludeFromFeed: boolean;
  category: { name: string } | null;
  images: { url: string }[];
};

function row(overrides: Partial<Row>): Row {
  return {
    id: "p-placeholder",
    name: "Худі Mirox Basic",
    slug: "hudi-mirox-basic",
    description: "Базове худі",
    shortDesc: null,
    price: 1290,
    comparePrice: null,
    sku: "MRX-001",
    barcode: null,
    brand: "Mirox",
    mpn: null,
    stock: 10,
    isActive: true,
    excludeFromFeed: false,
    category: { name: "Худі" },
    images: [{ url: "https://mirox.test/images/products/p-hudi-basic.png" }],
    ...overrides,
  };
}

const fixture: Row[] = [
  row({}),
  row({
    id: "p-real",
    name: "Олімпійка з лампасами, чорна",
    slug: "olimpiyka-lampasy-chorna",
    sku: "MRX-101",
    brand: null,
    excludeFromFeed: true,
    images: [{ url: "https://pub-xyz.r2.dev/products/1-photo.jpg" }],
  }),
  row({ id: "p-inactive", slug: "inactive", sku: "MRX-009", isActive: false }),
];

beforeEach(() => {
  vi.clearAllMocks();
  // Apply the route's own where-clause to the fixture (isActive / excludeFromFeed
  // equality only — the two keys this route is expected to use).
  vi.mocked(prisma.product.findMany).mockImplementation(async (args: never) => {
    const where = ((args as { where?: Record<string, unknown> }).where ?? {}) as Partial<Row>;
    return fixture.filter((r) =>
      (Object.keys(where) as (keyof Row)[]).every((k) => r[k] === where[k])
    ) as never;
  });
});

describe("GET /feed/google-shopping.xml — excludeFromFeed (G16)", () => {
  it("queries only active, feed-included products", async () => {
    await GET();
    expect(vi.mocked(prisma.product.findMany).mock.calls[0][0]).toEqual(
      expect.objectContaining({ where: { isActive: true, excludeFromFeed: false } })
    );
  });

  it("omits an excluded product from the XML while its siblings remain", async () => {
    const xml = await (await GET()).text();
    expect(xml).toContain("<g:id>p-placeholder</g:id>");
    expect(xml).not.toContain("p-real");
    expect(xml).not.toContain("olimpiyka-lampasy-chorna");
    expect(xml).not.toContain("p-inactive");
  });

  it("still validates the placeholder row (validateFeedItemSafe drops nothing unexpectedly)", async () => {
    const xml = await (await GET()).text();
    expect(xml).toContain("<g:price>1290.00 UAH</g:price>");
    expect(xml).toContain("<g:brand>Mirox</g:brand>");
    expect(xml).toContain("<g:product_type>Худі</g:product_type>");
  });
});
