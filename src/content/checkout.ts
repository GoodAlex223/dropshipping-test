import { site } from "./site";
import { WHATSAPP_HREF } from "./brand";

/**
 * Checkout + confirmation copy (spec 2026-08-06-g2-checkout-restyle-cod-design.md
 * §2/§6/§8). Single extraction point for TASK-039 i18n — plain typed strings.
 *
 * CLIENT-SUPPLIED, PENDING (TASK-056 ask, added 2026-08-06): `payment.prepay.cardNumber`
 * / `cardHolder` (manual full-prepayment card details). While null, the UI renders the
 * contact-the-manager fallback — filling the value lights the block up with no code change.
 */
export const checkout = {
  title: "Оформлення замовлення",
  secureNote: "Захищене оформлення",
  steps: {
    cart: "Кошик",
    contacts: "Контакти",
    delivery: "Доставка",
    payment: "Оплата",
  },
  contact: {
    heading: "Контактні дані",
    name: { label: "Ім'я", placeholder: "Олександр Коваленко" },
    phone: { label: "Телефон", placeholder: "+380 __ ___ __ __" },
    email: { label: "Email", placeholder: "you@example.com" },
    next: "ДАЛІ — ДОСТАВКА",
  },
  delivery: {
    heading: "Доставка",
    city: { label: "Місто", placeholder: "Київ" },
    address: { label: "Відділення / адреса", placeholder: "Відділення №12" },
    notes: {
      label: "Коментар до замовлення (необов'язково)",
      placeholder: "Побажання до замовлення…",
    },
    back: "← НАЗАД",
    next: "ДАЛІ — ОПЛАТА",
  },
  payment: {
    heading: "Оплата",
    cod: {
      name: "Оплата при отриманні",
      description: "Без передоплати · готівкою або карткою у відділенні",
    },
    noPrepay: "Працюємо без передоплати",
    prepay: {
      /** CLIENT-SUPPLIED, PENDING — see module doc comment. */
      cardNumber: null as string | null,
      cardHolder: null as string | null,
      offer: "Хочете оплатити повну вартість наперед? Напишіть менеджеру — надішлемо реквізити.",
      cardLabel: "Оплата повної вартості на картку:",
      contactLabel: "Питання — напишіть менеджеру:",
    },
    back: "← НАЗАД",
    /** The live total is appended in the page: «ПІДТВЕРДИТИ ЗАМОВЛЕННЯ — 1 960 грн». */
    submit: "ПІДТВЕРДИТИ ЗАМОВЛЕННЯ",
    submitting: "Обробка…",
    errors: {
      /** Generic fallback for unknown/absent server codes. */
      orderFailed: "Не вдалося оформити замовлення. Спробуйте ще раз.",
      /** PRODUCT_UNAVAILABLE — an ordered product was deactivated/removed. */
      productUnavailable:
        "Деякі товари з вашого замовлення більше недоступні. Оновіть кошик і спробуйте ще раз.",
      /** INVALID_VARIANT — stale/foreign variant on an order line. */
      invalidVariant:
        "Один із товарів недоступний у вибраному варіанті. Оновіть кошик і спробуйте ще раз.",
      /** INVALID_SHIPPING_METHOD */
      invalidShippingMethod: "Оберіть коректний спосіб доставки.",
      /** INVALID_ORDER_DATA */
      invalidOrderData: "Перевірте правильність заповнених даних.",
    },
  },
  /**
   * Manager contact links. whatsapp is single-sourced from brand.ts
   * (WHATSAPP_HREF, CLIENT-SUPPLIED, PENDING TASK-056): null hides the link —
   * unlike site.ts's socials there is no real handle to fall back on, and a
   * zero-filled wa.me number would render as a clickable dead link (PR #29 review).
   * Fill with the real number to light it up.
   */
  contacts: {
    instagram: site.socials.find((s) => s.platform === "instagram")?.href ?? null,
    telegram: site.socials.find((s) => s.platform === "telegram")?.href ?? null,
    whatsapp: WHATSAPP_HREF,
  },
  summary: {
    heading: "Ваше замовлення",
    itemsLabel: "Товари",
    shippingLabel: "Доставка",
    totalLabel: "До сплати",
    /** «1 шт» — quantity unit used in the variant line «Чорний · L · 1 шт». */
    qty: (n: number) => `${n} шт`,
  },
  empty: {
    title: "Кошик порожній",
    description: "Додайте товари до кошика, щоб оформити замовлення.",
    cta: "Перейти в каталог",
  },
  confirmation: {
    title: "Замовлення прийнято!",
    emailSentPrefix: "Дякуємо! Ми надіслали підтвердження на",
    orderNumberLabel: "Замовлення №",
    detailsHeading: "Деталі замовлення",
    paymentCod: "Оплата при отриманні у відділенні",
    paymentCard: "Карткою онлайн",
    paymentLabel: "Оплата",
    subtotalLabel: "Товари",
    shippingLabel: "Доставка",
    totalLabel: "До сплати",
    addressHeading: "Адреса доставки",
    methodHeading: "Спосіб доставки",
    notesHeading: "Коментар до замовлення",
    emailCardTitle: "Лист із підтвердженням",
    emailCardTextPrefix: "Деталі замовлення надіслано на",
    continueShopping: "Продовжити покупки",
    viewOrders: "Історія замовлень",
    notFoundTitle: "Замовлення не знайдено",
    notFoundText: "Ми не знайшли замовлення за вказаним номером.",
    loading: "Завантажуємо деталі замовлення…",
  },
};
