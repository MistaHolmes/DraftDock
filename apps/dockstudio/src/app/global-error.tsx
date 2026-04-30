"use client";

// global-error.tsx — catches errors that happen in the root layout itself.
// Must include its own <html> and <body> because the root layout is unavailable.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "1.5rem",
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            A critical error occurred. Please reload the page.
            {error.digest && (
              <span style={{ display: "block", marginTop: "0.25rem", fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.4 }}>
                ID: {error.digest}
              </span>
            )}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "transparent",
                color: "hsl(var(--muted-foreground))",
                fontWeight: 500,
                fontSize: "0.875rem",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
              }}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
