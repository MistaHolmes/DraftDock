import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Search, Sun, Moon, Plus, Menu, X, Users, Compass, User } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { Notifications } from "../Notifications";

interface NewHeaderProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  showSearch?: boolean;
}

export const NewHeader: React.FC<NewHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  showSearch = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [localSearch, setLocalSearch] = useState(searchTerm || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    setSearchTerm?.(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localSearch.trim()) {
      navigate(`/explore?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const navItems = [
    { label: "DockStudio", href: "https://dockstudio.abhasbehera.in/", external: true },
    { label: "Explore", href: "/explore" },
    { label: "Collaborate", href: "/collaborate" },
    { label: "My Profile", href: "/profile" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed top-0 w-full z-[100] bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex justify-between items-center px-6 py-4 w-full">
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-12">
          <button
            onClick={() => {
              if (location.pathname.startsWith("/explore")) navigate("/landing");
              else navigate("/explore");
            }}
            className="text-2xl font-bold tracking-tighter text-black dark:text-white font-headline"
          >
            DraftDock.app
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const commonClass = `font-medium font-headline tracking-tight transition-colors flex items-center gap-1.5 ${
                isActive(item.href)
                  ? "text-black dark:text-white font-bold border-b-2 border-black dark:border-white pb-1"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`;

              // External links (open in new tab)
              if ((item as any).external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={commonClass}
                  >
                    <span>{item.label}</span>
                  </a>
                );
              }

              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={commonClass}
                >
                  {item.label === "Explore" && <Compass size={15} />}
                  {item.label === "Collaborate" && <Users size={15} />}
                  {item.label === "My Profile" && <User size={15} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-4">
          {/* Search bar (desktop) */}
          {showSearch && (
            <div className="hidden sm:flex bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-lg items-center gap-2">
              <Search className="text-zinc-400 w-4 h-4" />
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-48 text-gray-900 dark:text-white placeholder:text-zinc-400"
                placeholder="Search insights..."
                type="text"
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-yellow-500" />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {/* Notifications */}
          <Notifications />

          {/* Write button */}
          <button
            onClick={() => navigate("/create-blog")}
            className="hidden sm:flex bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-md font-headline font-bold text-sm hover:opacity-80 transition-all active:scale-95 items-center gap-2"
          >
            <Plus size={16} />
            Write
          </button>

          {/* Profile avatar */}
          {user && (
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-indigo-500 transition-all"
            >
              <img
                src={
                  user.imageUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                navigate(item.href);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 font-headline font-medium ${
                isActive(item.href)
                  ? "text-black dark:text-white font-bold"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {item.label === "Explore" && <Compass size={16} />}
                {item.label === "Collaborate" && <Users size={16} />}
                {item.label === "My Profile" && <User size={16} />}
                <span>{item.label}</span>
              </div>
            </button>
          ))}
          {showSearch && (
            <div className="flex bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-lg items-center gap-2 mt-2">
              <Search className="text-zinc-400 w-4 h-4" />
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm flex-1 text-gray-900 dark:text-white placeholder:text-zinc-400"
                placeholder="Search insights..."
                type="text"
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default NewHeader;
