/**
 * Web Vitals reporting to GA4 via GTM dataLayer.
 *
 * Reports Core Web Vitals (CLS, FID, LCP, FCP, TTFB, INP) to Google Analytics 4
 * through the existing GTM integration. Only reports when user has accepted
 * cookie consent.
 *
 * @see https://web.dev/vitals/
 * @see https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals
 */

/**
 * Web Vitals metric interface.
 * Compatible with both web-vitals library and Next.js useReportWebVitals.
 */
export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: string;
  id?: string;
  delta?: number;
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Report a Web Vitals metric to GA4 via GTM dataLayer.
 *
 * This function follows the existing analytics pattern in analytics.ts,
 * pushing events to window.dataLayer for GTM to forward to GA4.
 *
 * @param metric - Web Vitals metric from web-vitals library
 */
export function reportWebVitalsToGA4(metric: WebVitalsMetric): void {
  // Skip if running on server
  if (typeof window === "undefined") return;

  try {
    // Initialize dataLayer if not present
    window.dataLayer = window.dataLayer || [];

    // Push Web Vitals event to dataLayer
    // Uses same pattern as analytics.ts for consistency
    window.dataLayer.push({
      event: "web_vitals",
      // Metric identification
      metric_name: metric.name,
      metric_id: metric.id || "",
      // Metric value (rounded for cleaner data)
      // CLS is multiplied by 1000 for readability (standard practice)
      metric_value:
        metric.name === "CLS" ? Math.round(metric.value * 1000) : Math.round(metric.value),
      // Rating: "good", "needs-improvement", or "poor"
      metric_rating: metric.rating,
      // Navigation type context
      metric_navigation_type: getNavigationType(),
      // Delta since last report (useful for debugging)
      metric_delta: metric.delta ? Math.round(metric.delta) : 0,
    });
  } catch {
    // Silently fail if GTM is blocked or unavailable
    // This matches the error handling pattern in analytics.ts
  }
}

/**
 * Get the navigation type for context in metrics.
 * Helps distinguish between initial page loads and navigations.
 */
function getNavigationType(): string {
  if (typeof window === "undefined" || !window.performance) {
    return "unknown";
  }

  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (!navigation) {
    return "unknown";
  }

  return navigation.type || "unknown";
}

/**
 * Web Vitals metric thresholds based on Google's recommendations.
 * Used for logging and debugging purposes.
 *
 * @see https://web.dev/metrics/
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (ms)
  LCP: { good: 2500, needsImprovement: 4000 },
  // Cumulative Layout Shift (unitless)
  CLS: { good: 0.1, needsImprovement: 0.25 },
  // First Contentful Paint (ms)
  FCP: { good: 1800, needsImprovement: 3000 },
  // Time to First Byte (ms)
  TTFB: { good: 800, needsImprovement: 1800 },
  // Interaction to Next Paint (ms) - replaced FID in web-vitals v4
  INP: { good: 200, needsImprovement: 500 },
} as const;

/**
 * Check if a metric value is considered "good" based on Web Vitals thresholds.
 *
 * @param name - Metric name (LCP, FID, CLS, etc.)
 * @param value - Metric value
 * @returns "good" | "needs-improvement" | "poor"
 */
export function getMetricRating(
  name: keyof typeof WEB_VITALS_THRESHOLDS,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  if (!thresholds) return "poor";

  if (value <= thresholds.good) return "good";
  if (value <= thresholds.needsImprovement) return "needs-improvement";
  return "poor";
}
