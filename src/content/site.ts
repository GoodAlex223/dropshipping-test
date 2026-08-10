import { Truck, CreditCard, ShieldCheck, Headphones, type LucideIcon } from "lucide-react";
import { BRAND_NAME, BRAND_TAGLINE, SOCIALS } from "./brand";

/**
 * Site-wide content, consumed by the homepage and the Footer.
 *
 * CLIENT-SUPPLIED VALUES — the fields marked below come from the client and
 * cannot be invented by us. An unset value renders nothing rather than a
 * placeholder. Source: docs/reference/client-brief.md.
 */

export type { SocialLink } from "./brand";

export interface ClientClaims {
  /** CLIENT-SUPPLIED, UNAUDITED (as provided 2026-07-14). null hides the claim. */
  olxSales: string | null;
  instagramOrders: string | null;
  customerRating: string | null;
}

export interface BenefitItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const site = {
  name: BRAND_NAME,
  tagline: BRAND_TAGLINE,

  /** Header chrome strings (G4). Nav item labels stay in Header.tsx's
   *  `navigation` array (pre-existing UA); these are the residuals. */
  header: {
    menu: "Меню",
    toggleMenu: "Відкрити меню",
    categories: "Категорії",
    adminPanel: "Адмін-панель",
    account: "Акаунт",
    orders: "Замовлення",
    signIn: "Увійти",
    signOut: "Вийти",
    createAccount: "Створити акаунт",
    cart: "Кошик",
    search: {
      srOpen: "Пошук (Ctrl+K)",
      dialogTitle: "Пошук товарів",
      placeholder: "Пошук товарів…",
      viewAll: (q: string) => `Всі результати для «${q}»`,
      noResults: (q: string) => `Нічого не знайдено за запитом «${q}»`,
      minChars: "Введіть щонайменше 2 символи для пошуку…",
    },
  },

  /**
   * RETRACTED, not merely unconfirmed — was "Free delivery on orders over
   * 1000 UAH", read off the AI-generated concept mockup
   * (docs/reference/mirox-concept-screenshot.jpg). Set to null because no
   * free-shipping threshold exists anywhere in the order path, at any
   * subtotal or currency: calculateOrderTotals() (src/lib/stripe.ts) and the
   * checkout confirm-order route both always charge
   * `shippingMethod?.price ?? 0`, never 0 for a real method. That made this a
   * false claim today, not an unverified one, so "pending client
   * confirmation" was the wrong framing regardless of what the client says.
   *
   * TODO.md's TASK-035 AC requires this banner's *slot* to exist, not any
   * specific promised text — AnnouncementBar already renders nothing when
   * this is null (see its test), which satisfies that AC. Only restore real
   * copy once a threshold is both implemented in code and confirmed with the
   * client; tracked by the client content inventory task (docs/planning/
   * TODO.md Spawned section).
   */
  announcement: null as string | null,

  /** CLIENT-SUPPLIED placeholder handles — data lives in brand.ts since G5. */
  socials: SOCIALS,

  /**
   * CLIENT-SUPPLIED, UNAUDITED. The client's own claims about their OLX and
   * Instagram sales history, recorded 2026-07-14. Rendered as their claims.
   *
   * These must NEVER feed aggregateRating structured data: the site emits real
   * review markup via seo.ts, and Google's structured-data policy prohibits
   * aggregate ratings that don't correspond to on-site reviews.
   */
  claims: {
    olxSales: "300+",
    instagramOrders: "100+",
    customerRating: null,
  } as ClientClaims,

  /**
   * Footer benefit strip — the concept screenshot's footer row.
   *
   * "Free delivery" (threshold) had its description RETRACTED, not merely
   * flagged unconfirmed: calculateOrderTotals() (src/lib/stripe.ts) and the
   * checkout confirm-order route always charge `shippingMethod?.price ?? 0`,
   * at any subtotal — no free-shipping threshold exists anywhere in the order
   * path. «Обмін розміру» / "Easy returns" was REMOVED outright (not just
   * reworded) per the client, 26.07.2026 — no such service exists, and it had
   * no destination page either. «Оплата при отриманні» (pay on delivery) is
   * confirmed by the client (26.07.2026) as the offer being made; the payment
   * method itself ships in TASK-049, per the TASK-038b payments decision doc.
   *
   * Tracked by the client content inventory task (docs/planning/TODO.md
   * Spawned section).
   */
  footerBenefits: [
    { icon: Truck, title: "Швидка доставка", description: "Розрахунок при оформленні" },
    { icon: CreditCard, title: "Оплата при отриманні", description: "Без передоплати" },
    { icon: ShieldCheck, title: "Безпечна оплата", description: "Захищений checkout" },
    { icon: Headphones, title: "Підтримка 24/7", description: "Ми завжди на зв'язку" },
  ] as BenefitItem[],
};
