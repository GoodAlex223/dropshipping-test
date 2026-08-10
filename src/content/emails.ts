import { BRAND_NAME, SOCIALS } from "./brand";

/**
 * Transactional email copy (spec 2026-08-10-g5-transactional-emails-design.md
 * §5/§6). Single extraction point for TASK-039 i18n — plain typed strings.
 *
 * MUST stay lucide-free: this module is bundled into API routes via
 * src/lib/email.ts, and importing ./site would drag lucide-react along.
 * Only ./brand is allowed here.
 */

/**
 * Render-time brand resolution (spec §7): a module-scope const would freeze
 * the env value at import and break env-dependent tests.
 */
export function getStoreName(): string {
  return process.env.NEXT_PUBLIC_STORE_NAME || BRAND_NAME;
}

export const emails = {
  order: {
    subject: (orderNumber: string) => `Замовлення ${orderNumber} прийнято — ${getStoreName()}`,
    /** <title> tag — plain form, no exclamation. */
    title: "Замовлення прийнято",
    heading: "Замовлення прийнято!",
    thanks: "Дякуємо за замовлення!",
    orderNumberLabel: "Замовлення №",
    /** «× 2» — quantity line under each item. */
    qty: (n: number) => `× ${n}`,
    subtotalLabel: "Товари",
    shippingLabel: "Доставка",
    /** Rendered only when tax > 0 (COD is always 0; spec §5). */
    taxLabel: "Податок",
    totalLabel: "До сплати",
    addressHeading: "Адреса доставки",
    methodHeading: "Спосіб доставки",
    contactHeading: "Питання щодо замовлення? Напишіть нам:",
    /** Pre-uppercased like checkout.payment.submit. */
    cta: "ІСТОРІЯ ЗАМОВЛЕНЬ",
    /** Manager channels for the contact block — no WhatsApp (checkout.ts precedent: null until client supplies). */
    contacts: SOCIALS.filter((s) => s.platform === "instagram" || s.platform === "telegram"),
  },
  newsletter: {
    subject: () => `Підтвердіть підписку на розсилку ${getStoreName()}`,
    title: "Підтвердіть підписку",
    heading: "Підтвердіть підписку",
    /** Rendered as `${introPrefix} ${brand}: <strong>{escaped email}</strong>` */
    introPrefix: "Ви залишили цю адресу для підписки на розсилку",
    body: "Підтвердіть підписку — і ми надсилатимемо новинки та ексклюзивні пропозиції.",
    cta: "ПІДТВЕРДИТИ ПІДПИСКУ",
    safetyTitle: "Не запитували підписку?",
    safetyText: "Просто проігноруйте цей лист. Посилання дійсне 24 години.",
    unsubscribe: "Відписатися",
  },
  footer: {
    rights: "Всі права захищені.",
  },
};
