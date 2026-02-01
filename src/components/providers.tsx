"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/common/CookieConsent";

interface ProvidersProps {
  children: React.ReactNode;
}

// All available themes - using single class names (no spaces)
const THEMES = [
  "light",
  "dark",
  "bold",
  "bold-dark",
  "luxury",
  "luxury-dark",
  "organic",
  "organic-dark",
];

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        themes={THEMES}
      >
        {children}
        <Toaster position="top-right" />
        <CookieConsent />
      </ThemeProvider>
    </SessionProvider>
  );
}
