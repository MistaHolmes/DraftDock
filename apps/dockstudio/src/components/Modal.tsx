"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// ── Backdrop + panel animations ────────────────────────────
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 26, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

// ═══════════════════════════════════════════════
// Base Modal
// ═══════════════════════════════════════════════
export function Modal({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative bg-card rounded-2xl border border-border shadow-2xl shadow-black/10 w-full max-w-md overflow-hidden ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════
// Confirm Modal — replaces window.confirm()
// ═══════════════════════════════════════════════
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="font-headline text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 px-6 pb-5">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 ${
            variant === "danger"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════
// Prompt Modal — replaces window.prompt()
// ═══════════════════════════════════════════════
export function PromptModal({
  open,
  onClose,
  onSubmit,
  title = "Enter a value",
  description = "",
  placeholder = "",
  submitLabel = "Create",
  cancelLabel = "Cancel",
  initialValue = "",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(initialValue);

  // Reset & autofocus on open
  useEffect(() => {
    if (open) {
      valueRef.current = initialValue;
      // Small delay so the animation renders first, then focus
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, initialValue]);

  const handleSubmit = () => {
    const val = valueRef.current.trim();
    if (!val) return;
    onSubmit(val);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 pb-4">
        <h2 className="font-headline text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        <input
          ref={inputRef}
          type="text"
          defaultValue={initialValue}
          onChange={(e) => (valueRef.current = e.target.value)}
          placeholder={placeholder}
          className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>
      <div className="flex items-center justify-end gap-2 px-6 pb-5">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all active:scale-95"
        >
          {submitLabel}
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════
// New Project Modal — name + description
// ═══════════════════════════════════════════════
export function NewProjectModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
  loading?: boolean;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const nameVal = useRef("");
  const descVal = useRef("");

  useEffect(() => {
    if (open) {
      nameVal.current = "";
      descVal.current = "";
      const t = setTimeout(() => nameRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = () => {
    const name = nameVal.current.trim();
    if (!name) return;
    onSubmit({ name, description: descVal.current.trim() });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 pb-4">
        <h2 className="font-headline text-lg font-semibold text-foreground">
          New Project
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Give your project a name and optional description to get started.
        </p>

        <label className="block mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          Project Name
        </label>
        <input
          ref={nameRef}
          type="text"
          onChange={(e) => (nameVal.current = e.target.value)}
          placeholder="My awesome app"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        <label className="block mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          Description <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          onChange={(e) => (descVal.current = e.target.value)}
          placeholder="A short description of what this project does…"
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 px-6 pb-5">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Project"}
        </button>
      </div>
    </Modal>
  );
}
