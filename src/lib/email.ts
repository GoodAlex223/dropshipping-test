import { Resend } from "resend";
import { emails } from "@/content/emails";
import { generateNewsletterConfirmationHtml } from "./email-templates/newsletter-confirmation";
import {
  generateOrderConfirmationHtml,
  type OrderEmailData,
} from "./email-templates/order-confirmation";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "noreply@yourdomain.com";

// Create a mock resend for development when no API key is set
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type { OrderEmailData };

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
      subject: emails.order.subject(data.orderNumber),
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

export async function sendNewsletterConfirmationEmail(data: {
  email: string;
  confirmationUrl: string;
  unsubscribeUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("Skipping email send - RESEND_API_KEY not configured");
    console.log("Would send newsletter confirmation to:", data.email);
    console.log("Confirmation URL:", data.confirmationUrl);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: data.email,
      subject: emails.newsletter.subject(),
      html: generateNewsletterConfirmationHtml(data),
    });

    if (error) {
      console.error("Failed to send newsletter confirmation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending newsletter confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
