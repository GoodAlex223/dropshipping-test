import { pluralizeUk } from "@/lib/format";

/**
 * Account area copy (layout nav, overview, orders list/detail) plus the
 * customer-facing OrderStatus / PaymentStatus label maps. Single extraction
 * point for TASK-039 i18n. The maps live here (not lib/) because they are
 * customer copy. lib/order-status.ts re-exports ORDER_STATUS_LABELS only, so
 * its consumers keep one import for the style+label pair; PAYMENT_STATUS_LABELS
 * has no lib pairing and is imported directly from this module.
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує підтвердження",
  CONFIRMED: "Підтверджено",
  PROCESSING: "Обробляється",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  CANCELLED: "Скасовано",
  REFUNDED: "Повернуто",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує оплати",
  PAID: "Оплачено",
  FAILED: "Не вдалася",
  REFUNDED: "Повернуто",
  PARTIALLY_REFUNDED: "Частково повернуто",
};

export const account = {
  title: "Мій акаунт",
  nav: { overview: "Огляд", orders: "Замовлення" },
  overview: {
    welcome: (name: string) => `З поверненням, ${name}!`,
    nameFallback: "Клієнт",
    description: "Керуйте замовленнями та даними акаунта.",
    ordersCard: {
      title: "Замовлення",
      description: "Перегляд і відстеження ваших замовлень",
      cta: "До замовлень",
    },
    info: { title: "Дані акаунта", name: "Ім'я", email: "Email", notSet: "Не вказано" },
  },
  orders: {
    title: "Історія замовлень",
    filter: { placeholder: "Фільтр за статусом", all: "Всі замовлення" },
    empty: {
      title: "Замовлень поки немає",
      description: "Коли ви оформите замовлення, воно з'явиться тут.",
      cta: "Перейти в каталог",
    },
    card: {
      placed: "Дата замовлення",
      total: "Сума",
      number: "№ замовлення",
      details: "Деталі",
      qty: (n: number) => `К-сть: ${n}`,
      more: (n: number) => `+${n} ${pluralizeUk(n, "інший товар", "інші товари", "інших товарів")}`,
    },
    pagination: {
      prev: "Назад",
      next: "Далі",
      pageOf: (page: number, total: number) => `Сторінка ${page} з ${total}`,
    },
  },
  orderDetail: {
    orderTitle: (num: string) => `Замовлення ${num}`,
    placedOn: (date: string) => `Оформлено ${date}`,
    notFound: "Замовлення не знайдено",
    loadFailed: "Не вдалося завантажити замовлення",
    backToOrders: "До замовлень",
    timeline: {
      title: "Статус замовлення",
      placed: "Замовлення оформлено",
      confirmed: "Замовлення підтверджено",
      processing: "Обробляється",
      shipped: "Відправлено",
      delivered: "Доставлено",
      cancelled: "Скасовано",
      tracking: "Номер відстеження:",
      trackPackage: "Відстежити посилку",
    },
    items: { title: (n: number) => `Товари (${n})`, sku: "Артикул:" },
    summary: {
      title: "Разом",
      subtotal: "Товари",
      shipping: "Доставка",
      discount: "Знижка",
      tax: "Податок",
      total: "До сплати",
    },
    address: { title: "Адреса доставки" },
    payment: {
      title: "Оплата",
      method: "Спосіб",
      status: "Статус",
      paidOn: "Оплачено",
      methodLabel: (method?: string | null) =>
        method === "cod"
          ? "Оплата при отриманні"
          : method === "card"
            ? "Карткою"
            : (method ?? "Карткою"),
    },
    notes: { title: "Коментар до замовлення" },
  },
};
