import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAdmin, apiError } from "@/lib/api-utils";

// GET /api/admin/newsletter/export - Export subscribers as CSV
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: Prisma.SubscriberWhereInput = {};
    if (status && status !== "all") {
      where.status = status as Prisma.EnumSubscriberStatusFilter;
    }

    const subscribers = await prisma.subscriber.findMany({
      where,
      select: {
        email: true,
        status: true,
        subscribedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = ["Email", "Status", "Subscribed At", "Created At"];
    const rows = subscribers.map((sub) => [
      sub.email,
      sub.status,
      sub.subscribedAt ? sub.subscribedAt.toISOString() : "",
      sub.createdAt.toISOString(),
    ]);

    // Escape CSV cells: double internal quotes & prevent formula injection
    function escapeCsvCell(cell: string): string {
      const escaped = cell.replace(/"/g, '""');
      // Prefix formula-triggering characters with a single quote
      if (/^[=+\-@\t\r]/.test(escaped)) {
        return `"'${escaped}"`;
      }
      return `"${escaped}"`;
    }

    const csv = [headers.join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))].join(
      "\n"
    );

    const filename = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return apiError("Failed to export subscribers", 500);
  }
}
