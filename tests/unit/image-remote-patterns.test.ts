import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// G17 / F6 (MEDIUM, 3/3 panel): images.remotePatterns allowed hostname "**", so
// the unauthenticated /_next/image endpoint would fetch ANY https URL
// server-side — an SSRF probe into the deployment's internal network and a
// bandwidth amplifier. Seeded product images are root-relative (public/), so
// the only host that ever needs allowing is the configured CDN/R2 origin.

const ORIGINAL = process.env.AWS_CLOUDFRONT_URL;

async function loadConfig() {
  vi.resetModules();
  const mod = await import("../../next.config.mjs");
  return mod.default;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AWS_CLOUDFRONT_URL;
  else process.env.AWS_CLOUDFRONT_URL = ORIGINAL;
});

// Loading next.config.mjs pulls in the next-intl plugin, which is slow on a
// cold module graph; the 5s default times out when the full suite is running
// all workers. Timeout is per-test, so this only reserves headroom.
const LOAD_TIMEOUT = 30_000;

describe("next.config images.remotePatterns (G17 F6)", () => {
  it(
    "never allows a wildcard hostname",
    async () => {
      process.env.AWS_CLOUDFRONT_URL = "https://cdn.example.net";
      const config = await loadConfig();
      const hostnames = (config.images?.remotePatterns ?? []).map(
        (p: { hostname: string }) => p.hostname
      );
      expect(hostnames).not.toContain("**");
      expect(hostnames).not.toContain("*");
      for (const h of hostnames) {
        expect(h, `"${h}" is a bare wildcard`).not.toMatch(/^\*+$/);
      }
    },
    LOAD_TIMEOUT
  );

  it(
    "allows the configured CDN host",
    async () => {
      process.env.AWS_CLOUDFRONT_URL = "https://pub-abc123.r2.dev";
      const config = await loadConfig();
      const hostnames = (config.images?.remotePatterns ?? []).map(
        (p: { hostname: string }) => p.hostname
      );
      expect(hostnames).toContain("pub-abc123.r2.dev");
    },
    LOAD_TIMEOUT
  );

  it(
    "tolerates a CDN url with a trailing slash or path",
    async () => {
      process.env.AWS_CLOUDFRONT_URL = "https://cdn.example.net/";
      const config = await loadConfig();
      const hostnames = (config.images?.remotePatterns ?? []).map(
        (p: { hostname: string }) => p.hostname
      );
      expect(hostnames).toContain("cdn.example.net");
    },
    LOAD_TIMEOUT
  );

  it(
    "allows no remote host at all when no CDN is configured",
    async () => {
      // Local development serves product images from public/ as root-relative
      // paths, which next/image handles without any remotePatterns entry. An
      // empty list is therefore correct, not a regression.
      delete process.env.AWS_CLOUDFRONT_URL;
      const config = await loadConfig();
      expect(config.images?.remotePatterns ?? []).toEqual([]);
    },
    LOAD_TIMEOUT
  );

  it(
    "ignores an unparsable CDN url rather than crashing the build",
    async () => {
      process.env.AWS_CLOUDFRONT_URL = "not a url";
      const config = await loadConfig();
      expect(config.images?.remotePatterns ?? []).toEqual([]);
    },
    LOAD_TIMEOUT
  );
});
