"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  applyTheme,
  getDocumentTheme,
  getNextTheme,
  persistTheme,
  type Theme,
} from "../lib/theme";
import { Button } from "./button";

export function ThemeToggle({ storageKey }: { storageKey: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === "dark";

  useEffect(() => {
    const initialTheme = getDocumentTheme(storageKey);

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, [storageKey]);

  function toggleTheme() {
    const nextTheme = getNextTheme(theme);

    setTheme(nextTheme);
    applyTheme(nextTheme);
    persistTheme(storageKey, nextTheme);
  }

  return (
    <Button
      aria-label={isDark ? "切换到白天模式" : "切换到夜间模式"}
      size="icon"
      type="button"
      variant="ghost"
      onClick={toggleTheme}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
