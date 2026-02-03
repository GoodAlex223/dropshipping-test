/**
 * Cached database queries using React's cache() for request deduplication.
 *
 * React.cache() deduplicates identical calls within the same request,
 * eliminating redundant queries between generateMetadata() and page components.
 *
 * @see https://react.dev/reference/react/cache
 */
import { cache } from "react";
import { prisma } from "./db";

/**
 * Cached product fetch by slug.
 * Used in product detail page and metadata generation.
 */
export const getCachedProduct = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      shortDesc: true,
      metaTitle: true,
      metaDesc: true,
      price: true,
      comparePrice: true,
      stock: true,
      sku: true,
      isFeatured: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
          alt: true,
        },
        orderBy: { position: "asc" },
      },
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stock: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) return null;

  // Get related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.category.id,
      isActive: true,
      id: { not: product.id },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDesc: true,
      price: true,
      comparePrice: true,
      stock: true,
      isFeatured: true,
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      images: {
        select: {
          url: true,
          alt: true,
        },
        orderBy: { position: "asc" },
        take: 1,
      },
    },
    take: 4,
  });

  return {
    ...product,
    price: product.price.toString(),
    comparePrice: product.comparePrice?.toString() ?? null,
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price?.toString() ?? product.price.toString(),
      sku: v.sku ?? product.sku,
      options: {},
    })),
    relatedProducts: relatedProducts.map((p) => ({
      ...p,
      price: p.price.toString(),
      comparePrice: p.comparePrice?.toString() ?? null,
    })),
  };
});

/**
 * Cached category fetch by slug.
 * Used in category page and metadata generation.
 */
export const getCachedCategory = cache(async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          products: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  return category;
});

/**
 * Cached featured products fetch.
 * Used in homepage.
 */
export const getCachedFeaturedProducts = cache(async (limit: number = 8) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDesc: true,
      price: true,
      comparePrice: true,
      stock: true,
      isFeatured: true,
      category: { select: { name: true, slug: true } },
      images: {
        select: { url: true, alt: true },
        orderBy: { position: "asc" },
        take: 1,
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    ...p,
    price: p.price.toString(),
    comparePrice: p.comparePrice?.toString() ?? null,
  }));
});

/**
 * Cached top-level categories fetch.
 * Used in homepage and navigation.
 */
export const getCachedCategories = cache(async (limit: number = 4) => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      _count: {
        select: {
          products: { where: { isActive: true } },
        },
      },
    },
    take: limit,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories;
});
