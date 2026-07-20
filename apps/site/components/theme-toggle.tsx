"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-5 w-9 rounded-full border border-border bg-muted" />
    );
  }

  const dark = resolvedTheme === "dark";
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Sun className="size-3.5" aria-hidden="true" />
      <Switch
        aria-label="Toggle dark theme"
        checked={dark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className="size-3.5" aria-hidden="true" />
    </label>
  );
}
