"use client";

import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

interface TopNavProps {
  searchPlaceholder?: string;
}

export default function TopNav({
  searchPlaceholder = "Search...",
}: TopNavProps) {
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        height: 64,
        backgroundColor: "var(--card)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        gap: 16,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 480 }}>
        <div style={{ position: "relative" }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              color: "var(--muted-foreground)",
              pointerEvents: "none",
            }}
          >
            search
          </span>
          <input
            className="input"
            placeholder={searchPlaceholder}
            type="text"
            style={{ paddingLeft: 40, paddingRight: 80, cursor: "pointer" }}
            readOnly
            onFocus={(e) => {
              e.target.blur();
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                ctrlKey: true,
                bubbles: true,
              });
              window.dispatchEvent(event);
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {["⌘", "K"].map((k) => (
              <kbd
                key={k}
                style={{
                  padding: "2px 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                  backgroundColor: "var(--muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  fontFamily: "inherit",
                }}
              >
                {k}
              </kbd>
            ))}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            title="Notifications"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              position: "relative",
              transition: "background 150ms ease, color 150ms ease",
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              notifications
            </span>
            <span
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                width: 7,
                height: 7,
                backgroundColor: "var(--danger)",
                borderRadius: "50%",
                border: "2px solid var(--card)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          </button>

          {showNotifications && (
            <div
              className="animate-fade-in"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 320,
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                boxShadow: "var(--shadow-lg)",
                overflow: "hidden",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                  Notifications
                </p>
                <span
                  className="badge badge-primary"
                  style={{ fontSize: 10 }}
                >
                  2 new
                </span>
              </div>
              {[
                { msg: "New user registered", time: "2 minutes ago", icon: "person_add" },
                { msg: "Post published successfully", time: "1 hour ago", icon: "check_circle" },
              ].map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: "var(--primary)" }}
                    >
                      {n.icon}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}>
                      {n.msg}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                      {n.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 28,
            backgroundColor: "var(--border)",
            margin: "0 4px",
          }}
        />

        {/* User Menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 6px 5px 5px",
              borderRadius: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "var(--muted)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
            }
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 2px 6px 0 rgb(124 58 237 / 0.3)",
              }}
            >
              A
            </div>
            <div
              className="hidden lg:block"
              style={{ textAlign: "left" }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.2 }}>
                Admin User
              </p>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                Super Admin
              </p>
            </div>
            <span
              className="material-symbols-outlined hidden lg:inline"
              style={{
                fontSize: 16,
                color: "var(--muted-foreground)",
                transform: showUserMenu ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 200ms ease",
              }}
            >
              expand_more
            </span>
          </button>

          {showUserMenu && (
            <div
              className="animate-fade-in"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 220,
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                boxShadow: "var(--shadow-lg)",
                overflow: "hidden",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                  Admin User
                </p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  admin@draftdock.com
                </p>
              </div>
              {[
                { icon: "person", label: "Profile" },
                { icon: "admin_panel_settings", label: "Settings" },
              ].map((item) => (
                <button
                  key={item.label}
                  style={{
                    width: "100%",
                    padding: "9px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--foreground)",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 500,
                    textAlign: "left",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = "var(--muted)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
                  }
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--danger)",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "var(--danger-bg)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
                }
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  logout
                </span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
