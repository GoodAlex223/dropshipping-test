import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSeedPassword } from "../../prisma/seed-data/users";

// G17 / F1 (HIGH, 3/3 panel): the seeded ADMIN password was a source-controlled
// literal ("admin123") that prisma/seed.ts bcrypt-hashed into an unconditional
// Role.ADMIN upsert, and the same pair was republished in the PUBLIC repo's
// README. Documented SEED_ALLOW_REMOTE=1 runs against the prod Neon endpoint
// (DONE.md, TODO.md) mean it was a live production admin login discoverable by
// reading README.md. The test customers are the same class: their published
// passwords hand an attacker the customer account that F2's stored-XSS chain
// lists as its first precondition.
//
// These tests fail against the pre-fix tree and are the regression guard.

const repoRoot = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(repoRoot, rel), "utf8");

// Every plaintext credential the seed used to carry, as published.
const LEAKED_SECRETS = ["admin123", "customer123", "password123"];

// Every LIVE doc, discovered rather than listed.
//
// PR #43 review finding 7: this was a hardcoded three-entry list, and the same
// PR added a live plan doc that republished all three passwords verbatim — in
// neither the swept set nor the exemption class. The invariant this test states
// ("no live doc republishes a seed password") is only worth stating if it is
// checked against every live doc, so the set is derived now.
//
// The exemption is narrow and deliberate: `docs/archive/**` and DONE.md are a
// historical record of what was true at the time, and rewriting them would hide
// the exposure rather than close it — rotation is what makes those inert. Note
// BACKLOG.md is NOT exempt: it is a live working doc, not a historical one.
const EXEMPT_HISTORICAL = new Set(["docs/planning/DONE.md"]);

function discoverLiveDocs(): string[] {
  return execFileSync("git", ["ls-files", "*.md"], { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((file) => !file.startsWith("docs/archive/") && !EXEMPT_HISTORICAL.has(file));
}

const LIVE_DOCS = discoverLiveDocs();

describe("seed credentials are not hard-coded (G17 F1)", () => {
  // Both seed files, not just the data module: the first version of this guard
  // checked only seed-data/users.ts and missed a second hard-coded copy in
  // seed.ts's summary block, which `tsc` caught rather than this test.
  it.each(["prisma/seed-data/users.ts", "prisma/seed.ts"])(
    "%s carries no plaintext password literal",
    (file) => {
      const source = read(file);
      for (const secret of LEAKED_SECRETS) {
        expect(source, `"${secret}" is still a literal in ${file}`).not.toContain(secret);
      }
      // Belt and braces: no `password:` data field at all on the seed users.
      expect(source).not.toMatch(/^\s*password:\s*["'`]/m);
    }
  );

  it("discovers the live docs rather than trusting a hardcoded list", () => {
    // An empty or tiny set would make the sweep below vacuously pass.
    expect(LIVE_DOCS.length).toBeGreaterThan(10);
    expect(LIVE_DOCS).toContain("README.md");
    expect(LIVE_DOCS).not.toContain("docs/planning/DONE.md");
  });

  it("no live doc republishes a seed password", () => {
    for (const doc of LIVE_DOCS) {
      const source = read(doc);
      for (const secret of LEAKED_SECRETS) {
        expect(source, `${doc} still publishes "${secret}"`).not.toContain(secret);
      }
    }
  });
});

describe("resolveSeedPassword (G17 F1)", () => {
  const generate = () => "generated-value";

  it("uses the environment value when one is set", () => {
    expect(resolveSeedPassword("from-env", { isLocalHost: true, generate })).toBe("from-env");
    expect(resolveSeedPassword("from-env", { isLocalHost: false, generate })).toBe("from-env");
  });

  it("generates a value for local development when the env var is unset", () => {
    expect(resolveSeedPassword(undefined, { isLocalHost: true, generate })).toBe("generated-value");
    expect(resolveSeedPassword("", { isLocalHost: true, generate })).toBe("generated-value");
  });

  it("refuses to invent a password for a non-local database", () => {
    // The failure mode this closes: a remote seed silently planting an account
    // whose password nobody chose and nobody knows to rotate.
    expect(() => resolveSeedPassword(undefined, { isLocalHost: false, generate })).toThrow(
      /SEED_ADMIN_PASSWORD/
    );
    expect(() => resolveSeedPassword("", { isLocalHost: false, generate })).toThrow(
      /SEED_ADMIN_PASSWORD/
    );
  });

  it("rejects a whitespace-only environment value rather than seeding it", () => {
    expect(() => resolveSeedPassword("   ", { isLocalHost: false, generate })).toThrow(
      /SEED_ADMIN_PASSWORD/
    );
  });
});
