import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getProductMetadata, getProductJsonLd, getBreadcrumbJsonLd, siteConfig } from "@/lib/seo";
import { ProductDetailClient, ProductNotFound, type Product } from "./product-detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
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

  // Fetch reviews and stats
  const [reviews, reviewStats, reviewDistribution] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id, isHidden: false },
      select: {
        id: true,
        rating: true,
        comment: true,
        adminReply: true,
        adminRepliedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.review.aggregate({
      where: { productId: product.id, isHidden: false },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId: product.id, isHidden: false },
      _count: true,
    }),
  ]);

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviewDistribution.find((d) => d.rating === r)?._count ?? 0,
  }));

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
    reviews: reviews.map((r) => ({
      ...r,
      adminRepliedAt: r.adminRepliedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    averageRating: reviewStats._avg.rating ?? 0,
    totalReviews: reviewStats._count,
    ratingDistribution,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return getProductMetadata({
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDesc: product.shortDesc,
    metaTitle: product.metaTitle,
    metaDesc: product.metaDesc,
    price: product.price,
    comparePrice: product.comparePrice,
    category: product.category,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return <ProductNotFound />;
  }

  // Generate JSON-LD structured data (single Product schema with optional reviews)
  const productJsonLd = getProductJsonLd({
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    comparePrice: product.comparePrice,
    sku: product.sku,
    stock: product.stock,
    images: product.images,
    category: product.category,
    reviews: product.reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      authorName: r.user.name || "Anonymous",
      createdAt: r.createdAt,
    })),
    averageRating: product.averageRating,
    reviewCount: product.totalReviews,
  });

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "Home", url: siteConfig.url },
    { name: "Products", url: `${siteConfig.url}/products` },
    { name: product.category.name, url: `${siteConfig.url}/categories/${product.category.slug}` },
    { name: product.name, url: `${siteConfig.url}/products/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
