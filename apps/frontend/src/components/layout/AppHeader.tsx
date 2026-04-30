import { useState as useLocalState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Ship, Plus, Sun, Moon, Search } from "lucide-react";
import { Notifications } from "../Notifications";
import { ProfileButton } from "../ui/profilebutton";
import { useTheme } from "@/lib/ThemeContext";

interface AppHeaderProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  showSearch?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  showSearch = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [localSearch, setLocalSearch] = useLocalState(searchTerm || "");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    setSearchTerm?.(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-[60] border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl px-4 h-16 flex items-center justify-between transition-all duration-300">
      {/* Left: Brand */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            // if already on explore, go to public landing; otherwise go to explore
            if (location.pathname.startsWith("/explore")) navigate("/landing");
            else navigate("/explore");
          }}
          className="flex items-center gap-2 group transition-all"
        >
          <div className="bg-black dark:bg-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Ship className="h-5 w-5 text-white dark:text-black" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">
            DraftDock
          </span>
        </button>
      </div>

      {/* Center: Global Search */}
      {showSearch && (
        <div className="flex-1 max-w-xl mx-4 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
          <input
            type="text"
            placeholder="Search drafts, authors, tags..."
            className="w-full h-10 bg-gray-100 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-black border border-gray-100 dark:border-gray-800 focus:border-violet-500 rounded-xl pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-violet-500/10"
            value={localSearch}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
             <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 font-bold bg-white dark:bg-gray-800">⌘</kbd>
             <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 font-bold bg-white dark:bg-gray-800">K</kbd>
          </div>
        </div>
      )}

      {/* Right: User Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2">
            <Notifications />

            <ProfileButton
              variant="expandIcon"
              Icon={() => <Plus size={16} />}
              iconPlacement="right"
              onClick={() => navigate("/create-blog")}
              className="hidden sm:flex"
            >
              Draft
            </ProfileButton>

            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full border-2 border-transparent hover:border-violet-500 transition-all p-0.5 overflow-hidden"
            >
               <img
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`}
                 alt="Profile"
                 className="w-full h-full rounded-full object-cover"
               />
            </button>
        </div>
      </div>
    </header>
  );
};
