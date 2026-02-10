import { describe, it, expect } from "vitest";
import {
  siteConfig,
  getDefaultMetadata,
  getProductMetadata,
  getCategoryMetadata,
  getHomeMetadata,
  getProductsListingMetadata,
  getCategoriesListingMetadata,
  getAuthMetadata,
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

    it("should not set OG images (handled by opengraph-image.tsx convention)", () => {
      const metadata = getProductMetadata(mockProduct);

      // OG images are generated dynamically by opengraph-image.tsx (file convention),
      // so getProductMetadata should not set images directly.
      expect(metadata.openGraph?.images).toBeUndefined();
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

    it("should fallback to siteConfig description when no shortDesc or description", () => {
      const productWithoutDescriptions = {
        ...mockProduct,
        shortDesc: null,
        description: null,
      };
      const metadata = getProductMetadata(productWithoutDescriptions);
      expect(metadata.description).toBe(siteConfig.description);
    });

    it("should not set OG images even without product images", () => {
      const productWithoutImages = {
        ...mockProduct,
        images: undefined,
      };
      const metadata = getProductMetadata(productWithoutImages);
      // OG images handled by opengraph-image.tsx file convention
      expect(metadata.openGraph?.images).toBeUndefined();
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

    it("should use 'Browse' when productCount is undefined", () => {
      const categoryWithoutCount = {
        ...mockCategory,
        description: null,
        productCount: undefined,
      };
      const metadata = getCategoryMetadata(categoryWithoutCount);

      expect(metadata.description).toContain("Browse");
    });

    it("should use ogImage when category has no image", () => {
      const categoryWithoutImage = {
        ...mockCategory,
        image: null,
      };
      const metadata = getCategoryMetadata(categoryWithoutImage);

      expect(metadata.openGraph?.images).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: siteConfig.ogImage,
          }),
        ])
      );
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

    it("should use empty string when description is null", () => {
      const productWithoutDesc = { ...mockProduct, description: null };
      const jsonLd = getProductJsonLd(productWithoutDesc);
      expect(jsonLd.description).toBe("");
    });

    it("should use empty array when images is undefined", () => {
      const productWithoutImages = { ...mockProduct, images: undefined };
      const jsonLd = getProductJsonLd(productWithoutImages);
      expect(jsonLd.image).toEqual([]);
    });

    it("should handle product without category", () => {
      const productWithoutCategory = { ...mockProduct, category: undefined };
      const jsonLd = getProductJsonLd(productWithoutCategory);
      expect(jsonLd.category).toBeUndefined();
    });
  });

  describe("getHomeMetadata", () => {
    it("should return absolute title with store name", () => {
      const metadata = getHomeMetadata();

      expect(metadata.title).toEqual({
        absolute: expect.stringContaining(siteConfig.name),
      });
    });

    it("should include canonical URL", () => {
      const metadata = getHomeMetadata();
      expect(metadata.alternates?.canonical).toBe(siteConfig.url);
    });
  });

  describe("getProductsListingMetadata", () => {
    it("should return All Products title", () => {
      const metadata = getProductsListingMetadata();
      expect(metadata.title).toBe("All Products");
    });

    it("should include canonical URL with /products path", () => {
      const metadata = getProductsListingMetadata();
      expect(metadata.alternates?.canonical).toBe(`${siteConfig.url}/products`);
    });

    it("should include OpenGraph data", () => {
      const metadata = getProductsListingMetadata();
      expect(metadata.openGraph?.url).toBe(`${siteConfig.url}/products`);
    });
  });

  describe("getCategoriesListingMetadata", () => {
    it("should return Shop by Category title", () => {
      const metadata = getCategoriesListingMetadata();
      expect(metadata.title).toBe("Shop by Category");
    });

    it("should include canonical URL with /categories path", () => {
      const metadata = getCategoriesListingMetadata();
      expect(metadata.alternates?.canonical).toBe(`${siteConfig.url}/categories`);
    });
  });

  describe("getAuthMetadata", () => {
    it("should return Sign In title for login", () => {
      const metadata = getAuthMetadata("login");
      expect(metadata.title).toBe("Sign In");
    });

    it("should return Create Account title for register", () => {
      const metadata = getAuthMetadata("register");
      expect(metadata.title).toBe("Create Account");
    });

    it("should disable indexing for auth pages", () => {
      const metadata = getAuthMetadata("login");
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it("should include description mentioning store name", () => {
      const metadata = getAuthMetadata("login");
      expect(metadata.description).toContain(siteConfig.name);
    });
  });

  describe("getProductJsonLd with review data", () => {
    const mockProduct = {
      name: "Test Product",
      slug: "test-product",
      description: "A test product",
      price: "29.99",
      sku: "TEST-001",
      stock: 10,
      images: [{ url: "https://example.com/image.jpg" }],
      category: { name: "Electronics" },
    };
    const mockReviews = [
      {
        rating: 5,
        comment: "Excellent product!",
        authorName: "Jane Doe",
        createdAt: "2025-06-15T10:00:00.000Z",
      },
      {
        rating: 4,
        comment: null,
        authorName: "John Smith",
        createdAt: "2025-06-14T08:00:00.000Z",
      },
    ];

    it("omits review data when reviewCount is 0", () => {
      const result = getProductJsonLd({
        ...mockProduct,
        reviews: [],
        averageRating: 0,
        reviewCount: 0,
      });
      expect(result).not.toHaveProperty("aggregateRating");
      expect(result).not.toHaveProperty("review");
    });

    it("omits review data when reviewCount is undefined", () => {
      const result = getProductJsonLd(mockProduct);
      expect(result).not.toHaveProperty("aggregateRating");
      expect(result).not.toHaveProperty("review");
    });

    it("includes aggregateRating when reviews exist", () => {
      const result = getProductJsonLd({
        ...mockProduct,
        reviews: mockReviews,
        averageRating: 4.5,
        reviewCount: 2,
      });

      expect(result.aggregateRating).toBeDefined();
      expect(result.aggregateRating["@type"]).toBe("AggregateRating");
      expect(result.aggregateRating.ratingValue).toBe("4.5");
      expect(result.aggregateRating.reviewCount).toBe(2);
      expect(result.aggregateRating.bestRating).toBe(5);
      expect(result.aggregateRating.worstRating).toBe(1);
    });

    it("includes individual reviews with ratings and authors", () => {
      const result = getProductJsonLd({
        ...mockProduct,
        reviews: mockReviews,
        averageRating: 4.5,
        reviewCount: 2,
      });

      expect(result.review).toHaveLength(2);
      expect(result.review[0]["@type"]).toBe("Review");
      expect(result.review[0].reviewRating.ratingValue).toBe(5);
      expect(result.review[0].author.name).toBe("Jane Doe");
      expect(result.review[0].reviewBody).toBe("Excellent product!");
      expect(result.review[0].datePublished).toBe("2025-06-15");
    });

    it("omits reviewBody when comment is null", () => {
      const result = getProductJsonLd({
        ...mockProduct,
        reviews: mockReviews,
        averageRating: 4.5,
        reviewCount: 2,
      });

      expect(result.review[1]).not.toHaveProperty("reviewBody");
    });

    it("limits to 10 reviews maximum", () => {
      const manyReviews = Array.from({ length: 15 }, (_, i) => ({
        rating: 5,
        comment: `Review ${i}`,
        authorName: `User ${i}`,
        createdAt: "2025-06-15T10:00:00.000Z",
      }));

      const result = getProductJsonLd({
        ...mockProduct,
        reviews: manyReviews,
        averageRating: 5,
        reviewCount: 15,
      });
      expect(result.review).toHaveLength(10);
    });

    it("formats averageRating to one decimal place", () => {
      const result = getProductJsonLd({
        ...mockProduct,
        reviews: mockReviews,
        averageRating: 4.333333,
        reviewCount: 2,
      });
      expect(result.aggregateRating.ratingValue).toBe("4.3");
    });

    it("includes both offer and review data in single Product schema", () => {
      const result = getProductJsonLd({
        ...mockProduct,
        reviews: mockReviews,
        averageRating: 4.5,
        reviewCount: 2,
      });

      // Single Product schema with all data
      expect(result["@type"]).toBe("Product");
      expect(result.offers).toBeDefined();
      expect(result.aggregateRating).toBeDefined();
      expect(result.review).toBeDefined();
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
