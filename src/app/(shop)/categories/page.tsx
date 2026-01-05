import Link from "next/link";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

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
      description: true,
      image: true,
      children: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { products: { where: { isActive: true } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground mt-2">Browse our products by category</p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="text-muted-foreground h-16 w-16" />
          <h2 className="mt-4 text-xl font-semibold">No categories yet</h2>
          <p className="text-muted-foreground mt-2">Check back later for our product categories.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const totalProducts =
              category._count.products +
              category.children.reduce((sum, child) => sum + child._count.products, 0);

            return (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="bg-muted relative aspect-[16/9]">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="from-primary/20 to-primary/5 flex h-full items-center justify-center bg-gradient-to-br">
                        <Package className="text-primary/50 h-16 w-16" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h2 className="group-hover:text-primary text-xl font-semibold">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                        {category.description}
                      </p>
                    )}
                    <p className="text-primary mt-3 text-sm font-medium">
                      {totalProducts} {totalProducts === 1 ? "product" : "products"}
                    </p>

                    {/* Subcategories */}
                    {category.children.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {category.children.slice(0, 4).map((child) => (
                          <span
                            key={child.id}
                            className="bg-muted rounded-full px-3 py-1 text-xs font-medium"
                          >
                            {child.name}
                          </span>
                        ))}
                        {category.children.length > 4 && (
                          <span className="bg-muted rounded-full px-3 py-1 text-xs font-medium">
                            +{category.children.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
