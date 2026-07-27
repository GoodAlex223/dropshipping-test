import { Truck, ShieldCheck, Headphones, CreditCard } from "lucide-react";
import type { BenefitItem } from "./site";
import { BRAND_HERO_SUBTITLE } from "./brand";

export interface HeroImage {
  src: string;
  alt: string;
}

/**
 * Homepage copy. Single extraction point for TASK-039 i18n — these are plain
 * typed objects with no logic, the shape any i18n library can consume.
 */
export const home = {
  hero: {
    eyebrow: "НОВА КОЛЕКЦІЯ",
    /** Brief list #1: three separate lines, rendered as three lines. */
    headline: ["СТИЛЬ.", "ЯКІСТЬ.", "ВПЕВНЕНІСТЬ."],
    subtitle: BRAND_HERO_SUBTITLE,
    primaryCta: { label: "ПЕРЕЙТИ В КАТАЛОГ", href: "/products" },
    secondaryCta: {
      label: "ПЕРЕГЛЯНУТИ НОВИНКИ",
      href: "/products?sortBy=createdAt&sortOrder=desc",
    },
    // Generated placeholder from the design handoff; client photography
    // replaces the file (same path) via TASK-056 — content stays untouched.
    image: {
      src: "/images/hero-model-2.png",
      alt: "Модель у чорному худі Mirox",
    } as HeroImage | null,
  },

  // Handoff §4: «Безкоштовна доставка від 1000 грн» stays retracted;
  // «Обмін розміру» removed (no such service — client, 26.07.2026);
  // «Оплата при отриманні» confirmed by the client (26.07.2026), payment
  // method itself ships in TASK-049 — the benefit states the offer, честно.
  benefits: [
    { icon: Truck, title: "Швидка доставка", description: "По всій Україні" },
    { icon: ShieldCheck, title: "Преміум якість", description: "Тільки найкращі матеріали" },
    { icon: Headphones, title: "Підтримка 24/7", description: "Ми завжди на зв'язку" },
    { icon: CreditCard, title: "Оплата при отриманні", description: "Без передоплати" },
  ] as BenefitItem[],

  whyChooseUs: {
    title: "Чому обирають нас",
    intro: "Перевіряємо кожну річ перед відправкою і завжди на зв'язку.",
    items: [
      "Швидка доставка по Україні",
      "Перевірка кожної речі",
      "Підтримка без вихідних",
      "Тільки якісний одяг",
      "Безпечна оплата",
      "Нам довіряють постійні клієнти",
    ],
  },

  rails: {
    newArrivals: {
      title: "Новинки",
      viewAllHref: "/products",
      viewAllLabel: "Дивитись все",
    },
  },

  testimonials: { title: "Відгуки покупців" },
};
