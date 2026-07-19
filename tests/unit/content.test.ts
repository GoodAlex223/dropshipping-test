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
    expect(home.hero.headline).toEqual(["STYLE.", "QUALITY.", "CONFIDENCE."]);
  });

  it("uses the homepage-section CTA labels, not the mockup-prompt ones", () => {
    expect(home.hero.primaryCta.href).toBe("/products");
    expect(home.hero.secondaryCta.href).toBe("/products?sort=newest");
  });

  it("provides exactly four benefit cards", () => {
    expect(home.benefits).toHaveLength(4);
  });

  it("provides the seven always-true why-choose-us claims", () => {
    expect(home.whyChooseUs.items).toHaveLength(7);
  });
});
