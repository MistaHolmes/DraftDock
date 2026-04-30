import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Compass,
  FileEdit,
  Bookmark,
  LayoutDashboard,
  History,
  Trophy,
  MessageSquare,
  Settings,
  HelpCircle,
  Plus,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/drafts", icon: FileEdit, label: "Drafts" },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/history", icon: History, label: "History" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/contact", icon: HelpCircle, label: "Support" },
];

interface NewSidebarProps {
  activePage?: string;
}

export const NewSidebar: React.FC<NewSidebarProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-v2-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-v2-collapsed", String(collapsed));
  }, [collapsed]);

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-v2-collapsed", String(collapsed));
  }, [collapsed]);

  const isActive = (href: string) => {
    const page = href.replace("/", "");
    if (activePage) {
      return activePage === page;
    }
    return location.pathname === href;
  };

  const renderNavItem = (item: NavItem, isActiveItem: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.href}
        onClick={() => {
          navigate(item.href);
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 w-full transition-all duration-200 rounded-lg ${
          collapsed ? "justify-center px-3 py-3" : "pl-4 py-2.5"
        } ${
          isActiveItem
            ? "text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-400 font-bold bg-slate-200/50 dark:bg-slate-800/50"
            : "text-slate-600 dark:text-slate-400 hover:text-indigo-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-medium"
        }`}
      >
        <Icon
          size={20}
          className={`transition-transform duration-300 ${
            !isActiveItem ? "group-hover:scale-110" : ""
          }`}
          {...(isActiveItem ? { strokeWidth: 2.5 } : {})}
        />
        {!collapsed && (
          <span className="font-headline font-bold text-base tracking-tight">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-20 left-4 z-[80] p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[75] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-slate-100 dark:bg-slate-900 h-[calc(100vh-4.5rem)] fixed left-0 top-[4.5rem] flex flex-col py-6 px-3 z-[60] transition-all duration-300 overflow-y-auto ${
          collapsed ? "w-[72px]" : "w-60"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:sticky md:top-[4.5rem]`}
      >
        {/* Brand subtitle */}
        {!collapsed && (
          <div className="mb-6 px-2">
            <p className="text-xs font-label font-medium uppercase tracking-widest text-slate-500">
              The Technical Editorial
            </p>
          </div>
        )}

        {/* New Post Button */}
        <button
          onClick={() => navigate("/create-blog")}
          className={`mb-6 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-all duration-300 active:scale-95 ${
            collapsed ? "mx-1 p-3" : "mx-2 py-3 px-6"
          }`}
        >
          <Plus size={18} />
          {!collapsed && <span>New Post</span>}
        </button>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => renderNavItem(item, isActive(item.href)))}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-6 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1">
          {BOTTOM_ITEMS.map((item) => renderNavItem(item, isActive(item.href)))}

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-full py-2 mt-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* User info */}
          {user && (
            <div className={`mt-4 flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-3 w-full"
              >
                <img
                  src={
                    user.imageUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-indigo-100 dark:border-indigo-900 object-cover flex-shrink-0"
                />
                {!collapsed && (
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {user.emailAddresses?.[0]?.emailAddress || "Pro Account"}
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Close button for mobile */}
        <button
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          onClick={() => setMobileOpen(false)}
        >
          <X size={20} />
        </button>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
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

export default NewSidebar;
