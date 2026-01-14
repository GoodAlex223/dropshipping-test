"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun, Monitor, Palette, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { VISUAL_THEMES, COLOR_MODES, parseTheme, buildTheme } from "./theme-config";

// Hydration-safe mounting check using useSyncExternalStore
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Theme">
        <Palette className="h-5 w-5" />
      </Button>
    );
  }

  const { visualTheme, colorMode } = parseTheme(theme);

  const handleVisualThemeChange = (newVisualTheme: string) => {
    const newTheme = buildTheme(newVisualTheme as typeof visualTheme, colorMode);
    setTheme(newTheme);
  };

  const handleColorModeChange = (newColorMode: string) => {
    const newTheme = buildTheme(visualTheme, newColorMode as typeof colorMode);
    setTheme(newTheme);
  };

  const ColorModeIcon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }[colorMode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Visual Theme
        </DropdownMenuLabel>
        {VISUAL_THEMES.map((vt) => (
          <DropdownMenuItem
            key={vt.id}
            onClick={() => handleVisualThemeChange(vt.id)}
            className="flex cursor-pointer items-center gap-3"
          >
            <div className={cn("h-4 w-4 shrink-0 rounded-full", vt.previewColor)} />
            <div className="flex flex-col">
              <span className="font-medium">{vt.name}</span>
              <span className="text-muted-foreground text-xs">{vt.description}</span>
            </div>
            {visualTheme === vt.id && <Check className="ml-auto h-4 w-4 shrink-0" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <ColorModeIcon className="h-4 w-4" />
          Color Mode
        </DropdownMenuLabel>
        {COLOR_MODES.map((cm) => {
          const Icon = { light: Sun, dark: Moon, system: Monitor }[cm.id];
          return (
            <DropdownMenuItem
              key={cm.id}
              onClick={() => handleColorModeChange(cm.id)}
              className="flex cursor-pointer items-center gap-3"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{cm.name}</span>
              {colorMode === cm.id && <Check className="ml-auto h-4 w-4 shrink-0" />}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Theme Showcases
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/showcase/bold" className="flex items-center gap-3">
            <div className="h-4 w-4 shrink-0 rounded-full bg-blue-500" />
            <span>Bold & Vibrant</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/showcase/luxury" className="flex items-center gap-3">
            <div className="h-4 w-4 shrink-0 rounded-full bg-amber-600" />
            <span>Luxury Premium</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/showcase/organic" className="flex items-center gap-3">
            <div className="h-4 w-4 shrink-0 rounded-full bg-emerald-600" />
            <span>Organic Scandinavian</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
