import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Notifications } from "../Notifications";
import { useAuth } from "@clerk/clerk-react";

interface HeaderProps {
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useAuth();

  const isProfile = location.pathname === "/profile";
  const isBlogs = location.pathname === "/blogs";

  const handleLogoClick = () => {
    if (isBlogs) {
      navigate("/landing");
    } else if (isSignedIn) {
      navigate("/blogs");
    } else {
      navigate("/landing");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-transparent">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-12">
          <button
            onClick={handleLogoClick}
            className="text-2xl font-bold tracking-tighter text-black dark:text-white font-headline"
          >
            DraftDock.app
          </button>
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate("/blogs")}
              className={`font-medium font-headline tracking-tight transition-colors ${
                isBlogs
                  ? "text-black dark:text-white font-bold border-b-2 border-black dark:border-white pb-1"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => navigate("/profile")}
              className={`font-medium font-headline tracking-tight transition-colors ${
                isProfile
                  ? "text-black dark:text-white font-bold border-b-2 border-black dark:border-white pb-1"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              My Profile
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {setSearchTerm && (
            <div className="bg-surface-container-high px-4 py-2 rounded-lg hidden md:flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-400 text-sm">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body outline-none"
                placeholder="Search..."
                type="text"
                value={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center">
             <Notifications />
          </div>
          <button
            onClick={() => navigate("/create-blog")}
            className="bg-primary text-on-primary px-6 py-2 rounded-md font-headline font-bold text-sm hover:opacity-80 transition-all active:scale-95"
          >
            Write
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
