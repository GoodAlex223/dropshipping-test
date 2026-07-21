import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/products";
import { FadeIn } from "@/components/common/FadeIn";
import type { ProductCardData } from "@/lib/product-queries";

interface ProductRailProps {
  title: string;
  products: ProductCardData[];
  viewAllHref: string;
  viewAllLabel: string;
}

/**
 * A titled row of products. Renders nothing when empty, so a new store gets a
 * shorter coherent page rather than an empty rail.
 */
export function ProductRail({ title, products, viewAllHref, viewAllLabel }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="container py-16">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <Link
            href={viewAllHref}
            className="hover:text-muted-foreground text-sm font-medium transition-colors"
          >
            {viewAllLabel}
            <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
