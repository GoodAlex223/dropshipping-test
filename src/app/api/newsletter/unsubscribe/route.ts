import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { unsubscribeNewsletterSchema } from "@/lib/validations";
import { generateUnsubscribeToken } from "@/lib/newsletter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = unsubscribeNewsletterSchema.safeParse(body);

    if (!result.success) {
      return apiError(result.error.issues[0].message, 400);
    }

    const { email, token } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const subscriber = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (!subscriber) {
      return apiError("Subscriber not found", 404);
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return apiSuccess({ message: "You are already unsubscribed" });
    }

    // Verify HMAC token matches
    const expectedToken = generateUnsubscribeToken(subscriber.id);
    if (token !== expectedToken) {
      return apiError("Invalid unsubscribe link", 400);
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    return apiSuccess({ message: "You have been unsubscribed successfully" });
  } catch (err) {
    console.error("Newsletter unsubscribe error:", err);
    return apiError("Failed to process unsubscribe", 500);
  }
}
