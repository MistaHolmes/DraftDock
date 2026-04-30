"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

const navSections = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
      { label: "Content", icon: "article", href: "/content" },
    ],
  },
  {
    label: "TEAM",
    items: [
      { label: "Users", icon: "group", href: "/users" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Analytics", icon: "bar_chart", href: "/analytics" },
    ],
  },
];

export default function Sidebar({ activePage }: { activePage: string }) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        backgroundColor: "var(--card)",
        borderRight: "1px solid var(--border)",
        transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1), min-width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        flexDirection: "column",
        height: "100vh",
        flexShrink: 0,
        overflowX: "hidden",
      }}
      className="hidden md:flex"
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "18px 14px 16px",
          borderBottom: "1px solid var(--border)",
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px 0 rgb(124 58 237 / 0.35)",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "#fff", fontVariationSettings: "'FILL' 1" }}
              >
                edit_square
              </span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2 }}>
                DraftDock
              </p>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 500 }}>
                Admin Portal
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            transition: "background 150ms ease, color 150ms ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--muted)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--muted-foreground)",
                  padding: "0 8px",
                  marginBottom: 6,
                }}
              >
                {section.label}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map((item) => {
                const isActive = activePage === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: collapsed ? "9px 0" : "9px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 13,
                      color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                      backgroundColor: isActive
                        ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                        : "transparent",
                      position: "relative",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--muted)";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--foreground)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted-foreground)";
                      }
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 20,
                          backgroundColor: "var(--primary)",
                          borderRadius: "0 4px 4px 0",
                        }}
                      />
                    )}
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 20,
                        color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                        transition: "all 150ms ease",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "9px 0" : "9px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--danger-bg)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>
            logout
          </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
