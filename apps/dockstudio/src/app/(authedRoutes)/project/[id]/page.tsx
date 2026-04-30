"use client";

// Dynamic route — user-specific, never statically prerendered.
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useApi } from "@/lib/api";
import { useWebContainer } from "./hooks/useWebContainer";
import { useTheme } from "@/components/ThemeProvider";
import { CodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PrettyTerminal } from "@/components/PrettyTerminal";
import {
  Loader2,
  Play,
  CheckCircle,
  Eye,
  Send,
  Square,
  Wrench,
  ChevronRight,
  Cpu,
  Trash2,
  Sparkles,
  RefreshCw,
  Search,
  Moon,
  Sun,
  FolderClosed,
  GitBranch,
  ClipboardCheck,
  Puzzle,
  FileText,
  Code,
  Minus,
  X,
  CircleDot,
  XCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */
type PlanStep = {
  step_type: string;
  title: string;
  description: string;
  file_path?: string | null;
  content?: string | null;
};

type Task = {
  id: string;
  status: string;
  prompt: string;
  planJson: { steps: PlanStep[] } | null;
  steps?: {
    id: string;
    title: string;
    stepType: string;
    description: string;
  }[];
};

type SideTab = "tasks" | "files" | null;
type MainTab = "preview" | "editor";

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */
function langFromPath(path: string): string {
  const ext = path.split(".").pop() || "";
  const map: Record<string, string> = {
    js: "JavaScript",
    jsx: "JavaScript React",
    ts: "TypeScript",
    tsx: "TypeScript React",
    json: "JSON",
    css: "CSS",
    html: "HTML",
    md: "Markdown",
    py: "Python",
  };
  return map[ext] || "Plain Text";
}

function editorLang(path: string): string {
  const ext = path.split(".").pop() || "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    py: "python",
  };
  return map[ext] || "plaintext";
}

function stepIcon(step: PlanStep) {
  const p = step.file_path || "";
  if (p.endsWith(".html")) return "🌐";
  if (p.endsWith(".json")) return "📋";
  if (p.match(/\.[jt]sx?$/)) return "📄";
  if (p.includes("config")) return "⚙️";
  return "📝";
}

/* ═══════════════════════════════════════════════════════════════
   Resizable hook
   ═══════════════════════════════════════════════════════════════ */
function useResizable(
  dir: "h" | "v",
  initial: number,
  min: number,
  max: number,
  invert = false
) {
  const [size, setSize] = useState(initial);
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(initial);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startPos.current = dir === "h" ? e.clientX : e.clientY;
      startSize.current = size;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const raw =
          dir === "h"
            ? ev.clientX - startPos.current
            : ev.clientY - startPos.current;
        const d = invert ? -raw : raw;
        setSize(Math.min(max, Math.max(min, startSize.current + d)));
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = dir === "h" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [dir, size, min, max, invert]
  );

  return { size, onMouseDown };
}

/* ═══════════════════════════════════════════════════════════════
   Side icon button
   ═══════════════════════════════════════════════════════════════ */
