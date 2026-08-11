import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock("resend", () => ({
  // A vi.fn() implemented with an arrow function cannot back `new Resend()`
  // (arrow functions aren't constructible — vitest throws "is not a
  // constructor"); a plain function returning the mock object works because
  // an explicit object return from a constructor call overrides `this`.
  Resend: vi.fn(function () {
    return { emails: { send: sendMock } };
  }),
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

  it("exposes instagram and telegram while the WhatsApp number is pending", () => {
    expect(emails.order.contacts.map((s) => s.platform)).toEqual(["instagram", "telegram"]);
  });

  it("appends WhatsApp to order-email contacts once the client number is supplied", async () => {
    vi.resetModules();
    vi.doMock("@/content/brand", async (importOriginal) => ({
      ...(await importOriginal<typeof import("@/content/brand")>()),
      WHATSAPP_HREF: "https://wa.me/380501234567",
    }));
    const { emails: patched } = await import("@/content/emails");
    expect(patched.order.contacts.map((s) => s.platform)).toEqual([
      "instagram",
      "telegram",
      "whatsapp",
    ]);
    vi.doUnmock("@/content/brand");
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

import {
  generateOrderConfirmationHtml,
  type OrderEmailData,
} from "@/lib/email-templates/order-confirmation";
import { formatPrice } from "@/lib/format";
import { generateFeedbackEmailHtml } from "@/lib/email-templates/feedback";

// ---------------------------------------------------------------------------
// email-templates/order-confirmation.ts
// ---------------------------------------------------------------------------

const baseOrder: OrderEmailData = {
  orderNumber: "ORD-20260810-001",
  email: "customer@example.com",
  items: [
    {
      productName: "Худі Mirox Basic",
      variantInfo: "Size: M",
      quantity: 2,
      unitPrice: 1290,
      totalPrice: 2580,
    },
  ],
  subtotal: 2580,
  shippingCost: 80,
  tax: 0,
  total: 2660,
  shippingAddress: {
    name: "Тест Тестовий",
    line1: "Відділення №12",
    city: "Київ",
    country: "UA",
  },
  shippingMethod: "np-office",
  hasAccount: false,
};

describe("generateOrderConfirmationHtml", () => {
  it("renders the Ukrainian order email in the dark shell", () => {
    const html = generateOrderConfirmationHtml(baseOrder);
    expect(html).toContain('<html lang="uk">');
    expect(html).toContain('bgcolor="#000000"');
    for (const marker of [
      "Замовлення прийнято!",
      "Дякуємо за замовлення!",
      "Замовлення №",
      "ORD-20260810-001",
      "Товари",
      "Доставка",
      "До сплати",
      "Адреса доставки",
      "Спосіб доставки",
      "Нова Пошта — відділення",
      "Питання щодо замовлення?",
    ]) {
      expect(html).toContain(marker);
    }
    expect(html).toContain(formatPrice(2580));
    expect(html).toContain(formatPrice(2660));
    expect(html).not.toContain("Store");
    expect(html).not.toContain("<br>UA");
  });

  it("escapes user-supplied strings (HTML injection)", () => {
    const html = generateOrderConfirmationHtml({
      ...baseOrder,
      items: [{ ...baseOrder.items[0], productName: '<img src=x onerror="pwn()">' }],
      shippingAddress: { ...baseOrder.shippingAddress, city: "<script>alert(1)</script>" },
    });
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("hides the account CTA for guest orders", () => {
    const html = generateOrderConfirmationHtml({ ...baseOrder, hasAccount: false });
    expect(html).not.toContain("ІСТОРІЯ ЗАМОВЛЕНЬ");
    expect(html).not.toContain("/account/orders");
  });

  it("shows the account CTA for signed-in customers", () => {
    const html = generateOrderConfirmationHtml({ ...baseOrder, hasAccount: true });
    expect(html).toContain("ІСТОРІЯ ЗАМОВЛЕНЬ");
    expect(html).toContain("https://test.example.com/account/orders");
  });

  it("renders the tax row only when tax > 0", () => {
    expect(generateOrderConfirmationHtml({ ...baseOrder, tax: 0 })).not.toContain("Податок");
    const withTax = generateOrderConfirmationHtml({ ...baseOrder, tax: 133 });
    expect(withTax).toContain("Податок");
    expect(withTax).toContain(formatPrice(133));
  });

  it("still resolves legacy Stripe-era shipping ids", () => {
    const html = generateOrderConfirmationHtml({ ...baseOrder, shippingMethod: "standard" });
    expect(html).toContain("Standard Shipping");
  });

  it("does not promise a nonexistent shipping-confirmation email", () => {
    expect(generateOrderConfirmationHtml(baseOrder)).not.toContain("shipping confirmation");
  });
});

import { generateNewsletterConfirmationHtml } from "@/lib/email-templates/newsletter-confirmation";

// ---------------------------------------------------------------------------
// email-templates/newsletter-confirmation.ts
// ---------------------------------------------------------------------------

const newsletterData = {
  email: "customer@example.com",
  confirmationUrl: "https://test.example.com/newsletter/confirm?token=abc123",
};

describe("generateNewsletterConfirmationHtml", () => {
  it("renders the Ukrainian double-opt-in email in the dark shell", () => {
    const html = generateNewsletterConfirmationHtml(newsletterData);
    expect(html).toContain('<html lang="uk">');
    expect(html).toContain('bgcolor="#000000"');
    expect(html).toContain("Підтвердіть підписку");
    expect(html).toContain("Ви залишили цю адресу для підписки на розсилку");
    expect(html).toContain("customer@example.com");
    expect(html).toContain("Посилання дійсне 24 години.");
    expect(html).toContain(`href="${newsletterData.confirmationUrl}"`);
    expect(html).not.toContain("Store");
  });

  it("escapes the email address", () => {
    const html = generateNewsletterConfirmationHtml({
      ...newsletterData,
      email: '<b onmouseover="pwn()">x</b>@example.com',
    });
    expect(html).not.toContain('<b onmouseover="pwn()">');
    expect(html).toContain("&lt;b onmouseover=");
  });

  it("renders the unsubscribe link only when provided", () => {
    const withUnsub = generateNewsletterConfirmationHtml({
      ...newsletterData,
      unsubscribeUrl: "https://test.example.com/newsletter/unsubscribe?id=1",
    });
    expect(withUnsub).toContain("Відписатися");
    expect(withUnsub).toContain('href="https://test.example.com/newsletter/unsubscribe?id=1"');
    expect(generateNewsletterConfirmationHtml(newsletterData)).not.toContain("Відписатися");
  });
});

// ---------------------------------------------------------------------------
// email.ts — subject wiring (mocked Resend; module re-imported so the
// module-scope RESEND_API_KEY read picks up the test value)
// ---------------------------------------------------------------------------

describe("email.ts subjects", () => {
  it("sends the order email with the UA subject", async () => {
    sendMock.mockResolvedValue({ error: null });
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendOrderConfirmationEmail } = await import("@/lib/email");
    const result = await sendOrderConfirmationEmail({ ...baseOrder });
    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "customer@example.com",
        subject: "Замовлення ORD-20260810-001 прийнято — Mirox Shop",
      })
    );
  });

  it("sends the newsletter email with the UA subject", async () => {
    sendMock.mockResolvedValue({ error: null });
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendNewsletterConfirmationEmail } = await import("@/lib/email");
    const result = await sendNewsletterConfirmationEmail(newsletterData);
    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Підтвердіть підписку на розсилку Mirox Shop" })
    );
  });

  it("bounds a stalled Resend call instead of hanging the awaited response", async () => {
    vi.useFakeTimers();
    try {
      sendMock.mockImplementation(() => new Promise(() => {}));
      process.env.RESEND_API_KEY = "test-key";
      vi.resetModules();
      const { sendOrderConfirmationEmail } = await import("@/lib/email");
      const resultPromise = sendOrderConfirmationEmail({ ...baseOrder });
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/timed out/);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// email-templates/feedback.ts
// ---------------------------------------------------------------------------

describe("generateFeedbackEmailHtml", () => {
  it("renders name and email rows when provided", () => {
    const html = generateFeedbackEmailHtml({
      name: "Олена",
      email: "olena@example.com",
      message: "Кнопка кошика не працює",
    });
    expect(html).toContain("Новий відгук із сайту");
    expect(html).toContain("Олена");
    expect(html).toContain("olena@example.com");
    expect(html).toContain("Кнопка кошика не працює");
  });

  it("renders the anonymous line when no contacts were left", () => {
    const html = generateFeedbackEmailHtml({ message: "Анонімний відгук про сайт" });
    expect(html).toContain("Відправник не залишив контактів.");
    expect(html).not.toContain("Ім'я:");
  });

  it("escapes user-controlled strings", () => {
    const html = generateFeedbackEmailHtml({
      name: '<script>alert("x")</script>',
      message: "Текст із <b>тегами</b> всередині",
    });
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;тегами&lt;/b&gt;");
  });

  it("converts message newlines to <br> after escaping", () => {
    const html = generateFeedbackEmailHtml({ message: "перший рядок\nдругий рядок" });
    expect(html).toContain("перший рядок<br>другий рядок");
  });
});
