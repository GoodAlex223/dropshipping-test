import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return apiError("Confirmation token is required", 400);
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { confirmationToken: token },
    });

    if (!subscriber) {
      return apiError("Invalid confirmation link", 404);
    }

    if (subscriber.status === "ACTIVE") {
      return apiSuccess({ message: "Your subscription is already confirmed" });
    }

    if (!subscriber.confirmationExpiry || subscriber.confirmationExpiry < new Date()) {
      return apiError("This confirmation link has expired. Please subscribe again.", 410);
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        subscribedAt: new Date(),
        confirmationToken: null,
        confirmationExpiry: null,
      },
    });

    return apiSuccess({ message: "Your subscription has been confirmed" });
  } catch {
    return apiError("Failed to confirm subscription", 500);
  }
}