function SideIcon({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center justify-center py-2.5 transition-all duration-200 relative ${
        active
          ? "text-primary bg-muted"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-primary rounded-r" />
      )}
      <Icon className="w-[18px] h-[18px]" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = React.use(params);
  const api = useApi();
  const { theme, toggle } = useTheme();
  const {
    instance,
    previewUrl,
    logs,
    isBooting,
    bootError,
    writeFiles,
    runCommand,
    killProcess,
    clearLogs,
    retryBoot,
  } = useWebContainer();

  /* ── Core state ──────────────────────────────────────────── */
  const [prompt, setPrompt] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState(false);

  /* ── Editor state ───────────────────────────────────────── */
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  /* ── IDE layout state ───────────────────────────────────── */
  const [sideTab, setSideTab] = useState<SideTab>("tasks");
  const [mainTab, setMainTab] = useState<MainTab>("preview");
  const [showTerminal, setShowTerminal] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Resizable panels ──────────────────────────────────── */
  const sidebar = useResizable("h", 288, 200, 480);
  const terminal = useResizable("v", 192, 80, 400, true);

  /* ── COI Service Worker (required for SharedArrayBuffer / WebContainer) ── */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/coi-serviceworker.js", { scope: "/" }).then((reg) => {
      // If a new SW was installed, reload once so it can activate and inject headers
      if (reg.installing || reg.waiting) {
        reg.installing?.addEventListener("statechange", (e) => {
          if ((e.target as ServiceWorker).state === "activated") {
            window.location.reload();
          }
        });
        reg.waiting?.addEventListener("statechange", (e) => {
          if ((e.target as ServiceWorker).state === "activated") {
            window.location.reload();
          }
        });
      }
    }).catch(console.error);
  }, []);

  /* ── Keyboard shortcut ⌘K → focus prompt ────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Load tasks ─────────────────────────────────────────── */
  useEffect(() => {
    api
      .get(`/api/projects/${projectId}/tasks`)
      .then((data: Task[]) => {
        setTasks(data);
        if (data.length > 0) {
          const first = data[0];
          setExpandedTask(first.id);
          setWorkspaceMode(true);
          // Pre-populate editor with files from first task's plan
          if (first.planJson) {
            const fileMap: Record<string, string> = {};
            for (const step of first.planJson.steps) {
              if (step.step_type === "create_file" && step.file_path && step.content) {
                fileMap[step.file_path] = step.content;
              }
            }
            if (Object.keys(fileMap).length > 0) {
              setFiles(fileMap);
              setActiveFile(Object.keys(fileMap)[0]);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Populate editor files when expanding a different task ── */
  useEffect(() => {
    if (!expandedTask) return;
    const task = tasks.find((t) => t.id === expandedTask);
    if (!task?.planJson) return;
    const fileMap: Record<string, string> = {};
    for (const step of task.planJson.steps) {
      if (step.step_type === "create_file" && step.file_path && step.content) {
        fileMap[step.file_path] = step.content;
      }
    }
    if (Object.keys(fileMap).length > 0) {
      setFiles((prev) => ({ ...fileMap, ...prev })); // task files first, keep any runtime edits
      setActiveFile((cur) => cur && fileMap[cur] ? cur : Object.keys(fileMap)[0]);
    }
  }, [expandedTask]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Actions ────────────────────────────────────────────── */
  const abortRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
  };

  const submitPrompt = async () => {
    if (!prompt.trim()) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    if (!workspaceMode) setWorkspaceMode(true);
    try {
      const task: Task = await api.post(
        `/api/projects/${projectId}/tasks`,
        { prompt },
        controller.signal
      );
      setTasks((prev) => [task, ...prev]);
      setExpandedTask(task.id);
      setPrompt("");
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return; // user stopped
      console.error("Plan generation failed", e);
    } finally {
      abortRef.current = null;
      setGenerating(false);
    }
  };

  const approveTask = async (taskId: string) => {
    setApprovingId(taskId);
    try {
      const updated: Task = await api.post(
        `/api/tasks/${taskId}/approve`,
        {}
      );
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (e) {
      console.error("Approve failed", e);
    } finally {
      setApprovingId(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    setDeletingId(taskId);
    try {
      await api.del(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (expandedTask === taskId) setExpandedTask(null);
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setDeletingId(null);
    }
  };

  const stopSandbox = () => {
    killProcess();
    setRunning(false);
  };

  const runTask = async (task: Task) => {
    if (!task.planJson || !instance) return;
    setRunning(true);
    clearLogs();
    setShowTerminal(true);
    setMainTab("preview");

    const fileMap: Record<string, string> = {};
    for (const step of task.planJson.steps) {
      if (step.step_type === "create_file" && step.file_path && step.content) {
        fileMap[step.file_path] = step.content;
      }
    }
    setFiles(fileMap);
    if (Object.keys(fileMap).length > 0)
      setActiveFile(Object.keys(fileMap)[0]);

    try {
      await writeFiles(fileMap);
      const code = await runCommand("npm", ["install"]);
      if (code !== 0) {
        await attemptRepair(task, fileMap);
        return;
      }
      await runCommand("npm", ["run", "dev"]);
    } catch (e) {
      console.error("Run failed", e);
    } finally {
      setRunning(false);
    }
  };

  const attemptRepair = async (
    task: Task,
    currentFiles: Record<string, string>
  ) => {
    setRepairing(true);
    try {
      const errorLog = logs.slice(-20).join("\n");
      const repairTask: Task = await api.post(
        `/api/tasks/${task.id}/repair`,
        { error_log: errorLog, files: currentFiles }
      );
      setTasks((prev) => [repairTask, ...prev]);
      setExpandedTask(repairTask.id);
    } catch (e) {
      console.error("Repair failed", e);
    } finally {
      setRepairing(false);
      setRunning(false);
    }
  };

  const handleFileEdit = async (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    await instance?.fs.writeFile(activeFile, value);
    try {
      await api.put(`/api/projects/${projectId}/files`, {
        path: activeFile,
        content: value,
        language: editorLang(activeFile),
      });
    } catch {
      /* silent */
    }
  };

  /* ── Derived ────────────────────────────────────────────── */
  const runnableTask = tasks.find(
    (t) => t.status === "approved" && t.planJson
  );
  const errorCount = logs.filter((l) =>
    /\[ERROR\]|ERR!|Error:/i.test(l)
  ).length;

  /* ── Loading skeleton ───────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">

        {/* ── Nav skeleton ─── */}
        <nav className="border-b border-border/60 bg-card/80 backdrop-blur-md shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-7 h-7 rounded-md" />
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-16 rounded hidden sm:block" />
              </div>
              {/* Right controls */}
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>
          </div>
        </nav>

        {/* ── Center hero skeleton ─── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-0">
          {/* Icon glow circle */}
          <Skeleton className="w-28 h-28 rounded-full mb-8" />

          {/* Title */}
          <Skeleton className="h-7 w-48 rounded-lg mb-3" />

          {/* Subtitle */}
          <Skeleton className="h-4 w-64 rounded mb-2" />
          <Skeleton className="h-4 w-44 rounded mb-10" />

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {[120, 144, 108, 160, 132].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* ── Prompt bar skeleton ─── */}
        <div className="px-4 pb-6 flex justify-center shrink-0">
          <div className="relative w-full max-w-2xl">
            <Skeleton className="h-[46px] w-full rounded-xl" />
            {/* Send button placeholder */}
            <Skeleton className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg" />
          </div>
        </div>

        {/* ── Footer hint skeleton ─── */}
        <div className="flex items-center justify-center gap-3 pb-5">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-3 w-2 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>

      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════ */
  /* RENDER                                                    */
  /* ═════════════════════════════════════════════════════════ */
  return (
    <LayoutGroup>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        {/* ────────────────── CHAT MODE ────────────────── */}
        <AnimatePresence>
          {!workspaceMode && (
            <motion.div
              key="chat"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -40, transition: { duration: 0.35 } }}
              className="flex-1 flex flex-col"
            >
              {/* Minimal header — matches main nav */}
              <nav className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-14">
                    <Link href="/main" className="flex items-center gap-2.5 group">
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
                      <button
                        onClick={toggle}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Toggle theme"
                      >
                        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </button>
                      <UserButton
                        appearance={{ elements: { avatarBox: "w-8 h-8" } }}
                      />
                    </div>
                  </div>
                </div>
              </nav>

              {/* Hero */}
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="relative w-28 h-28 mb-8"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/40 via-primary/20 to-emerald-400/20 blur-2xl" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-300/40 via-sky-200/30 to-emerald-200/20 opacity-60 blur-lg" />
                  <div className="relative flex items-center justify-center w-full h-full">
                    <Cpu className="w-9 h-9 text-foreground/60" />
                  </div>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="font-headline text-2xl font-bold text-foreground mb-2"
                >
                  Hi, I&apos;m DockStudio
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-muted-foreground text-sm mb-10"
                >
                  Send a message to begin building with AI
                </motion.p>
              </div>

              {/* Prompt bar */}
              <div className="px-4 pb-6 flex justify-center">
                <div className="relative w-full max-w-2xl">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type a message… (Shift+Enter for new line)"
                    rows={1}
                    className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitPrompt();
                      }
                    }}
                  />
                  {generating ? (
                    <button
                      onClick={stopGeneration}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all active:scale-95"
                      aria-label="Stop generation"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={submitPrompt}
                      disabled={!prompt.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-4 pb-5 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Powered by Claude AI
                </span>
                <span>·</span>
                <span>Part of DraftDock</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ──────────────── WORKSPACE / IDE MODE ──────────────── */}
        <AnimatePresence>
          {workspaceMode && (
            <motion.div
              key="ide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-screen"
            >
              {/* ══ IDE Header — matches main nav ════════════ */}
              <nav className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
                <div className="max-w-full mx-auto px-4">
                  <div className="flex items-center justify-between h-14">
                    {/* Brand */}
                    <Link href="/main" className="flex items-center gap-2.5 group shrink-0">
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

                    {/* Search / prompt input */}
                    <div className="flex-1 max-w-2xl px-8">
                      <div className="relative group">
                        <input
                          ref={inputRef}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe what to build next…"
                          className="w-full bg-muted border border-border/40 rounded-full px-10 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all placeholder:text-muted-foreground/50 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitPrompt();
                          }}
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                        {generating ? (
                          <button
                            onClick={stopGeneration}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                            aria-label="Stop generation"
                          >
                            <Square className="w-3 h-3 fill-current" />
                          </button>
                        ) : (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5 items-center opacity-60 group-focus-within:opacity-0 transition-opacity">
                            <kbd className="text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground leading-none">
                              ⌘
                            </kbd>
                            <kbd className="text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground leading-none">
                              K
                            </kbd>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={toggle}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Toggle theme"
                      >
                        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </button>
                      <UserButton
                        appearance={{ elements: { avatarBox: "w-8 h-8" } }}
                      />
                    </div>
                  </div>
                </div>
              </nav>

              {/* ══ Body ═════════════════════════════════════ */}
              <div className="flex-1 flex overflow-hidden">
                {/* ── Icon sidebar ─────────────────────────── */}
                <aside className="w-12 bg-card border-r border-border/40 flex flex-col items-center pt-2 gap-0.5 shrink-0">
                  <SideIcon
                    icon={ClipboardCheck}
                    label="Tasks"
                    active={sideTab === "tasks"}
                    onClick={() =>
                      setSideTab(sideTab === "tasks" ? null : "tasks")
                    }
                  />
                  <SideIcon
                    icon={FolderClosed}
                    label="Files"
                    active={sideTab === "files"}
                    onClick={() =>
                      setSideTab(sideTab === "files" ? null : "files")
                    }
                  />
                  <SideIcon
                    icon={Search}
                    label="Search"
                    onClick={() => inputRef.current?.focus()}
                  />
                </aside>

                {/* ── Tasks / Files sidebar ─────────────────── */}
                <AnimatePresence>
                  {sideTab && (
                    <motion.aside
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: sidebar.size, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ width: sidebar.size }}
                      className="bg-card border-r border-border/40 flex flex-col overflow-hidden shrink-0"
                    >
                      {/* ── TASKS panel ── */}
                      {sideTab === "tasks" && (
                        <>
                          <div className="px-4 pt-4 pb-3 border-b border-border/40">
                            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                              Tasks
                            </h2>
                            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                              dock-studio-main
                            </p>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {tasks.length === 0 && !generating && (
                              <p className="p-4 text-xs text-muted-foreground/60 leading-relaxed">
                                No tasks yet. Use the prompt bar above to
                                generate a plan.
                              </p>
                            )}

                            {generating && tasks.length === 0 && (
                              <div className="p-4 space-y-3 animate-pulse">
                                <div className="h-3 w-3/4 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted" />
                                <div className="h-3 w-5/6 rounded bg-muted" />
                              </div>
                            )}

                            <AnimatePresence mode="popLayout">
                              {tasks.map((task) => (
                                <motion.div
                                  key={task.id}
                                  layout
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{
                                    opacity: 0,
                                    x: -40,
                                    transition: { duration: 0.2 },
                                  }}
                                >
                                  {/* Task row */}
                                  <button
                                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/40 transition-colors group border-b border-border/20"
                                    onClick={() =>
                                      setExpandedTask(
                                        expandedTask === task.id
                                          ? null
                                          : task.id
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <motion.div
                                        animate={{
                                          rotate:
                                            expandedTask === task.id ? 90 : 0,
                                        }}
                                        transition={{ duration: 0.15 }}
                                      >
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                                      </motion.div>
                                      <span className="text-xs font-medium text-foreground truncate">
                                        {task.prompt}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter leading-none ${
                                          task.status === "approved"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : task.status === "planned"
                                              ? "bg-amber-500/20 text-amber-400"
                                              : task.status === "failed"
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {task.status}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTask(task.id);
                                        }}
                                        disabled={deletingId === task.id}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-all disabled:opacity-50"
                                      >
                                        {deletingId === task.id ? (
                                          <Loader2 className="w-3 h-3 text-red-400 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3 h-3 text-red-400" />
                                        )}
                                      </button>
                                    </div>
                                  </button>

                                  {/* Expanded steps */}
                                  <AnimatePresence>
                                    {expandedTask === task.id &&
                                      task.planJson && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="space-y-[1px] py-1">
                                            {task.planJson.steps.map(
                                              (s, i) => (
                                                <div
                                                  key={i}
                                                  onClick={() => {
                                                    if (s.file_path) {
                                                      // Ensure file is in the editor state
                                                      if (s.content) {
                                                        setFiles((prev) => ({
                                                          ...prev,
                                                          [s.file_path!]: s.content!,
                                                        }));
                                                      }
                                                      setActiveFile(s.file_path);
                                                      setMainTab("editor");
                                                    }
                                                  }}
                                                  className={`flex items-center gap-3 px-8 py-1.5 transition-colors ${
                                                    s.file_path
                                                      ? "hover:bg-muted/40 cursor-pointer"
                                                      : "cursor-default opacity-60"
                                                  } ${
                                                    activeFile === s.file_path && mainTab === "editor"
                                                      ? "bg-muted/60 text-primary"
                                                      : ""
                                                  }`}
                                                >
                                                  <span className="text-[13px] leading-none">
                                                    {stepIcon(s)}
                                                  </span>
                                                  <span className="text-[12px] text-muted-foreground truncate">
                                                    {s.title}
                                                  </span>
                                                  {s.file_path && (
                                                    <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono truncate max-w-[80px]">
                                                      {s.file_path.split("/").pop()}
                                                    </span>
                                                  )}
                                                </div>
                                              )
                                            )}
                                          </div>

                                          {/* Action buttons */}
                                          <div className="flex gap-2 px-8 py-2">
                                            {task.status === "planned" && (
                                              <Button
                                                size="sm"
                                                onClick={() =>
                                                  approveTask(task.id)
                                                }
                                                disabled={
                                                  approvingId === task.id
                                                }
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 h-7"
                                              >
                                                {approvingId === task.id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <CheckCircle className="w-3 h-3" />
                                                )}
                                                {approvingId === task.id
                                                  ? "Approving…"
                                                  : "Approve"}
                                              </Button>
                                            )}
                                            {task.status === "approved" &&
                                              bootError && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => window.location.reload()}
                                                  className="text-xs gap-1 text-amber-500 border-amber-500/30 h-7"
                                                >
                                                  <RefreshCw className="w-3 h-3" />{" "}
                                                  Reload Page
                                                </Button>
                                              )}
                                          </div>
                                        </motion.div>
                                      )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>

                          {/* Run in Sandbox / Stop button */}
                          <div className="p-3 bg-card border-t border-border/40">
                            {running ? (
                              <button
                                onClick={stopSandbox}
                                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-destructive/10"
                              >
                                <Square className="w-4 h-4" />
                                Stop
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  runnableTask && runTask(runnableTask)
                                }
                                disabled={
                                  !runnableTask ||
                                  isBooting ||
                                  !instance
                                }
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isBooting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                                {isBooting ? "Booting…" : "Run in Sandbox"}
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {/* ── FILES panel ── */}
                      {sideTab === "files" && (
                        <>
                          <div className="px-4 pt-4 pb-3 border-b border-border/40">
                            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                              Files
                            </h2>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {Object.keys(files).length === 0 ? (
                              <p className="p-4 text-xs text-muted-foreground/60">
                                No files generated yet.
                              </p>
                            ) : (
                              Object.keys(files).map((path) => (
                                <button
                                  key={path}
                                  onClick={() => {
                                    setActiveFile(path);
                                    setMainTab("editor");
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-[12px] font-mono truncate hover:bg-muted/40 transition-colors ${
                                    activeFile === path
                                      ? "bg-muted/60 text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
                                  {path}
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </motion.aside>
                  )}
                </AnimatePresence>

                {/* ── Sidebar resize handle ───────────────── */}
                {sideTab && (
                  <div
                    onMouseDown={sidebar.onMouseDown}
                    className="w-[3px] cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors shrink-0"
                  />
                )}

                {/* ══ Main content area ════════════════════ */}
                <main className="flex-1 flex flex-col bg-background overflow-hidden">
                  {/* Preview / Editor tabs */}
                  <div className="flex items-center h-9 border-b border-border/40 shrink-0 bg-card/40">
                    <button
                      onClick={() => setMainTab("preview")}
                      className={`h-full px-4 flex items-center gap-2 text-[12px] font-medium transition-colors relative ${
                        mainTab === "preview"
                          ? "text-primary"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                      {mainTab === "preview" && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMainTab("editor");
                        if (
                          !activeFile &&
                          Object.keys(files).length > 0
                        )
                          setActiveFile(Object.keys(files)[0]);
                      }}
                      className={`h-full px-4 flex items-center gap-2 text-[12px] font-medium transition-colors relative ${
                        mainTab === "editor"
                          ? "text-primary"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> Editor
                      {mainTab === "editor" && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                      )}
                    </button>

                    {/* Show terminal toggle if hidden */}
                    {!showTerminal && (
                      <button
                        onClick={() => setShowTerminal(true)}
                        className="ml-auto mr-3 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <CircleDot className="w-3 h-3" /> Terminal
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Preview or Editor */}
                    <div className="flex-1 overflow-hidden">
                      {mainTab === "preview" && (
                        <div className="h-full bg-background">
                          {previewUrl ? (
                            <iframe
                              src={previewUrl}
                              className="w-full h-full border-0"
                              title="Preview"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              {running ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                                  <p className="text-sm text-muted-foreground">
                                    Starting dev server…
                                  </p>
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, y: 16 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.4 }}
                                >
                                  <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-5 border border-border/40 mx-auto">
                                    <Eye className="w-8 h-8 text-muted-foreground/20" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-foreground mb-1.5">
                                    Ready to Preview
                                  </h3>
                                  <p className="text-muted-foreground/60 max-w-xs text-sm leading-relaxed">
                                    Preview will appear here after running a
                                    task in the sidebar.
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {mainTab === "editor" && (
                        <div className="h-full bg-background">
                          {activeFile ? (
                            <CodeEditor
                              value={files[activeFile] || ""}
                              language={editorLang(activeFile)}
                              onChange={handleFileEdit}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-sm text-muted-foreground/60">
                                Select a file from the sidebar to edit
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Terminal resize handle */}
                    {showTerminal && (
                      <div
                        onMouseDown={terminal.onMouseDown}
                        className="h-[3px] cursor-row-resize hover:bg-primary/30 active:bg-primary/50 transition-colors shrink-0"
                      />
                    )}

                    {/* Terminal */}
                    <AnimatePresence>
                      {showTerminal && (
                        <motion.section
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: terminal.size, opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ height: terminal.size }}
                          className="border-t border-border/40 flex flex-col shrink-0"
                        >
                          {/* Terminal header */}
                          <div className="flex items-center justify-between px-4 py-1.5 bg-card/50 border-b border-border/30 shrink-0">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Terminal
                              </span>
                              <span className="text-[10px] text-muted-foreground/40">
                                node v18.16.0
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={clearLogs}
                                className="px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => setShowTerminal(false)}
                                className="p-1 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setShowTerminal(false)}
                                className="p-1 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <PrettyTerminal
                              logs={logs}
                              className="h-full"
                            />
                          </div>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  </div>
                </main>
              </div>

              {/* ══ Status bar ════════════════════════════════ */}
              <footer className="h-6 bg-muted border-t border-border/40 flex items-center justify-between px-3 shrink-0 text-[11px]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground">main*</span>
                  </div>

                  {errorCount > 0 && (
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400" />
                      <span className="bg-red-500 text-white text-[10px] px-1 rounded font-bold leading-none">
                        {errorCount}
                      </span>
                      <span className="text-muted-foreground">Issues</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <CircleDot
                      className={`w-3 h-3 ${
                        instance
                          ? "text-emerald-400"
                          : isBooting
                            ? "text-amber-400 animate-pulse"
                            : "text-muted-foreground/40"
                      }`}
                    />
                    <span className="text-muted-foreground">
                      {instance
                        ? "Ready"
                        : isBooting
                          ? "Booting…"
                          : "Idle"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-muted-foreground/60">
                  <span>UTF-8</span>
                  {activeFile && <span>{langFromPath(activeFile)}</span>}
                  {repairing && (
                    <span className="text-orange-400 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Repairing
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-primary/60">
                    <CheckCircle className="w-3 h-3" />
                    <span>Prettier</span>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
