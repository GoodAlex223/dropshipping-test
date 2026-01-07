// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only initialize Sentry if DSN is provided
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay configuration
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Add integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Set environment
  environment: process.env.NODE_ENV,

  // Ignore common errors that aren't actionable
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "canvas.contentDocument",
    // Network errors
    "NetworkError",
    "Network request failed",
    // Script loading errors
    "Script error",
    // Cancelled requests
    "AbortError",
    // React hydration errors (usually benign)
    "Hydration failed",
    "There was an error while hydrating",
  ],

  // Filter out transactions from certain URLs
  beforeSendTransaction(event) {
    // Don't send transactions for health check endpoints
    if (event.transaction?.includes("/api/health")) {
      return null;
    }
    return event;
  },
});
