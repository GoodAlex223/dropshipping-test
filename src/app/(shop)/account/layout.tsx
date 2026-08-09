"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { account } from "@/content/account";

const accountNav = [
  { href: "/account", label: account.nav.overview, icon: User },
  { href: "/account/orders", label: account.nav.orders, icon: Package },
  // «Адреси» and «Налаштування» are deliberately absent: /account/addresses
  // and /account/settings don't exist yet (404 today). Restore when the pages
  // are built — BACKLOG [2026-08-08] From: G4 brainstorm (Footer shopLinks
  // precedent for omitting links to unbuilt pages).
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-2xl font-bold">{account.title}</h1>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar Navigation */}
        <nav className="space-y-1">
          {accountNav.map((item) => {
            const isActive =
              item.href === "/account" ? pathname === "/account" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
