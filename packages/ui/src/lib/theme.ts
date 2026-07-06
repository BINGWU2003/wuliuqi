export type Theme = "light" | "dark";

const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia(DARK_THEME_QUERY).matches ? "dark" : "light";
}

export function getPreferredTheme(storageKey: string): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(storageKey);

  return isTheme(storedTheme) ? storedTheme : getSystemTheme();
}

export function getDocumentTheme(storageKey: string): Theme {
  if (typeof document === "undefined") {
    return getPreferredTheme(storageKey);
  }

  const documentTheme = document.documentElement.dataset.theme;

  return isTheme(documentTheme) ? documentTheme : getPreferredTheme(storageKey);
}

export function getNextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export function persistTheme(storageKey: string, theme: Theme) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, theme);
}

export function getThemeInitScript(storageKey: string) {
  return `
    try {
      var storedTheme = localStorage.getItem(${JSON.stringify(storageKey)});
      var systemTheme =
        window.matchMedia && window.matchMedia(${JSON.stringify(DARK_THEME_QUERY)}).matches
          ? "dark"
          : "light";
      var theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : systemTheme;
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
    } catch (_) {}
  `;
}
