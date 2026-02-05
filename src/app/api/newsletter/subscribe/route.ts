import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { subscribeNewsletterSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";
import {
  generateConfirmationToken,
  getTokenExpiry,
  getConfirmationUrl,
  getUnsubscribeUrl,
} from "@/lib/newsletter";
import { sendNewsletterConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = subscribeNewsletterSchema.safeParse(body);

    if (!result.success) {
      return apiError(result.error.issues[0].message, 400);
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing?.status === "ACTIVE") {
      return apiError("This email is already subscribed", 409);
    }

    const token = generateConfirmationToken();
    const expiry = getTokenExpiry();

    let subscriberId: string;

    if (existing) {
      // Re-subscribe: update token and reset to PENDING
      await prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          confirmationToken: token,
          confirmationExpiry: expiry,
          unsubscribedAt: null,
        },
      });
      subscriberId = existing.id;
    } else {
      try {
        const created = await prisma.subscriber.create({
          data: {
            email: normalizedEmail,
            confirmationToken: token,
            confirmationExpiry: expiry,
          },
        });
        subscriberId = created.id;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // Race condition: another request created the subscriber between our check and insert
          return apiSuccess(
            { message: "Please check your email to confirm your subscription" },
            201
          );
        }
        throw err;
      }
    }

    const confirmationUrl = getConfirmationUrl(token);
    const unsubscribeUrl = getUnsubscribeUrl(normalizedEmail, subscriberId);
    const emailResult = await sendNewsletterConfirmationEmail({
      email: normalizedEmail,
      confirmationUrl,
      unsubscribeUrl,
    });

    if (!emailResult.success) {
      console.error("Failed to send confirmation email:", emailResult.error);
    }

    return apiSuccess({ message: "Please check your email to confirm your subscription" }, 201);
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return apiError("Failed to process subscription", 500);
  }
}
