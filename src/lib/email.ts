import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "noreply@yourdomain.com";
const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Store";

// Create a mock resend for development when no API key is set
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface OrderEmailData {
  orderNumber: string;
  email: string;
  items: Array<{
    productName: string;
    variantInfo?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  shippingMethod: string;
}

function generateOrderConfirmationHtml(data: OrderEmailData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500;">${item.productName}</div>
          ${item.variantInfo ? `<div style="color: #6b7280; font-size: 14px;">${item.variantInfo}</div>` : ""}
          <div style="color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">
          $${item.totalPrice.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  const addressHtml = `
    ${data.shippingAddress.name}<br>
    ${data.shippingAddress.company ? `${data.shippingAddress.company}<br>` : ""}
    ${data.shippingAddress.line1}<br>
    ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ""}
    ${data.shippingAddress.city}${data.shippingAddress.state ? `, ${data.shippingAddress.state}` : ""} ${data.shippingAddress.postalCode}<br>
    ${data.shippingAddress.country}
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #1f2937; margin: 0;">${storeName}</h1>
  </div>

  <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
    <div style="width: 48px; height: 48px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: white; font-size: 24px;">✓</span>
    </div>
    <h2 style="margin: 0 0 8px 0; color: #1f2937;">Order Confirmed!</h2>
    <p style="margin: 0; color: #6b7280;">Thank you for your order</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 32px;">
    <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
    <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600;">${data.orderNumber}</p>
  </div>

  <h3 style="margin: 0 0 16px 0; font-size: 16px;">Order Summary</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    ${itemsHtml}
  </table>

  <table style="width: 100%; margin-bottom: 32px;">
    <tr>
      <td style="color: #6b7280;">Subtotal</td>
      <td style="text-align: right;">$${data.subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="color: #6b7280;">Shipping</td>
      <td style="text-align: right;">$${data.shippingCost.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="color: #6b7280;">Tax</td>
      <td style="text-align: right;">$${data.tax.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="border-top: 1px solid #e5e7eb; padding-top: 12px; font-weight: 600;">Total</td>
      <td style="border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: right; font-weight: 600;">$${data.total.toFixed(2)}</td>
    </tr>
  </table>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
    <div>
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Shipping Address</h3>
      <p style="margin: 0; font-size: 14px;">
        ${addressHtml}
      </p>
    </div>
    <div>
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Shipping Method</h3>
      <p style="margin: 0; font-size: 14px; text-transform: capitalize;">
        ${data.shippingMethod.replace("_", " ")} Shipping
      </p>
    </div>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; text-align: center;">
    <p style="margin: 0 0 16px 0; color: #6b7280;">
      We'll send you a shipping confirmation email when your order is on its way.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders" style="display: inline-block; background-color: #1f2937; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
      View Order Status
    </a>
  </div>

  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">Questions? Contact our support team</p>
    <p style="margin: 8px 0 0 0;">${storeName}</p>
  </div>
</body>
</html>
  `;
}

export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; error?: string }> {
  // Skip sending in development if no API key
  if (!resend) {
    console.log("Skipping email send - RESEND_API_KEY not configured");
    console.log("Would send order confirmation to:", data.email);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: data.email,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html: generateOrderConfirmationHtml(data),
    });

    if (error) {
      console.error("Failed to send order confirmation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
