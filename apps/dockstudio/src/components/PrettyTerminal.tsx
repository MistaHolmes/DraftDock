"use client";

import React, { useRef, useEffect, useMemo } from "react";

/* ── Strip ANSI escape codes ────────────────────────────────── */
// eslint-disable-next-line no-control-regex
const ANSI_RE = /[\u001b\u009b]([[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~])))/g;
function stripAnsi(s: string) { return s.replace(ANSI_RE, ""); }

/* ── Line classification ────────────────────────────────────── */
type LineKind = "command" | "error" | "warning" | "success" | "info" | "dim" | "plain" | "vite-ready" | "vite-url" | "vite-hint";

function classifyLine(raw: string): LineKind {
  const t = stripAnsi(raw).trim();
  if (t.startsWith("$") || t.startsWith(">")) return "command";
  if (/^\[ERROR\]|^error|ERR!|Error:|ENOENT|EACCES|FATAL|panic/i.test(t)) return "error";
  if (/^warn|WARNING|⚠/i.test(t)) return "warning";
  if (/^✓|✔|success|added \d+ package|up to date/i.test(t)) return "success";
  if (/^VITE\s+v\d/i.test(t)) return "vite-ready";
  if (/^➜\s+(Local|Network)/i.test(t)) return "vite-url";
  if (/^➜\s+press/i.test(t)) return "vite-hint";
  if (/^info |^npm (warn|notice)|^\s*\d+ packages/i.test(t)) return "info";
  if (t === "" || /^[\s─│└├┼┤┘┐┌┬]+$/.test(t)) return "dim";
  return "plain";
}

const kindStyles: Record<LineKind, string> = {
  command:    "text-sky-400 font-semibold",
  error:      "text-red-400",
  warning:    "text-amber-400",
  success:    "text-emerald-400",
  info:       "text-slate-400",
  dim:        "text-slate-600",
  plain:      "text-slate-300",
  "vite-ready": "",
  "vite-url":   "",
  "vite-hint":  "",
};

/* ── Vite-specific pretty rows ──────────────────────────────── */
function ViteReadyLine({ raw }: { raw: string }) {
  const clean = stripAnsi(raw).trim();
  // e.g. "VITE v4.5.14  ready in 4372 ms"
  const m = clean.match(/^(VITE)\s+(v[\d.]+)\s+(.+)$/);
  if (!m) return <div className="text-emerald-400 font-bold">{clean}</div>;
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold tracking-wide text-[10px]">VITE</span>
      <span className="text-emerald-300 font-semibold">{m[2]}</span>
      <span className="text-slate-400">{m[3]}</span>
    </div>
  );
}

function ViteUrlLine({ raw }: { raw: string }) {
  const clean = stripAnsi(raw).trim();
  // e.g. "➜  Local:   http://localhost:5174/"
  const m = clean.match(/^➜\s+(Local|Network):\s+(.+)$/);
  const label = m?.[1] ?? "";
  const url   = m?.[2]?.trim() ?? clean;
  return (
    <div className="flex items-center gap-2">
      <span className="text-emerald-500">➜</span>
      <span className="w-[52px] text-slate-400 font-semibold">{label}</span>
      <span className="text-cyan-300 underline-offset-2 hover:underline">{url}</span>
    </div>
  );
}

function ViteHintLine({ raw }: { raw: string }) {
  const clean = stripAnsi(raw).trim();
  return <div className="text-slate-600 italic">{clean}</div>;
}

/* ── Oh-My-Posh style prompt ────────────────────────────────── */
function OmpPrompt({ command }: { command: string }) {
  return (
    <div className="mt-2 first:mt-0 flex flex-col gap-[2px]">
      {/* Prompt row */}
      <div className="flex items-center flex-wrap gap-x-[2px] leading-5">
        {/* @runner segment */}
        <span className="text-[#ff6e6e] font-semibold">@runner</span>
        {/* arrow */}
        <span className="text-slate-300 mx-1">→</span>
        {/* directory */}
        <span className="text-cyan-300 font-semibold">website</span>
        {/* git badge */}
        <span className="text-amber-400 ml-1">
          git<span className="text-slate-300">(</span>
          <span className="text-amber-300">main</span>
          <span className="text-slate-300">)</span>
        </span>
        {/* chevron separator */}
        <span className="text-emerald-400 ml-2 font-bold">❯</span>
        {/* command */}
        <span className="text-slate-100 ml-1 font-semibold">{command}</span>
      </div>
    </div>
  );
}

/* ── Blinking cursor ────────────────────────────────────────── */
function IdleCursor() {
  return (
    <div className="mt-2 flex items-center gap-x-[2px] leading-5">
      <span className="text-[#ff6e6e] font-semibold">@runner</span>
      <span className="text-slate-300 mx-1">→</span>
      <span className="text-cyan-300 font-semibold">website</span>
      <span className="text-amber-400 ml-1">
        git<span className="text-slate-300">(</span>
        <span className="text-amber-300">main</span>
        <span className="text-slate-300">)</span>
      </span>
      <span className="text-emerald-400 ml-2 font-bold">❯</span>
      {/* blinking block cursor */}
      <span className="ml-1 inline-block w-[7px] h-[13px] bg-slate-300 animate-pulse" />
    </div>
  );
}

/* ── Window chrome (traffic-light buttons) ──────────────────── */
function TitleBar() {
  return (
    <div className="flex items-center gap-2 px-4 py-[10px] bg-[#161920] border-b border-[#1e2129] select-none shrink-0">
      <span className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm" />
      <span className="w-3 h-3 rounded-full bg-[#febc2e] shadow-sm" />
      <span className="w-3 h-3 rounded-full bg-[#28c840] shadow-sm" />
      <span className="ml-auto text-[11px] text-slate-500 tracking-wide">ohmyposh.dev</span>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────── */
export function PrettyTerminal({
  logs,
  className = "",
}: {
  logs: string[];
  className?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const lines = useMemo(() => {
    const joined = logs.join("");
    if (!joined) return [];
    // Strip ANSI before splitting so control sequences don't bleed across lines
    return stripAnsi(joined).split("\n");
  }, [logs]);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-[#1e2129] shadow-2xl bg-[#0d0f14] font-mono text-[14px] ${className}`}
    >
      <TitleBar />

      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-4 leading-5 custom-scrollbar">
        {lines.length === 0 ? (
          <>
            <IdleCursor />
          </>
        ) : (
          <>
            {lines.map((line, i) => {
              const kind = classifyLine(line);
              if (kind === "command") {
                const rest = line.replace(/^[$>]\s*/, "");
                return <OmpPrompt key={i} command={rest} />;
              }
              if (kind === "vite-ready") return <ViteReadyLine key={i} raw={line} />;
              if (kind === "vite-url")   return <ViteUrlLine key={i} raw={line} />;
              if (kind === "vite-hint")  return <ViteHintLine key={i} raw={line} />;
              return (
                <div key={i} className={`leading-5 ${kindStyles[kind]}`}>
                  {line || "\u00A0"}
                </div>
              );
            })}
            {/* idle cursor after last line */}
            <IdleCursor />
          </>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
