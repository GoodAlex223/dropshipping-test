import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/seo";

// G17 / F2 (MEDIUM, 3/3 panel): customer-controlled review `comment` and
// `user.name` reach an inline <script type="application/ld+json"> through
// dangerouslySetInnerHTML. JSON.stringify escapes neither "<" nor "/", so a
// closing-script sequence in a review terminates the element and everything
// after it parses as HTML — stored XSS in the storefront origin, executing for
// any admin who opens the product page.

const CLOSE_SCRIPT = "</" + "script>";

describe("serializeJsonLd (G17 F2)", () => {
  it("escapes < so a review cannot close the script element", () => {
    const payload = { review: `${CLOSE_SCRIPT}<img src=x onerror=alert(1)>` };
    const out = serializeJsonLd(payload);

    expect(out).not.toContain("<");
    expect(out.toLowerCase()).not.toContain(CLOSE_SCRIPT);
    expect(out).toContain("\\u003c");
  });

  it("escapes > and & as well, so no HTML-significant character survives", () => {
    const out = serializeJsonLd({ v: "a > b && c < d" });
    expect(out).not.toContain(">");
    expect(out).not.toContain("&");
    expect(out).not.toContain("<");
  });

  it("escapes the U+2028/U+2029 separators that break inline script parsing", () => {
    const out = serializeJsonLd({ v: "a\u2028b\u2029c" });
    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });

  it("stays valid JSON that round-trips to the original value", () => {
    // The escaping must not corrupt the structured data Google consumes.
    const payload = {
      "@type": "Product",
      name: `Худі ${CLOSE_SCRIPT} & <b>bold</b>`,
      review: [{ body: "5 & 6 < 7", author: "Мар'я" }],
      rating: 4.5,
      nested: { deep: ["<a>", "&amp;"] },
    };
    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });

  it("leaves ordinary content untouched apart from the escapes", () => {
    expect(JSON.parse(serializeJsonLd({ name: "Олімпійка Mirox" }))).toEqual({
      name: "Олімпійка Mirox",
    });
  });
});

describe("no JSON-LD site bypasses the serializer (G17 F2)", () => {
  // Structural guard: the fix is only durable if the NEXT ld+json block added
  // to the app also goes through serializeJsonLd. A bare JSON.stringify inside
  // dangerouslySetInnerHTML is the exact shape of the original bug.
  const FILES = ["src/app/layout.tsx", "src/app/(shop)/products/[slug]/page.tsx"];

  it.each(FILES)("%s passes no bare JSON.stringify to dangerouslySetInnerHTML", (file) => {
    const source = readFileSync(join(__dirname, "..", "..", file), "utf8");
    expect(source).not.toMatch(/__html:\s*JSON\.stringify\(/);
  });
});
