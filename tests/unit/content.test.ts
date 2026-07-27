import { describe, it, expect } from "vitest";
import { site } from "@/content/site";
import { home } from "@/content/home";

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
});

describe("home content", () => {
  it("splits the slogan into the three briefed lines", () => {
    expect(home.hero.headline).toEqual(["СТИЛЬ.", "ЯКІСТЬ.", "ВПЕВНЕНІСТЬ."]);
  });

  it("uses the homepage-section CTA labels, not the mockup-prompt ones", () => {
    expect(home.hero.primaryCta.href).toBe("/products");
    expect(home.hero.secondaryCta.href).toBe("/products?sortBy=createdAt&sortOrder=desc");
  });

  it("configures the hero image at the handoff's path", () => {
    expect(home.hero.image).not.toBeNull();
    expect(home.hero.image?.src).toBe("/images/hero-model-2.png");
  });

  it("provides exactly four benefit cards", () => {
    expect(home.benefits).toHaveLength(4);
  });

  it("never advertises retracted services (free delivery threshold, size exchange)", () => {
    const allBenefitText = [...home.benefits, ...site.footerBenefits]
      .map((b) => `${b.title} ${b.description}`)
      .join(" ")
      .toLowerCase();
    expect(allBenefitText).not.toMatch(
      /обмін розміру|безкоштовна доставка|free delivery|size exchange/
    );
  });

  it("provides the six always-true why-choose-us claims, plus a non-empty intro", () => {
    expect(home.whyChooseUs.items).toHaveLength(6);
    expect(home.whyChooseUs.intro.length).toBeGreaterThan(0);
  });

  it("exposes only the new-arrivals rail (featured/bestsellers removed)", () => {
    expect(Object.keys(home.rails)).toEqual(["newArrivals"]);
  });

  it("points the new-arrivals rail at the full catalog", () => {
    expect(home.rails.newArrivals.viewAllHref).toBe("/products");
    expect(home.rails.newArrivals.viewAllLabel).toBe("Дивитись все");
  });
});
