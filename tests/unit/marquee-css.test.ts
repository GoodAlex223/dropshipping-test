import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// G8 TASK-059: the marquee must rejoin the repo's reduced-motion reset —
// a surface override that isn't named in the reset silently keeps animating
// for reduced-motion users. jsdom can't see compiled CSS, so this asserts
// against the source; the visual gate checks the compiled output.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const reduceIdx = css.indexOf("@media (prefers-reduced-motion: reduce)");
const beforeReduce = css.slice(0, reduceIdx);
const afterReduce = css.slice(reduceIdx);

describe("marquee CSS", () => {
  it("still has the reduced-motion block (guards the slices below from vacuity)", () => {
    expect(reduceIdx).toBeGreaterThan(-1);
  });

  it("defines the marquee animation before the reduced-motion reset", () => {
    expect(beforeReduce).toContain("@keyframes mirox-marquee");
    expect(beforeReduce).toMatch(/\.animate-marquee\s*\{[^}]*animation:\s*mirox-marquee/);
  });

  it("pauses on hover and keyboard focus", () => {
    expect(beforeReduce).toMatch(
      /\.animate-marquee:hover,\s*\.animate-marquee:focus-within\s*\{[^}]*animation-play-state:\s*paused/
    );
  });

  it("rejoins the reduced-motion reset", () => {
    expect(afterReduce).toMatch(/\.animate-marquee\s*\{[^}]*animation:\s*none/);
    expect(afterReduce).toMatch(/\.marquee-duplicate\s*\{[^}]*display:\s*none/);
  });
});
