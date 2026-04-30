"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Visual default is dark (CSS :root); `.dark` class is used as the
  // light-mode override. So default theme state is "dark".
  const [theme, setTheme] = useState<Theme>("dark");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dockstudio-theme") as Theme | null;
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      // `.dark` class presence means light theme now (we inverted CSS vars).
      document.documentElement.classList.toggle("dark", stored === "light");
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("dockstudio-theme", next);
      // Add the `.dark` class when the visual theme should be light.
      document.documentElement.classList.toggle("dark", next === "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
