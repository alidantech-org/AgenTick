"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const options = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "system", label: "Use system theme", icon: Monitor },
  { value: "dark", label: "Dark theme", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Server-rendered markup can't know the user's preference yet —
  // render a neutral placeholder of the exact same size to avoid layout shift / hydration mismatch.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-8 w-[88px] rounded-full border border-border bg-muted"
      />
    );
  }

  const active = theme ?? "system";
  const activeIndex = Math.max(
    options.findIndex((o) => o.value === active),
    0,
  );

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative inline-flex h-8 items-center rounded-full border border-border bg-surface p-0.5"
    >
      {/* sliding indicator — the only thing doing the "switching" visually */}
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 size-7 rounded-full bg-foreground transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * 28}px)` }}
      />
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className="relative z-10 flex size-7 items-center justify-center rounded-full outline-none"
          >
            <Icon
              className={`size-3.5 transition-colors duration-300 ${
                isActive ? "text-background" : "text-muted-foreground"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
