"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        aria-label="Toggle theme"
        disabled
      >
        <span
          className="material-symbols-outlined opacity-0"
          style={{ fontSize: "20px", color: "var(--muted-foreground)" }}
        >
          dark_mode
        </span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
      style={{
        backgroundColor: "transparent",
        color: "var(--muted-foreground)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--muted)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "20px",
          fontVariationSettings: "'FILL' 1",
          transition: "transform 300ms ease",
        }}
      >
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
