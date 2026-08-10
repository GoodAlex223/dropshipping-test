import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: sendMock } })),
}));

import { getStoreName, emails } from "@/content/emails";
import {
  EMAIL_COLORS,
  renderButton,
  renderEmailShell,
  renderPanel,
} from "@/lib/email-templates/layout";

const originalEnv = { ...process.env };

function restoreEnvVar(key: string) {
  // Assigning undefined would store the literal string "undefined".
  if (originalEnv[key] === undefined) delete process.env[key];
  else process.env[key] = originalEnv[key];
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_STORE_NAME;
  delete process.env.RESEND_API_KEY;
  process.env.NEXT_PUBLIC_APP_URL = "https://test.example.com";
});

afterEach(() => {
  restoreEnvVar("NEXT_PUBLIC_STORE_NAME");
  restoreEnvVar("RESEND_API_KEY");
  restoreEnvVar("NEXT_PUBLIC_APP_URL");
});

// ---------------------------------------------------------------------------
// content/emails.ts
// ---------------------------------------------------------------------------

describe("getStoreName", () => {
  it("falls back to BRAND_NAME when NEXT_PUBLIC_STORE_NAME is unset", () => {
    expect(getStoreName()).toBe("Mirox Shop");
  });

  it("prefers NEXT_PUBLIC_STORE_NAME when set (read at call time, not import time)", () => {
    process.env.NEXT_PUBLIC_STORE_NAME = "Custom Brand";
    expect(getStoreName()).toBe("Custom Brand");
  });
});

describe("emails content module", () => {
  it("builds the UA order subject with the brand", () => {
    expect(emails.order.subject("ORD-1")).toBe("Замовлення ORD-1 прийнято — Mirox Shop");
  });

  it("builds the UA newsletter subject with the brand", () => {
    expect(emails.newsletter.subject()).toBe("Підтвердіть підписку на розсилку Mirox Shop");
  });

  it("stores pre-uppercased CTA labels (house checkout precedent)", () => {
    expect(emails.order.cta).toBe("ІСТОРІЯ ЗАМОВЛЕНЬ");
    expect(emails.newsletter.cta).toBe("ПІДТВЕРДИТИ ПІДПИСКУ");
  });

  it("exposes only instagram and telegram as order-email contacts", () => {
    expect(emails.order.contacts.map((s) => s.platform)).toEqual(["instagram", "telegram"]);
  });
});

// ---------------------------------------------------------------------------
// email-templates/layout.ts — shared dark shell
// ---------------------------------------------------------------------------

describe("renderEmailShell", () => {
  it("renders a Ukrainian-language dark shell with the brand and body", () => {
    const html = renderEmailShell({ title: "Тест", bodyHtml: "<p>BODY-MARKER</p>" });
    expect(html).toContain('<html lang="uk">');
    expect(html).toContain('bgcolor="#000000"');
    expect(html).toContain("<title>Тест</title>");
    expect(html).toContain("BODY-MARKER");
    expect(html).toContain("Mirox Shop");
    expect(html).toContain(`&copy; ${new Date().getFullYear()}`);
    expect(html).toContain("Всі права захищені.");
  });

  it("injects footerExtraHtml when provided and omits it otherwise", () => {
    const withExtra = renderEmailShell({
      title: "t",
      bodyHtml: "",
      footerExtraHtml: "<p>EXTRA-MARKER</p>",
    });
    const without = renderEmailShell({ title: "t", bodyHtml: "" });
    expect(withExtra).toContain("EXTRA-MARKER");
    expect(without).not.toContain("EXTRA-MARKER");
  });

  it("renders the env store name when set", () => {
    process.env.NEXT_PUBLIC_STORE_NAME = "Custom Brand";
    expect(renderEmailShell({ title: "t", bodyHtml: "" })).toContain("Custom Brand");
  });
});

describe("renderPanel / renderButton", () => {
  it("wraps content in a dark panel with border", () => {
    const html = renderPanel("<p>PANEL-MARKER</p>");
    expect(html).toContain("PANEL-MARKER");
    expect(html).toContain(`bgcolor="${EMAIL_COLORS.panel}"`);
    expect(html).toContain(EMAIL_COLORS.border);
  });

  it("renders a white button with href and label", () => {
    const html = renderButton("https://example.com/x", "НАТИСНУТИ");
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain("НАТИСНУТИ");
    expect(html).toContain('bgcolor="#ffffff"');
    expect(html).toContain("color: #000000");
  });
});
