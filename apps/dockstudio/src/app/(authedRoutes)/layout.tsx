"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Cpu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith("/project/");

  useEffect(() => {
    // Sync user with backend
    const sync = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (apiUrl) {
          await fetch(`${apiUrl}/api/users/sync`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {
        // Backend not running yet — this is fine during initial setup
      }
    };
    sync();
  }, [getToken]);

  // Project pages render their own IDE chrome — skip the shared nav
  if (isProjectPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="font-headline text-[15px] font-bold text-foreground tracking-tight">
                DockStudio
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-widest uppercase text-muted-foreground border border-border bg-muted">
                DraftDock
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {children}
    </div>
  );
}
