import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import {
  requireAdmin,
  apiError,
  apiSuccess,
  getPagination,
  paginatedResponse,
  generateSlug,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/admin/categories - List categories
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get("all") === "true";

    // If all=true, return all categories for dropdowns
    if (all) {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, parentId: true },
        orderBy: { name: "asc" },
      });
      return apiSuccess(categories);
    }

    const { page, limit, skip } = getPagination(searchParams);
    const search = searchParams.get("search") || "";
    const parentId = searchParams.get("parentId");
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: Prisma.CategoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (parentId === "null") {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { products: true, children: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    return apiSuccess(paginatedResponse(categories, total, { page, limit, skip }));
  } catch (err) {
    console.error("Error fetching categories:", err);
    return apiError("Failed to fetch categories", 500);
  }
}

// POST /api/admin/categories - Create category
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const validationResult = categorySchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(validationResult.error.issues[0].message, 400);
    }

    const data = validationResult.data;

    // Check if slug is unique
    let slug = data.slug || generateSlug(data.name);
    const existingSlug = await prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Verify parent exists if provided
    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) {
        return apiError("Parent category not found", 400);
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
        isActive: data.isActive,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true, children: true } },
      },
    });

    return apiSuccess(category, 201);
  } catch (err) {
    console.error("Error creating category:", err);
    return apiError("Failed to create category", 500);
  }
}
