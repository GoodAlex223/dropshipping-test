/**
 * Delivery options for the no-prepayment COD checkout (spec
 * 2026-08-06-g2-checkout-restyle-cod-design.md §3). UAH numerics — with
 * Stripe out of the checkout path these are the real order amounts.
 * Interim NP published rates until TASK-049 (live NP integration).
 */
export const DELIVERY_METHODS = [
  { id: "np-office", name: "Нова Пошта — відділення", description: "1-3 дні", price: 80 },
  { id: "np-courier", name: "Нова Пошта — кур'єр", description: "1-3 дні, до дверей", price: 120 },
  { id: "np-postomat", name: "Нова Пошта — поштомат", description: "1-3 дні", price: 70 },
] as const;

export type DeliveryMethodId = (typeof DELIVERY_METHODS)[number]["id"];

export const DEFAULT_DELIVERY_METHOD_ID: DeliveryMethodId = "np-office";

export function getDeliveryMethod(id: string) {
  return DELIVERY_METHODS.find((method) => method.id === id);
}

// Orders created before G2 store the retired Stripe-era method ids.
const LEGACY_METHOD_LABELS: Record<string, string> = {
  standard: "Standard Shipping",
  express: "Express Shipping",
  overnight: "Overnight Shipping",
};

/** Display label for any stored Order.shippingMethod value, old or new. */
export function getShippingMethodLabel(id: string): string {
  return getDeliveryMethod(id)?.name ?? LEGACY_METHOD_LABELS[id] ?? id;
}
