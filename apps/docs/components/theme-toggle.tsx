"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const nextTheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(nextTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("wuliuqi-docs-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <Button
      aria-label="切换主题"
      size="icon"
      type="button"
      variant="ghost"
      onClick={toggleTheme}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
