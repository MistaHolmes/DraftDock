import React from "react";
import { useNavigate } from "react-router-dom";
import { Ship, Search, Plus, ArrowRight, Moon, Sun, Compass } from "lucide-react";
import { Notifications } from "../Notifications";
import { ProfileButton } from "./profilebutton";
import { useTheme } from "@/lib/ThemeContext";

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 md:px-6 flex items-center justify-between transition-colors">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 max-w-md flex-shrink-0">
        <button
          onClick={() => navigate("/landing")}
          className="flex items-center gap-2 px-2 pl-1 text-[20px] font-semibold text-gray-900 dark:text-white font-serif tracking-tight hover:opacity-75 transition"
        >
          <Ship className="h-6 w-6 text-black dark:text-white" />
          DraftDock
        </button>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg mx-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search titles..."
          className="flex h-9 w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors pl-9 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex justify-end items-center">
          <Notifications />
        </div>

        <ProfileButton variant="expandIcon" Icon={() => <Compass className="h-3 w-3 md:h-4 md:w-4" />} iconPlacement="right" onClick={() => navigate("/explore")}>
          Explore
        </ProfileButton>

        <ProfileButton variant="expandIcon" Icon={() => <Plus className="h-3 w-3 md:h-4 md:w-4" />} iconPlacement="right" onClick={() => navigate("/create-blog")}>
          Create
        </ProfileButton>

        <ProfileButton variant="expandIcon" Icon={() => <ArrowRight className="h-4 w-4" />} iconPlacement="right" onClick={() => navigate("/profile")}>
          Profile
        </ProfileButton>
      </div>
    </header>
  );
};

export default Header;
