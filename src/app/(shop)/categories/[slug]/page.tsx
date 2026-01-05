import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCategoryMetadata, getBreadcrumbJsonLd, siteConfig } from "@/lib/seo";
import { CategoryClient, CategoryNotFound, type Category } from "./category-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string): Promise<Category | null> {
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

  if (!category) return null;

  return category;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return getCategoryMetadata({
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    productCount: category._count?.products,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return <CategoryNotFound />;
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: siteConfig.url },
    { name: "Categories", url: `${siteConfig.url}/categories` },
  ];

  if (category.parent) {
    breadcrumbItems.push({
      name: category.parent.name,
      url: `${siteConfig.url}/categories/${category.parent.slug}`,
    });
  }

  breadcrumbItems.push({
    name: category.name,
    url: `${siteConfig.url}/categories/${category.slug}`,
  });

  const breadcrumbJsonLd = getBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <CategoryClient category={category} />
    </>
  );
}
