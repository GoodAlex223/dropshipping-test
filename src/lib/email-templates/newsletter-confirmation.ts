import { escapeHtml } from "@/lib/newsletter";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Store";

export function generateNewsletterConfirmationHtml(data: {
  email: string;
  confirmationUrl: string;
  unsubscribeUrl?: string;
}): string {
  const safeEmail = escapeHtml(data.email);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Subscription</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #1f2937; margin: 0;">${storeName}</h1>
  </div>

  <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
    <h2 style="margin: 0 0 16px 0; color: #1f2937;">Confirm Your Subscription</h2>
    <p style="margin: 0; color: #6b7280;">
      You requested to subscribe to our newsletter with this email: <strong>${safeEmail}</strong>
    </p>
  </div>

  <div style="margin-bottom: 32px;">
    <p style="margin: 0 0 16px 0;">
      Click the button below to confirm your subscription and start receiving our latest updates,
      exclusive offers, and news.
    </p>
    <div style="text-align: center;">
      <a href="${data.confirmationUrl}"
         style="display: inline-block; background-color: #1f2937; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500;">
        Confirm Subscription
      </a>
    </div>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      <strong>Didn't request this?</strong> You can safely ignore this email.
      This link will expire in 24 hours.
    </p>
  </div>

  <div style="padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>${data.unsubscribeUrl ? `\n    <p style="margin: 8px 0 0 0;"><a href="${data.unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a></p>` : ""}
  </div>
</body>
</html>
  `.trim();
}
