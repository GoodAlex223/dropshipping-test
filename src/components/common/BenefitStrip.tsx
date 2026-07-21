import { cn } from "@/lib/utils";
import type { BenefitItem } from "@/content/site";

interface BenefitStripProps {
  items: BenefitItem[];
  className?: string;
}

/**
 * Horizontal benefit row. Content arrives as a prop because the hero and the
 * footer show different items (delivery/exchange/quality/support vs
 * delivery/returns/payment/support) with identical structure.
 */
export function BenefitStrip({ items, className }: BenefitStripProps) {
  if (items.length === 0) return null;

  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
