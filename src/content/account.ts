// Temporary duplicate of messages/uk.json account.orderStatus/paymentStatus — admin-only source until G13 migrates admin to the admin.* namespace, then delete.
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
