export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Package, Truck, Shield, CreditCard } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/products";

const features = [
  {
    icon: Package,
    title: "Wide Selection",
    description: "Browse thousands of products across multiple categories.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Quick delivery from our trusted supplier network.",
  },
  {
    icon: Shield,
    title: "Secure Shopping",
    description: "Your data and payments are always protected.",
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    description: "Multiple payment options for your convenience.",
  },
];

async function getFeaturedProducts() {
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
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal to string for serialization
  return products.map((p) => ({
    ...p,
    price: p.price.toString(),
    comparePrice: p.comparePrice?.toString() ?? null,
  }));
}

async function getCategories() {
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
    take: 4,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories;
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="from-muted/50 to-background bg-gradient-to-b">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Welcome to Our Store
            </h1>
            <p className="text-muted-foreground mt-6 text-lg">
              Discover amazing products at great prices. Quality items delivered right to your door.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Why Shop With Us
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="container py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            <Link href="/categories" className="text-primary text-sm font-medium hover:underline">
              View all
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="bg-muted relative aspect-[16/9]">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="from-primary/20 to-primary/5 flex h-full items-center justify-center bg-gradient-to-br">
                        <Package className="text-primary/50 h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="group-hover:text-primary font-medium">{category.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {category._count.products} products
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
            <Link
              href="/products?featured=true"
              className="text-primary text-sm font-medium hover:underline"
            >
              View all
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="col-span-full py-12 text-center">
                <Package className="text-muted-foreground mx-auto h-12 w-12" />
                <p className="text-muted-foreground mt-4">No featured products yet.</p>
                <Link href="/products">
                  <Button variant="outline" className="mt-4">
                    Browse All Products
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to Start Shopping?
          </h2>
          <p className="text-muted-foreground mt-4">
            Create an account to save your favorites and track your orders.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg">Create Account</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="lg">
                Continue as Guest
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
