"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      login(data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "var(--background)",
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 20% -10%, color-mix(in srgb, var(--primary) 10%, transparent), transparent),
          radial-gradient(ellipse 60% 50% at 80% 110%, color-mix(in srgb, var(--primary) 8%, transparent), transparent)
        `,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
              borderRadius: 18,
              marginBottom: 16,
              boxShadow: "0 8px 24px 0 rgb(124 58 237 / 0.35)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: "#fff", fontVariationSettings: "'FILL' 1" }}
            >
              edit_square
            </span>
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--foreground)",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              fontFamily: "var(--font-sans)",
            }}
          >
            DraftDock
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--muted-foreground)",
              marginTop: 6,
              fontWeight: 500,
            }}
          >
            Admin Portal — Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {error && (
            <div
              className="animate-slide-up"
              style={{
                marginBottom: 20,
                padding: "10px 14px",
                borderRadius: 10,
                backgroundColor: "var(--danger-bg)",
                border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                color: "var(--danger)",
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>
                error
              </span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Username */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  marginBottom: 7,
                  letterSpacing: "0.02em",
                }}
              >
                Username
              </label>
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
                  person
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="input"
                  style={{ paddingLeft: 40 }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  marginBottom: 7,
                  letterSpacing: "0.02em",
                }}
              >
                Password
              </label>
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
                  lock
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="input"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted-foreground)",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                    borderRadius: 6,
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)")
                  }
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-glow"
              style={{
                width: "100%",
                marginTop: 4,
                padding: "12px 24px",
                fontSize: 14,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, animation: "spin 1s linear infinite" }}
                  >
                    progress_activity
                  </span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                    login
                  </span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <div
            style={{
              marginTop: 20,
              padding: "10px 14px",
              borderRadius: 10,
              backgroundColor: "var(--surface-inset, var(--muted))",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: "var(--muted-foreground)", flexShrink: 0 }}
            >
              info
            </span>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500 }}>
              Default credentials: <strong style={{ color: "var(--foreground)" }}>admin</strong> / <strong style={{ color: "var(--foreground)" }}>admin</strong>
            </p>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--muted-foreground)",
            marginTop: 20,
          }}
        >
          DraftDock Admin Panel • Secure Access Only
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
