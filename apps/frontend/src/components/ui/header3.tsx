import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ship, Plus, Sun, Moon } from "lucide-react";
// import { Notifications } from "../Notifications";
import { ProfileButton } from "./profilebutton";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
  size?: "default" | "icon";
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = "default", size = "default", onClick }) => {
  const baseClass = "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variantClasses = {
    default: "bg-black text-white hover:bg-black/70 dark:bg-white dark:text-black dark:hover:bg-white/80",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
  };
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    icon: "h-9 w-9",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`}
    >
      {children}
    </button>
  );
};

const Header3 = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("draftdock_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("draftdock_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("draftdock_theme", "light");
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 md:px-6 flex items-center justify-between transition-all duration-300">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 max-w-md flex-shrink-0">
        <Button
          variant="ghost"
          onClick={() => navigate("/blogs")}
          className="flex items-center gap-2 px-2 pl-1 text-[20px] font-semibold bg-transparent text-black dark:text-white hover:bg-transparent hover:text-black dark:hover:text-white focus:text-black dark:focus:text-white active:text-black dark:active:text-white font-serif tracking-tight"
        >
          <Ship className="h-6 w-6 text-black dark:text-white" />
          DraftDock
        </Button>
      </div>

      {/* Right: Buttons & User */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600" />
          )}
        </button>
        {/* <Notifications /> */}
        <ProfileButton variant="expandIcon" Icon={() => <Plus className="h-3 w-3 md:h-4 md:w-4" />} iconPlacement="right"
        onClick={() => navigate("/create-blog")}>
          Create
        </ProfileButton>
      </div>
    </header>
  );
};

export default Header3;
