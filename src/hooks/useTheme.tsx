import { createContext, useContext, useEffect, useState, forwardRef, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "clauthor-theme";
// Flag opcional que o usuário pode setar (via toggle) para "pinar" a escolha
// e parar de seguir o sistema. Sem esse flag, o tema segue prefers-color-scheme.
const PIN_KEY = "clauthor-theme-pinned";

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, _ref) => {
    const [theme, setThemeState] = useState<Theme>(() => {
      if (typeof window === "undefined") return "light";
      const pinned = localStorage.getItem(PIN_KEY) === "1";
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (pinned && stored) return stored;
      return getSystemTheme();
    });

    // Aplica a classe .light/.dark no <html> (ambas necessárias:
    // .light para overrides custom em index.css e .dark para os variants
    // `dark:*` do Tailwind (darkMode: "class") funcionarem).
    useEffect(() => {
      const root = document.documentElement;
      // Transição suave global entre light/dark (premium feel)
      root.style.setProperty(
        "transition",
        "background-color 320ms ease, color 320ms ease, border-color 320ms ease"
      );
      if (theme === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      } else {
        root.classList.add("dark");
        root.classList.remove("light");
        root.style.colorScheme = "dark";
      }
      localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    // Sincroniza com prefers-color-scheme do SO enquanto o usuário não pinar manualmente
    useEffect(() => {
      if (typeof window === "undefined") return;
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (e: MediaQueryListEvent) => {
        if (localStorage.getItem(PIN_KEY) === "1") return; // usuário escolheu manualmente
        setThemeState(e.matches ? "dark" : "light");
      };
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }, []);

    const toggleTheme = () => {
      localStorage.setItem(PIN_KEY, "1");
      setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    };
    const setTheme = (t: Theme) => {
      localStorage.setItem(PIN_KEY, "1");
      setThemeState(t);
    };

    return (
      <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }
);

ThemeProvider.displayName = "ThemeProvider";

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
