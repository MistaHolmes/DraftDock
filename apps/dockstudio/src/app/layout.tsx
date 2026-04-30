import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DockStudio — AI App Builder · DraftDock",
  description:
    "DraftDock's AI-powered code-generation studio. Describe what you want, approve the plan, and watch your app come to life in-browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
        appearance={{
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorBackground: "hsl(var(--background))",
          colorInputBackground: "hsl(var(--input))",
          colorText: "hsl(var(--foreground))",
          colorTextSecondary: "hsl(var(--muted-foreground))",
          colorTextOnPrimaryBackground: "hsl(var(--primary-foreground))",
          colorNeutral: "hsl(var(--foreground))",
          borderRadius: "0.625rem",
        },
        elements: {
          card: "shadow-xl border",
          headerTitle: "font-bold",
          headerSubtitle: "",
          formButtonPrimary: "bg-accent text-accent-foreground",
          footerActionLink: "font-semibold",
          identityPreviewText: "",
          formFieldInput: "border focus:border-accent focus:ring-accent",
          dividerLine: "",
          dividerText: "",
          socialButtonsIconButton: "",
          navbar: "hidden",
          navbarMobileMenuButton: "hidden",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-background text-foreground`}
        >
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1708287984162194"
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
