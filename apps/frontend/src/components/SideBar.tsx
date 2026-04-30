import React, { useState, useEffect, useRef } from "react";
import {
  LayoutGrid, FileDiff, Compass, Bookmark, BarChart2, Settings,
  Menu, X, Search, History, Trophy, MessageSquare, ChevronLeft, ChevronRight
} from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

interface Blog {
  id: string;
  title: string;
  summary: string;
  authorId: string;
  updatedAt: Date;
  published: string;
  tags?: string[];
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

const NAV_ITEMS = [
  { href: "/blogs", icon: LayoutGrid, label: "Dock" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/drafts", icon: FileDiff, label: "Drafts" },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/dashboard", icon: BarChart2, label: "Dashboard" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/history", icon: History, label: "History" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 5); // Dock, Explore, Drafts, Bookmarks, Dashboard

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, active, collapsed }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      title={collapsed ? label : undefined}
      className={`
        group relative flex items-center gap-3 w-full rounded-xl transition-all duration-200
        ${collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5"}
        ${active
          ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
        }
      `}
    >
      {/* Active indicator bar */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-600 dark:bg-violet-400 rounded-r-full" />
      )}
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && (
        <span className="text-sm font-medium truncate">{label}</span>
      )}
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
          {label}
        </div>
      )}
    </button>
  );
};

const cachedUserBlogs: Record<string, Blog[]> = {};

const Sidebar: React.FC<{ activePage?: string }> = ({ activePage = "dock" }) => {
  const { user, isLoaded } = useUser();
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Admin feature removed — no admin check
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const navigate = useNavigate();
  const location = useLocation();
  const hasFetchedUserBlogs = useRef(false);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // (Removed admin check — frontend no longer queries /api/admin/check)

  useEffect(() => {
    if (!isLoaded || !user || !user.id) return;
    if (cachedUserBlogs[user.id]) setUserBlogs(cachedUserBlogs[user.id]);

    if (!hasFetchedUserBlogs.current || !cachedUserBlogs[user.id]) {
      hasFetchedUserBlogs.current = true;
      const API_URL = import.meta.env.VITE_API_URL;
      axios
        .get(`${API_URL}/api/user/blogs`, { withCredentials: true })
        .then((res) => {
          const blogs = res.data.blogs.map((b: any) => ({
            id: b.id,
            title: b.title,
            summary: b.content.slice(0, 150) + "...",
            authorId: b.authorId,
            updatedAt: new Date(b.updatedAt),
            published: new Date(b.updatedAt).toLocaleDateString(),
            tags: b.tags || [],
          }));
          cachedUserBlogs[user.id] = blogs;
          setUserBlogs(blogs);
        })
        .catch((err) => console.error("Error fetching user blogs:", err));
    }
  }, [user, isLoaded]);

  // Detect active page from location
  const getActivePage = () => {
    const path = location.pathname;
    if (path === "/blogs") return "dock";
    return path.replace("/", "") || "dock";
  };

  const currentActive = activePage || getActivePage();

  // Map activePage to href path
  const isActive = (href: string) => {
    const page = href.replace("/", "");
    if (currentActive === "dock" && page === "blogs") return true;
    return currentActive === page;
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-[70] p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[65] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-950 border-r border-gray-200/80 dark:border-gray-800/80
          z-[70] flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto md:z-auto
        `}
      >
        {/* Header */}
        <div className={`flex items-center h-16 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 ${collapsed ? "justify-center px-3" : "justify-between px-4"}`}>
          {!collapsed && (
            <button
              onClick={() => { navigate("/blogs"); setMobileOpen(false); }}
              className="text-lg font-headline font-bold text-gray-900 dark:text-white tracking-tight"
            >
              DraftDock
            </button>
          )}

          {/* Close on mobile */}
          <button
            className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={<item.icon size={18} />}
              label={item.label}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}

          {/* Admin feature removed */}

          {/* Your Blogs section (expanded only) */}
          {!collapsed && userBlogs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-2 px-3">
                Your Blogs
              </h4>
              {userBlogs.slice(0, 5).map((blog) => (
                <button
                  key={blog.id}
                  onClick={() => { navigate(`/blog/${blog.id}`); setMobileOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-lg transition-colors truncate"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <span className="truncate">{blog.title.length > 22 ? blog.title.slice(0, 22) + "…" : blog.title}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Footer: User info */}
        {user && (
          <div className={`flex-shrink-0 border-t border-gray-100 dark:border-gray-800 p-3 ${collapsed ? "flex justify-center" : ""}`}>
            <button
              onClick={() => { navigate("/profile"); setMobileOpen(false); }}
              className={`flex items-center gap-3 w-full rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800/60 ${collapsed ? "justify-center p-2" : "p-2"}`}
            >
              <img
                src={user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700"
              />
              {!collapsed && (
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {user.emailAddresses?.[0]?.emailAddress || ""}
                  </p>
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                  active
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;