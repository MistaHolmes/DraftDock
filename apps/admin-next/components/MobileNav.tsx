"use client";

import Link from "next/link";

const navItems = [
  { label: "Home", icon: "dashboard", href: "/dashboard" },
  { label: "Posts", icon: "description", href: "/content" },
  { label: "Users", icon: "group", href: "/users" },
  { label: "Data", icon: "monitoring", href: "/analytics" },
];

export default function MobileNav({ activePage }: { activePage: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around items-center h-16 px-2 z-50 shadow-lg">
      {navItems.map((item) => {
        const isActive = activePage === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all ${
              isActive ? "text-violet-600 bg-violet-50" : "text-slate-500"
            }`}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
