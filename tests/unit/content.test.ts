import { describe, it, expect } from "vitest";
import { site } from "@/content/site";
import { home } from "@/content/home";
import { auth } from "@/content/auth";
import { account, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/content/account";
import { newsletter } from "@/content/newsletter";
import { system } from "@/content/system";
import { feedback } from "@/content/feedback";
import { OrderStatus, PaymentStatus } from "@prisma/client";

describe("site content", () => {
  it("exposes the Mirox brand name", () => {
    expect(site.name).toBe("Mirox Shop");
  });

  it("declares exactly the three briefed social platforms", () => {
    expect(site.socials.map((s) => s.platform)).toEqual(["instagram", "tiktok", "telegram"]);
  });

  it("defaults every follower count to null so no counter is fabricated", () => {
    expect(site.socials.every((s) => s.followers === null)).toBe(true);
  });

  it("carries the client's own claim figures", () => {
    expect(site.claims.olxSales).toBe("300+");
    expect(site.claims.instagramOrders).toBe("100+");
  });

  it("points the launch announcement at the feedback form as a marquee", () => {
    expect(site.announcement?.href).toBe("/feedback");
    expect(site.announcement?.marquee).toBe(true);
    expect(site.announcement?.id).toBeTruthy();
    // text/linkLabel moved to the catalog (TASK-039 G9) — covered by
    // i18n-catalogs.test.ts's apostrophe-render test instead.
  });
});

describe("home content", () => {
  // headline pair moved to i18n-catalogs.test.ts (string content, catalog-sourced).

  it("has no eyebrow — removed 2026-07-28 for the multi-brand store, kept config-gated", () => {
    expect(home.hero.eyebrow).toBeNull();
  });

  it("uses the homepage-section CTA labels, not the mockup-prompt ones", () => {
    expect(home.hero.primaryCta.href).toBe("/products");
    expect(home.hero.secondaryCta.href).toBe("/products?sort=new");
  });

  it("configures the hero image at the handoff's path", () => {
    expect(home.hero.image).not.toBeNull();
    expect(home.hero.image?.src).toBe("/images/hero-model-2.png");
  });

  it("provides exactly four benefit cards", () => {
    expect(home.benefits).toHaveLength(4);
    expect(site.footerBenefits).toHaveLength(4);
  });

  // Retraction regex + whyChooseUs count/intro moved to i18n-catalogs.test.ts
  // (string content, catalog-sourced — home.whyChooseUs no longer exists on
  // this trimmed module, and home.benefits/site.footerBenefits no longer
  // carry title/description to scan).

  it("exposes only the new-arrivals rail (featured/bestsellers removed)", () => {
    expect(Object.keys(home.rails)).toEqual(["newArrivals"]);
  });

  it("points the new-arrivals rail at the full catalog", () => {
    expect(home.rails.newArrivals.viewAllHref).toBe("/products");
    // viewAllLabel moved to the catalog as home.rails.newArrivals.viewAllLabel.
  });
});

describe("auth content", () => {
  it("keeps submit CTAs uppercase per the shipped checkout convention", () => {
    expect(auth.login.submit).toBe(auth.login.submit.toUpperCase());
    expect(auth.register.submit).toBe(auth.register.submit.toUpperCase());
  });
});

describe("account content", () => {
  it("labels every OrderStatus value in Ukrainian", () => {
    for (const s of Object.values(OrderStatus)) {
      expect(ORDER_STATUS_LABELS[s]).toBeTruthy();
      expect(ORDER_STATUS_LABELS[s]).not.toMatch(/^[A-Za-z ]+$/);
    }
  });

  it("labels every PaymentStatus value in Ukrainian", () => {
    for (const s of Object.values(PaymentStatus)) {
      expect(PAYMENT_STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it("pluralizes the more-items line", () => {
    expect(account.orders.card.more(1)).toBe("+1 інший товар");
    expect(account.orders.card.more(3)).toBe("+3 інші товари");
    expect(account.orders.card.more(5)).toBe("+5 інших товарів");
  });

  it("maps cod and card payment methods", () => {
    expect(account.orderDetail.payment.methodLabel("cod")).toBe("Оплата при отриманні");
    expect(account.orderDetail.payment.methodLabel("card")).toBe("Карткою");
  });
});

describe("newsletter content", () => {
  it("covers every confirm code the API emits", () => {
    for (const code of [
      "CONFIRMED",
      "ALREADY_CONFIRMED",
      "LINK_EXPIRED",
      "INVALID_TOKEN",
      "TOKEN_REQUIRED",
    ]) {
      expect(newsletter.confirm.byCode[code]).toBeTruthy();
    }
  });

  it("covers every unsubscribe code the API emits", () => {
    for (const code of [
      "UNSUBSCRIBED",
      "ALREADY_UNSUBSCRIBED",
      "SUBSCRIBER_NOT_FOUND",
      "INVALID_UNSUBSCRIBE_LINK",
      "VALIDATION_ERROR",
    ]) {
      expect(newsletter.unsubscribe.byCode[code]).toBeTruthy();
    }
  });

  it("interpolates the unsubscribe prompt email", () => {
    expect(newsletter.unsubscribe.idle.prompt("a@b.ua")).toContain("a@b.ua");
  });
});

describe("system content", () => {
  it("has the cookie banner button pair", () => {
    expect(system.cookies.accept).toBe("Прийняти");
    expect(system.cookies.decline).toBe("Відхилити");
  });
});

// "site header content" describe block removed (TASK-039 G9) — site.header
// no longer exists on the trimmed content module; equivalent coverage lives
// in i18n-catalogs.test.ts's guillemets/query-interpolation test.

describe("feedback content", () => {
  it("maps both feedback API outcome codes to Ukrainian", () => {
    expect(Object.keys(feedback.byCode).sort()).toEqual(["SEND_FAILED", "VALIDATION_ERROR"]);
  });
});
