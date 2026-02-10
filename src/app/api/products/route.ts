import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

function getPagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// GET /api/products - Public product listing
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = getPagination(searchParams);

    // Filters
    const search = searchParams.get("search") || "";
    const categorySlug = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause - only active products
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { shortDesc: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (minPrice) {
      where.price = { ...((where.price as object) || {}), gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...((where.price as object) || {}), lte: parseFloat(maxPrice) };
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    // Build order by
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const validSortFields = ["name", "price", "createdAt"];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.ProductOrderByWithRelationInput] =
        sortOrder === "asc" ? "asc" : "desc";
    }

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          price: true,
          comparePrice: true,
          stock: true,
          isFeatured: true,
          category: { select: { id: true, name: true, slug: true } },
          images: {
            select: { id: true, url: true, alt: true },
            orderBy: { position: "asc" },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
