import { ORDER_STATUS_LABELS } from "@/content/account";

/**
 * Single source of truth for OrderStatus presentation.
 * Monochrome by policy; the destructive (red) token is reserved for the
 * negative terminal states CANCELLED and REFUNDED.
 * Labels are customer copy and live in src/content/account.ts (G4);
 * re-exported here so lookup stays one import for consumers.
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

export { ORDER_STATUS_LABELS };

export function getOrderStatusStyle(status: string): string {
  return ORDER_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
}

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
