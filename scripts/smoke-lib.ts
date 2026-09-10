/**
 * Pure helpers for the post-deploy smoke script (scripts/smoke.ts).
 *
 * Everything here is a pure function over strings and plain objects: no fetch,
 * no filesystem, no module-scope side effects. tests/unit/smoke.test.ts imports
 * this file directly, so anything that ran at import time would run during the
 * unit suite.
 *
 * See docs/superpowers/specs/2026-09-10-g19-launch-runbook-deploy-verification-design.md
 */

const CSS_CHUNK_RE = /\/_next\/static\/css\/([a-z0-9]+)\.css/g;
const NEXT_ASSET_RE = /\/_next\/[^\s"'\\]*/g;
const PRODUCT_SLUG_RE = /\/products\/([a-z0-9][a-z0-9-]{2,})(?=["'?#\\/]|$)/g;
const IMAGE_PARAM_RE = /\/_next\/image\?url=([^"'&\s\\]+)/g;

/** Every distinct `/_next/static/css/<hash>.css` chunk hash, sorted. */
export function extractCssHashes(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(CSS_CHUNK_RE)) found.add(match[1]);
  return [...found].sort();
}

/**
 * Product slugs linked from server-rendered HTML.
 *
 * `/_next/**` is stripped FIRST and deliberately: the catalog page ships a
 * chunk named `/_next/static/chunks/app/(shop)/products/page-<hash>.js`, which
 * a naive match would report as the product "page-<hash>" — turning the
 * homepage's DB-backed assertion into one that passes on an empty catalog.
 */
export function extractProductSlugs(html: string): string[] {
  const withoutAssets = html.replace(NEXT_ASSET_RE, " ");
  const found = new Set<string>();
  for (const match of withoutAssets.matchAll(PRODUCT_SLUG_RE)) found.add(match[1]);
  return [...found].sort();
}

/**
 * The first absolute, off-origin image URL the page hands to /_next/image.
 *
 * Returns null when the page only optimises root-relative assets (the seeded
 * placeholder catalog) — the caller then skips the accept probe and says so,
 * rather than inventing a URL.
 */
export function findRemoteImageUrl(html: string, targetOrigin: string): string | null {
  let targetHost: string;
  try {
    targetHost = new URL(targetOrigin).host;
  } catch {
    return null;
  }

  for (const match of html.matchAll(IMAGE_PARAM_RE)) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(match[1]);
    } catch {
      continue;
    }
    if (!/^https?:\/\//i.test(decoded)) continue;
    try {
      if (new URL(decoded).host !== targetHost) return decoded;
    } catch {
      continue;
    }
  }
  return null;
}

export type StalenessOutcome = "CHANGED" | "UNCHANGED" | "NO-BASELINE" | "NO-CSS";

export interface SmokeStateEntry {
  cssHashes: string[];
  observedAt: string;
}

export interface SmokeState {
  [origin: string]: SmokeStateEntry;
}

/**
 * Three outcomes, not two. An absent baseline is NOT a pass: a check that
 * cannot fail looks exactly like one that passes, and this one guards a real
 * incident (Vercel served byte-identical stale CSS across two deploys).
 */
export function compareBaseline(observed: string[], stored: string[] | null): StalenessOutcome {
  // Checked FIRST. A page that served no stylesheet at all cannot be compared,
  // and calling that "CHANGED" would pass a deploy whose CSS vanished entirely —
  // the same "a check that cannot fail" trap NO-BASELINE guards, entered from
  // the observed side instead of the stored side.
  if (observed.length === 0) return "NO-CSS";
  if (stored === null || stored.length === 0) return "NO-BASELINE";
  const a = [...observed].sort().join(",");
  const b = [...stored].sort().join(",");
  return a === b ? "UNCHANGED" : "CHANGED";
}

export function stalenessPasses(outcome: StalenessOutcome, allowMissing: boolean): boolean {
  if (outcome === "CHANGED") return true;
  // NO-CSS is deliberately NOT waivable: --allow-missing-baseline excuses a
  // missing BASELINE, never a page that served no stylesheet.
  if (outcome === "NO-BASELINE") return allowMissing;
  return false;
}

export function readBaselineFor(state: SmokeState, origin: string): string[] | null {
  const entry = state[origin];
  return entry && Array.isArray(entry.cssHashes) ? entry.cssHashes : null;
}

export function mergeState(
  state: SmokeState,
  origin: string,
  cssHashes: string[],
  observedAt: string
): SmokeState {
  return { ...state, [origin]: { cssHashes: [...cssHashes].sort(), observedAt } };
}
