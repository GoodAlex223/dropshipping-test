import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAdmin,
  apiError,
  apiSuccess,
  getPagination,
  paginatedResponse,
} from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

// GET /api/admin/customers - List customers
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = getPagination(searchParams);
    const search = searchParams.get("search") || "";

    // Build where clause - only show CUSTOMER role users
    const where: Prisma.UserWhereInput = {
      role: "CUSTOMER",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const totalSpent = await prisma.order.aggregate({
          where: { userId: customer.id },
          _sum: { total: true },
        });

        return {
          ...customer,
          totalSpent: totalSpent._sum.total?.toNumber() || 0,
          orderCount: customer._count.orders,
        };
      })
    );

    return apiSuccess(paginatedResponse(customersWithStats, total, { page, limit, skip }));
  } catch (err) {
    console.error("Error fetching customers:", err);
    return apiError("Failed to fetch customers", 500);
  }
}
