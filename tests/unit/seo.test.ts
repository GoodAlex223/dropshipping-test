import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  siteConfig,
  getDefaultMetadata,
  getProductMetadata,
  getCategoryMetadata,
  getOrganizationJsonLd,
  getWebsiteJsonLd,
  getProductJsonLd,
  getBreadcrumbJsonLd,
} from "@/lib/seo";

describe("SEO Utilities", () => {
  describe("siteConfig", () => {
    it("should have required properties", () => {
      expect(siteConfig).toHaveProperty("name");
      expect(siteConfig).toHaveProperty("description");
      expect(siteConfig).toHaveProperty("url");
      expect(siteConfig).toHaveProperty("ogImage");
      expect(siteConfig).toHaveProperty("twitterHandle");
      expect(siteConfig).toHaveProperty("locale");
    });
  });

  describe("getDefaultMetadata", () => {
    it("should return valid metadata object", () => {
      const metadata = getDefaultMetadata();

      expect(metadata).toHaveProperty("metadataBase");
      expect(metadata).toHaveProperty("title");
      expect(metadata).toHaveProperty("description");
      expect(metadata).toHaveProperty("openGraph");
      expect(metadata).toHaveProperty("twitter");
      expect(metadata).toHaveProperty("robots");
    });

    it("should include OpenGraph configuration", () => {
      const metadata = getDefaultMetadata();

      expect(metadata.openGraph).toHaveProperty("type", "website");
      expect(metadata.openGraph).toHaveProperty("siteName", siteConfig.name);
      expect(metadata.openGraph).toHaveProperty("images");
    });

    it("should include Twitter card configuration", () => {
      const metadata = getDefaultMetadata();

      expect(metadata.twitter).toHaveProperty("card", "summary_large_image");
      expect(metadata.twitter).toHaveProperty("creator", siteConfig.twitterHandle);
    });
  });

  describe("getProductMetadata", () => {
    const mockProduct = {
      name: "Test Product",
      slug: "test-product",
      description: "A test product description",
      shortDesc: "Short description",
      price: "29.99",
      comparePrice: "39.99",
      images: [{ url: "https://example.com/image.jpg", alt: "Product image" }],
      category: { name: "Electronics", slug: "electronics" },
    };

    it("should generate product-specific metadata", () => {
      const metadata = getProductMetadata(mockProduct);

      expect(metadata.title).toBe("Test Product");
      expect(metadata.description).toBe("Short description");
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
    });

    it("should use product image in OpenGraph", () => {
      const metadata = getProductMetadata(mockProduct);

      expect(metadata.openGraph?.images).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: "https://example.com/image.jpg",
          }),
        ])
      );
    });

    it("should use shortDesc as description when available", () => {
      const metadata = getProductMetadata(mockProduct);
      expect(metadata.description).toBe("Short description");
    });

    it("should fallback to truncated description when no shortDesc", () => {
      const productWithoutShortDesc = {
        ...mockProduct,
        shortDesc: null,
      };
      const metadata = getProductMetadata(productWithoutShortDesc);
      expect(metadata.description).toBe("A test product description");
    });
  });

  describe("getCategoryMetadata", () => {
    const mockCategory = {
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and gadgets",
      image: "https://example.com/category.jpg",
      productCount: 42,
    };

    it("should generate category-specific metadata", () => {
      const metadata = getCategoryMetadata(mockCategory);

      expect(metadata.title).toBe("Electronics");
      expect(metadata.description).toBe("Electronic devices and gadgets");
    });

    it("should generate description when not provided", () => {
      const categoryWithoutDesc = {
        ...mockCategory,
        description: null,
      };
      const metadata = getCategoryMetadata(categoryWithoutDesc);

      expect(metadata.description).toContain("Electronics");
      expect(metadata.description).toContain("42");
    });
  });

  describe("getOrganizationJsonLd", () => {
    it("should return valid Organization schema", () => {
      const jsonLd = getOrganizationJsonLd();

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Organization");
      expect(jsonLd.name).toBe(siteConfig.name);
      expect(jsonLd.url).toBe(siteConfig.url);
    });
  });

  describe("getWebsiteJsonLd", () => {
    it("should return valid Website schema", () => {
      const jsonLd = getWebsiteJsonLd();

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("WebSite");
      expect(jsonLd.name).toBe(siteConfig.name);
    });

    it("should include SearchAction", () => {
      const jsonLd = getWebsiteJsonLd();

      expect(jsonLd.potentialAction["@type"]).toBe("SearchAction");
      expect(jsonLd.potentialAction.target.urlTemplate).toContain("search");
    });
  });

  describe("getProductJsonLd", () => {
    const mockProduct = {
      name: "Test Product",
      slug: "test-product",
      description: "A test product",
      price: "29.99",
      comparePrice: null,
      sku: "TEST-001",
      stock: 10,
      images: [{ url: "https://example.com/image.jpg" }],
      category: { name: "Electronics" },
    };

    it("should return valid Product schema", () => {
      const jsonLd = getProductJsonLd(mockProduct);

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Product");
      expect(jsonLd.name).toBe("Test Product");
      expect(jsonLd.sku).toBe("TEST-001");
    });

    it("should include Offer with price", () => {
      const jsonLd = getProductJsonLd(mockProduct);

      expect(jsonLd.offers["@type"]).toBe("Offer");
      expect(jsonLd.offers.price).toBe("29.99");
      expect(jsonLd.offers.priceCurrency).toBe("USD");
    });

    it("should set InStock availability when stock > 0", () => {
      const jsonLd = getProductJsonLd(mockProduct);
      expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
    });

    it("should set OutOfStock availability when stock is 0", () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      const jsonLd = getProductJsonLd(outOfStockProduct);
      expect(jsonLd.offers.availability).toBe("https://schema.org/OutOfStock");
    });
  });

  describe("getBreadcrumbJsonLd", () => {
    const items = [
      { name: "Home", url: "https://example.com" },
      { name: "Products", url: "https://example.com/products" },
      { name: "Test Product", url: "https://example.com/products/test" },
    ];

    it("should return valid BreadcrumbList schema", () => {
      const jsonLd = getBreadcrumbJsonLd(items);

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("BreadcrumbList");
      expect(jsonLd.itemListElement).toHaveLength(3);
    });

    it("should have correct positions for items", () => {
      const jsonLd = getBreadcrumbJsonLd(items);

      expect(jsonLd.itemListElement[0].position).toBe(1);
      expect(jsonLd.itemListElement[1].position).toBe(2);
      expect(jsonLd.itemListElement[2].position).toBe(3);
    });

    it("should include ListItem type for each item", () => {
      const jsonLd = getBreadcrumbJsonLd(items);

      jsonLd.itemListElement.forEach((item: { "@type": string }) => {
        expect(item["@type"]).toBe("ListItem");
      });
    });
  });
});
