/**
 * Single source of truth for OrderStatus presentation styles.
 * Monochrome by policy; the destructive (red) token is reserved for the
 * negative terminal states CANCELLED and REFUNDED.
 * Customer-facing label copy lives in the messages catalog
 * (account.orderStatus/account.paymentStatus); the admin panel renders raw
 * enum values until G13 migrates it onto the admin.* namespace.
 */
export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-muted text-foreground",
  PROCESSING: "bg-secondary text-secondary-foreground",
  SHIPPED: "bg-secondary text-secondary-foreground",
  DELIVERED: "bg-foreground text-background",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
};

export function getOrderStatusStyle(status: string): string {
  return ORDER_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
}
