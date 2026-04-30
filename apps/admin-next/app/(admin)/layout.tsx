"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import MobileNav from "@/components/MobileNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading...
        </div>
      </div>
    );
  }

  const searchPlaceholders: Record<string, string> = {
    "/dashboard": "Search platform analytics...",
    "/content": "Search Content...",
    "/users": "Search authors, emails, or roles...",
    "/analytics": "Search analytics...",
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex overflow-hidden">
      <Sidebar activePage={pathname} />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background">
        <TopNav searchPlaceholder={searchPlaceholders[pathname] || "Search..."} />
        <div className="flex-1 bg-background">{children}</div>
      </main>
      <MobileNav activePage={pathname} />
    </div>
  );
}
