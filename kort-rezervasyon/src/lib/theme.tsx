"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "theme1" | "theme2" | "theme3";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  nextTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("theme1");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && ["theme1", "theme2", "theme3"].includes(saved)) {
      setThemeState(saved);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const nextTheme = () => {
    const themes: Theme[] = ["theme1", "theme2", "theme3"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, nextTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const defaultTheme: ThemeContextType = {
  theme: "theme1",
  setTheme: () => {},
  nextTheme: () => {},
};

export function useTheme() {
  return useContext(ThemeContext) ?? defaultTheme;
}
