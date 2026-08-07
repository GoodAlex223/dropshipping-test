import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/stripe";
import { getDeliveryMethod } from "@/lib/shipping";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { checkoutSchema } from "@/lib/validations";
import { z } from "zod";

// No-prepayment COD order creation (spec §4). Guest-capable: session optional.
// The dormant Stripe path (create-payment-intent + confirm-order) is untouched.
const createOrderSchema = checkoutSchema.extend({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const deliveryMethod = getDeliveryMethod(data.shippingMethod);
    if (!deliveryMethod) {
      return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });
    }

    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { variants: true },
    });

    // Prices always come from the DB — the client payload is never trusted.
    let subtotal = 0;
    const orderItemsData: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      productSku: string;
      variantInfo?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      let price = Number(product.price);
      let variantInfo: string | undefined;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          if (variant.price) price = Number(variant.price);
          variantInfo = `${variant.name}: ${variant.value}`;
        }
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        variantId: item.variantId,
        productName: product.name,
        productSku: product.sku,
        variantInfo,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
      });
    }

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: "No valid items in order" }, { status: 400 });
    }

    const shippingCost = deliveryMethod.price;
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session?.user?.id || null,
          email: data.email,
          phone: data.shippingAddress.phone,
          status: "PENDING",
          subtotal,
          shippingCost,
          tax,
          total,
          shippingAddress: data.shippingAddress,
          shippingMethod: data.shippingMethod,
          paymentMethod: "cod",
          paymentStatus: "PENDING",
          customerNotes: data.customerNotes,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              productSku: item.productSku,
              variantInfo: item.variantInfo,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of data.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    sendOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      email: data.email,
      items: orderItemsData.map((item) => ({
        productName: item.productName,
        variantInfo: item.variantInfo,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal,
      shippingCost,
      tax,
      total,
      shippingAddress: data.shippingAddress,
      shippingMethod: data.shippingMethod,
    }).catch(() => {
      // Email failure is non-critical — order is already created
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid order data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
