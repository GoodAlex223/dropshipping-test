import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validations";
import { requireAdmin, apiError, apiSuccess, generateSlug } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true, code: true } },
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
        _count: { select: { orderItems: true, cartItems: true } },
      },
    });

    if (!product) {
      return apiError("Product not found", 404);
    }

    return apiSuccess(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    return apiError("Failed to fetch product", 500);
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return apiError("Product not found", 404);
    }

    // Validate input
    const validationResult = productSchema.partial().safeParse(body);
    if (!validationResult.success) {
      return apiError(validationResult.error.issues[0].message, 400);
    }

    const data = validationResult.data;

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existingProduct.slug) {
      const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        return apiError("Slug already exists", 400);
      }
    }

    // Auto-generate slug if name changed but slug not provided
    let slug = data.slug;
    if (data.name && !data.slug && data.name !== existingProduct.name) {
      slug = generateSlug(data.name);
      const existingSlug = await prisma.product.findUnique({ where: { slug } });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) {
        return apiError("SKU already exists", 400);
      }
    }

    // Verify category exists if changed
    if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        return apiError("Category not found", 400);
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.shortDesc !== undefined && { shortDesc: data.shortDesc }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.comparePrice !== undefined && { comparePrice: data.comparePrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sku && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.mpn !== undefined && { mpn: data.mpn }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true, code: true } },
        images: { orderBy: { position: "asc" } },
      },
    });

    return apiSuccess(product);
  } catch (err) {
    console.error("Error updating product:", err);
    return apiError("Failed to update product", 500);
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: { select: { orderItems: true, cartItems: true } },
      },
    });

    if (!product) {
      return apiError("Product not found", 404);
    }

    // Check if product has orders
    if (product._count.orderItems > 0) {
      return apiError(
        "Cannot delete product with existing orders. Consider deactivating it instead.",
        400
      );
    }

    // Delete product (cascades to images, variants, cart items)
    await prisma.product.delete({ where: { id } });

    return apiSuccess({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    return apiError("Failed to delete product", 500);
  }
}
