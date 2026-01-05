import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/products/${product.slug}`}>
        <div className="bg-muted relative aspect-square overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="text-muted-foreground h-12 w-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && (
              <Badge variant="destructive" className="text-xs">
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
