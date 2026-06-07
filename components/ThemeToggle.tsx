"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const STORAGE_KEY = "predicards-theme";

// Read the theme the no-flash script in <head> already applied, so first paint matches.
function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage blocked — theme still applies for this session */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  };

  // Avoid hydration mismatch: render a neutral placeholder until mounted.
  if (!mounted) {
    return <div className="h-7 w-7 rounded-full border border-line-subtle bg-bg-card" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={`Theme: ${isDark ? "Dark" : "Light"} (click to switch)`}
      aria-label="Toggle color theme"
      className="flex h-7 w-7 items-center justify-center rounded-full border border-line-subtle bg-bg-card text-text-secondary shadow-soft transition-colors hover:border-line hover:text-text-primary"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
