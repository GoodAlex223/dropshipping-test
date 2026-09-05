import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { orderLookupSchema } from "@/lib/validations";
import {
  LOOKUP_LOCK_MS,
  LOOKUP_MAX_FAILURES,
  emailsMatch,
  setOrderGrantCookie,
} from "@/lib/order-access";

// Guest order lookup (G18 spec §2). Public: the order-number + e-mail pair is
// the credential. Unknown number and wrong e-mail answer identically, so the
// route is not an existence oracle; the per-order lockout is the only
// throttle — per-IP limits are a platform decision (prod has no Redis).
export async function POST(request: NextRequest) {
  try {
    // A malformed body is the caller's error, not ours — 400, never a bare 500.
    const body = await request.json().catch(() => null);
    const parsed = orderLookupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid lookup data", 400, "VALIDATION_ERROR");
    }
    const { orderNumber, email } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, email: true, lookupFailedAttempts: true, lookupLockedUntil: true },
    });
    if (!order) {
      return apiError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    const now = new Date();
    if (order.lookupLockedUntil && order.lookupLockedUntil > now) {
      const retryAfterSeconds = Math.ceil(
        (order.lookupLockedUntil.getTime() - now.getTime()) / 1000
      );
      return NextResponse.json(
        { error: "Too many attempts", code: "TOO_MANY_ATTEMPTS", retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    // Count the attempt BEFORE comparing, so a concurrent burst cannot all
    // compare against a pre-read counter of 0 (final review, G18). The lock
    // decision reads the RETURNED count, never the pre-read value.
    const attempt = await prisma.order.update({
      where: { id: order.id },
      data: { lookupFailedAttempts: { increment: 1 } },
      select: { lookupFailedAttempts: true },
    });

    const lockedUntil = new Date(now.getTime() + LOOKUP_LOCK_MS);
    if (attempt.lookupFailedAttempts > LOOKUP_MAX_FAILURES) {
      // Past the cap without a lock on the row yet — only a concurrent burst
      // gets here. Lock now and refuse without comparing.
      await prisma.order.update({
        where: { id: order.id },
        data: { lookupFailedAttempts: 0, lookupLockedUntil: lockedUntil },
      });
      const retryAfterSeconds = Math.ceil(LOOKUP_LOCK_MS / 1000);
      return NextResponse.json(
        { error: "Too many attempts", code: "TOO_MANY_ATTEMPTS", retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    if (!emailsMatch(order.email, email)) {
      if (attempt.lookupFailedAttempts >= LOOKUP_MAX_FAILURES) {
        await prisma.order.update({
          where: { id: order.id },
          data: { lookupFailedAttempts: 0, lookupLockedUntil: lockedUntil },
        });
      }
      return apiError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    // Success: the attempt above counted this request, so always undo it and
    // clear any expired lock.
    await prisma.order.update({
      where: { id: order.id },
      data: { lookupFailedAttempts: 0, lookupLockedUntil: null },
    });

    const response = apiSuccess({ orderNumber });
    setOrderGrantCookie(response, orderNumber, request);
    return response;
  } catch {
    return apiError("Lookup failed", 500, "LOOKUP_FAILED");
  }
}
