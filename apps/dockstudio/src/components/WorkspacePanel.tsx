"use client";

import { motion } from "framer-motion";

const panelEnter = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, delay, ease: "easeOut" as const },
  }),
};

/**
 * Rounded workspace panel with soft borders, optional header, and
 * a built-in loading-skeleton mode.
 */
export function WorkspacePanel({
  title,
  icon,
  headerRight,
  children,
  loading = false,
  delay = 0,
  className = "",
  style,
}: {
  title?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      custom={delay}
      variants={panelEnter}
      initial="hidden"
      animate="visible"
      style={style}
      className={`flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm ${className}`}
    >
      {/* Header bar */}
      {(title || icon || headerRight) && (
        <div className="flex items-center justify-between h-9 px-3 border-b border-border/50 bg-muted/40">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {title && (
              <span className="text-xs font-medium text-muted-foreground">
                {title}
              </span>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-1">{headerRight}</div>}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? <PanelSkeleton /> : children}
      </div>
    </motion.div>
  );
}

/** Skeleton placeholder for a panel in loading state */
function PanelSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-3 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <div className="h-16 w-full rounded-lg bg-muted mt-2" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}
