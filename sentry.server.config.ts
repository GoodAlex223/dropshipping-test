// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only initialize Sentry if DSN is provided
  enabled: !!process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Set environment
  environment: process.env.NODE_ENV,

  // Ignore common errors that aren't actionable
  ignoreErrors: [
    // Network/connection errors
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    // Prisma connection errors during cold starts
    "Can't reach database server",
  ],

  // Add context to all events
  beforeSend(event, hint) {
    // Don't send events for expected errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore 404s and auth errors
      if (error.message.includes("NEXT_NOT_FOUND") || error.message.includes("Unauthorized")) {
        return null;
      }
    }
    return event;
  },
});
