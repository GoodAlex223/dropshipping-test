import { pluralizeUk } from "@/lib/format";

/**
 * Cart surfaces copy (cart page + CartDrawer). Single extraction point for
 * TASK-039 i18n — plain typed strings; the only logic is the count formatter.
 */
export const cart = {
  title: "Кошик",
  /** «1 товар» / «2 товари» / «5 товарів» */
  itemsCount: (n: number) => `${n} ${pluralizeUk(n, "товар", "товари", "товарів")}`,
  continueShopping: "Продовжити покупки",
  remove: "Видалити",
  variant: { color: "Колір:", size: "Розмір:" },
  quantity: { increase: "Збільшити кількість", decrease: "Зменшити кількість" },
  empty: {
    title: "Кошик порожній",
    cta: "Перейти в каталог",
  },
  summary: {
    title: "Разом",
    itemsLabel: "Товари",
    shippingLabel: "Доставка",
    // G2 flipped this from the G1-era neutral «Розраховується при
    // оформленні» — the checkout now really ships via Nova Poshta methods
    // (src/lib/shipping.ts), so the handoff's original copy is true.
    shippingValue: "За тарифами Нової Пошти",
    totalLabel: "До сплати",
    checkoutCta: "ОФОРМИТИ ЗАМОВЛЕННЯ",
    validating: "Перевірка…",
    securePayment: "Безпечна оплата",
    stockIssues: {
      title: "Деякі товари недоступні в потрібній кількості",
      description: "Оновіть кількість або видаліть недоступні товари перед оформленням.",
    },
  },
  stock: {
    outOfStock: "Немає в наявності",
    onlyN: (n: number) => `Доступно лише ${n}`,
  },
  clear: {
    action: "Очистити кошик",
    dialogTitle: "Очистити кошик?",
    dialogDescription: "Усі товари буде видалено з кошика. Цю дію не можна скасувати.",
    confirm: "Очистити",
    cancel: "Скасувати",
  },
  drawer: {
    title: "Кошик",
    viewCart: "Переглянути кошик",
  },
};
