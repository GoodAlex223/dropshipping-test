import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IMAGE_SIZES } from "@/lib/image-utils";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDesc?: string | null;
    price: string | number;
    comparePrice?: string | number | null;
    stock: number;
    isFeatured?: boolean;
    category?: { name: string; slug: string };
    images: { url: string; alt?: string | null }[];
  };
  showCategory?: boolean;
}

export function ProductCard({ product, showCategory = true }: ProductCardProps) {
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
  const comparePrice = product.comparePrice
    ? typeof product.comparePrice === "string"
      ? parseFloat(product.comparePrice)
      : product.comparePrice
    : null;

  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <Card
      className="group hover-lift overflow-hidden shadow-[var(--shadow-soft)]"
      data-testid="product-card"
    >
      <Link href={`/products/${product.slug}`}>
        <div className="bg-muted relative aspect-square overflow-hidden">
          <ProductImage
            src={product.images[0]?.url}
            alt={product.images[0]?.alt || product.name}
            sizes={IMAGE_SIZES.productCard}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && (
              <Badge
                variant="default"
                className="rounded-none px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase"
              >
                -{discount}%
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary" className="text-xs">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        {showCategory && product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-muted-foreground hover:text-primary text-xs"
          >
            {product.category.name}
          </Link>
        )}

        <Link href={`/products/${product.slug}`}>
          <h3 className="hover:text-primary mt-1 line-clamp-2 leading-tight font-medium">
            {product.name}
          </h3>
        </Link>

        {product.shortDesc && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{product.shortDesc}</p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold">{formatPrice(price)}</span>
          {comparePrice && comparePrice > price && (
            <span className="text-muted-foreground text-sm line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          asChild
          variant={isOutOfStock ? "secondary" : "default"}
          className="w-full"
          size="sm"
        >
          <Link href={`/products/${product.slug}`}>
            {isOutOfStock ? "View Details" : "View Product"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
