import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export const THEME_STORAGE_KEY = "dic-theme";

/** Inlined in the document head so the first paint already has the right theme. */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'dark';document.documentElement.classList.toggle('dark',t!=='light');document.documentElement.style.colorScheme=t==='light'?'light':'dark';}catch(e){document.documentElement.classList.add('dark');}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "dark";
    setTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
