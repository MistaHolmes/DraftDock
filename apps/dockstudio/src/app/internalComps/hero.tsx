"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Sparkles,
  Zap,
  Code2,
  Terminal,
  Eye,
  Layers,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-headline text-[17px] font-bold text-white tracking-tight">
            DockStudio
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button
              variant="ghost"
              size="sm"
              className="text-violet-200 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:opacity-95 font-semibold gap-1.5 px-5 dark:bg-white dark:text-[#00042e]"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {/* Link back to original DraftDock site */}
          <a
            href="https://www.draftdocks.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-200 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 px-3 py-2 rounded-md"
          >
            DraftDock
          </a>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </nav>

      {/* ── Hero content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-violet-500/15 border border-violet-400/20 text-violet-300 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            A DraftDock Feature
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="font-headline text-5xl sm:text-6xl md:text-8xl font-bold text-center text-white mb-5 tracking-tighter leading-[0.95]"
        >
          Build apps with
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            AI in real-time
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-base md:text-lg text-violet-200/70 text-center max-w-xl mb-4 tracking-tight leading-relaxed"
        >
          Describe what you want. AI generates the plan. Approve it.
          <br className="hidden sm:block" /> Watch your app run live in the browser.
        </motion.p>

        {/* DraftDock hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-xs text-violet-400/50 mb-12 uppercase tracking-[0.2em]"
        >
          Part of the DraftDock platform
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-24"
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="gap-2 bg-accent text-accent-foreground hover:opacity-95 font-headline font-semibold px-8 active:scale-95 transition-all shadow-lg shadow-accent/20 dark:bg-white dark:text-[#00042e]"
            >
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-violet-400/30 text-violet-200 hover:bg-violet-500/10 hover:text-white hover:border-violet-400/50 px-8 transition-all backdrop-blur-sm"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full"
        >
          <FeatureCard
            icon={<Sparkles className="w-5 h-5 text-violet-400" />}
            title="AI Plan Generation"
            description="Describe your app in plain English. Claude AI creates a step-by-step build plan you can approve or refine."
          />
          <FeatureCard
            icon={<Code2 className="w-5 h-5 text-indigo-400" />}
            title="Live Code Editor"
            description="Edit files in a VS Code-quality Monaco editor with full syntax highlighting and IntelliSense."
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5 text-purple-400" />}
            title="Instant Preview"
            description="Your app runs in a WebContainer sandbox. See changes in real-time with hot module reload."
          />
        </motion.div>
      </div>

      {/* ── How it works ── */}
      <div className="relative z-10 py-24 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-white text-center mb-4 tracking-tight">
            How it works
          </h2>
          <p className="text-violet-300/60 text-center mb-16 text-sm max-w-md mx-auto">
            Three simple steps from idea to running application
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step="01"
              icon={<Terminal className="w-5 h-5" />}
              title="Describe"
              description="Tell the AI what you want to build using natural language. No jargon needed."
            />
            <StepCard
              step="02"
              icon={<Eye className="w-5 h-5" />}
              title="Review & Approve"
              description="AI generates a detailed task plan. Review each step and approve to start building."
            />
            <StepCard
              step="03"
              icon={<Layers className="w-5 h-5" />}
              title="Watch it Build"
              description="Code is generated, dependencies installed, and your app runs live — all in the browser."
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
    >
      {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#00042e]" />}
    </button>
  );
}

/* ── Feature card ── */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.07] hover:border-violet-400/25 transition-all duration-300 dark:bg-white/[0.98] dark:border-slate-200 dark:hover:border-violet-200">
      <div className="mb-3 p-2.5 w-fit rounded-lg bg-violet-500/10 border border-violet-400/15">
        {icon}
      </div>
      <h3 className="font-headline text-[15px] font-semibold text-white mb-1.5 dark:text-[#00042e]">
        {title}
      </h3>
      <p className="text-[13px] text-violet-200/50 leading-relaxed dark:text-slate-600">
        {description}
      </p>
    </div>
  );
}

/* ── Step card ── */
function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: parseInt(step) * 0.12 }}
      className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm dark:bg-white/[0.98] dark:border-slate-200"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] font-bold tracking-widest text-violet-400/60 uppercase">
          Step {step}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-400/20 to-transparent" />
      </div>
      <div className="mb-3 p-2.5 w-fit rounded-lg bg-violet-500/10 border border-violet-400/15 text-violet-400 dark:text-violet-600">
        {icon}
      </div>
      <h3 className="font-headline text-lg font-semibold text-white mb-2 dark:text-[#00042e]">{title}</h3>
      <p className="text-sm text-violet-200/50 leading-relaxed dark:text-slate-600">{description}</p>
    </motion.div>
  );
}
