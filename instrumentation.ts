// Instrumentation file for Next.js
// This file is used to initialize Sentry on the server
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: Error,
  request: Request,
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  // Only log errors in production with Sentry configured
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(err, {
      extra: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        url: request.url,
        method: request.method,
      },
    });
  }
};
