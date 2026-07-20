import { Instagram, Send, Music2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, type SocialLink } from "@/content/site";

// lucide has no TikTok or Telegram brand glyph; Music2 and Send are the
// conventional stand-ins and keep the set monochrome and consistent.
const ICONS: Record<SocialLink["platform"], LucideIcon> = {
  instagram: Instagram,
  tiktok: Music2,
  telegram: Send,
};

/**
 * Follower counts render ONLY when a real number is configured. TODO.md's
 * acceptance criterion is explicit that counters appear only if real numbers
 * are supplied, and fabricated social proof is out of scope per TASK-051.
 */
function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

interface SocialLinksProps {
  className?: string;
}

export function SocialLinks({ className }: SocialLinksProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-4", className)}>
      {site.socials.map((social) => {
        const Icon = ICONS[social.platform];
        return (
          <li key={social.platform}>
            {/*
              Content box is ~20px tall (h-5 icon / text-sm line-height), under
              WCAG 2.2 AA's 24x24 minimum target size (same class of bug Task 5
              fixed on the announcement bar's dismiss button). `py-2` grows the
              hit area to 36px; the matching `-my-2` cancels it back out of flow
              so the visible row height and the `gap-4` spacing to neighboring
              links are unchanged.
            */}
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground -my-2 inline-flex items-center gap-2 py-2 text-sm transition-colors"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{social.label}</span>
              {social.followers !== null && (
                <span className="text-muted-foreground text-xs">
                  {formatFollowers(social.followers)}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
