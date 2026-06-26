"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const THEMES = [
  { id: "dark", label: "Dark", preview: ["#030712", "#1f2937", "#2563eb"] },
  { id: "light", label: "Light", preview: ["#ffffff", "#f3f4f6", "#2563eb"] },
  { id: "catppuccin", label: "Catppuccin Mocha", preview: ["#1e1e2e", "#313244", "#89b4fa"] },
  { id: "nord", label: "Nord", preview: ["#2e3440", "#434c5e", "#88c0d0"] },
  { id: "dracula", label: "Dracula", preview: ["#282a36", "#343746", "#bd93f9"] },
  { id: "tokyonight", label: "Tokyo Night", preview: ["#1a1b26", "#24283b", "#7aa2f7"] },
  { id: "gruvbox", label: "Gruvbox", preview: ["#282828", "#3c3836", "#d65d0e"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("dark");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("finpilot-theme") as ThemeId | null;
    if (saved && THEMES.find((t) => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    setLoaded(true);
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("finpilot-theme", id);
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
