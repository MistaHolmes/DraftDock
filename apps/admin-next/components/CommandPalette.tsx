"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Command {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const commands: Command[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: "dashboard",
      action: () => router.push("/dashboard"),
      category: "Navigation",
    },
    {
      id: "content",
      label: "Go to Content",
      icon: "article",
      action: () => router.push("/content"),
      category: "Navigation",
    },
    {
      id: "users",
      label: "Go to Users",
      icon: "group",
      action: () => router.push("/users"),
      category: "Navigation",
    },
    {
      id: "analytics",
      label: "Go to Analytics",
      icon: "bar_chart",
      action: () => router.push("/analytics"),
      category: "Navigation",
    },
    {
      id: "new-post",
      label: "Create New Post",
      icon: "add_circle",
      action: () => alert("Create post modal"),
      category: "Actions",
    },
    {
      id: "invite-user",
      label: "Invite User",
      icon: "person_add",
      action: () => alert("Invite user modal"),
      category: "Actions",
    },
    {
      id: "export",
      label: "Export Report",
      icon: "download",
      action: () => alert("Export report"),
      category: "Actions",
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCommand = (cmd: Command) => {
    cmd.action();
    setIsOpen(false);
    setSearch("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          animation: "fadeIn 150ms ease-out",
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-4 last:mb-0">
              <div className="px-3 py-1.5">
                <span className="label text-gray-500 dark:text-gray-400">{category}</span>
              </div>
              <div className="space-y-1">
                {cmds.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => handleCommand(cmd)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                  >
                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {cmd.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cmd.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-4xl mb-2">
                search_off
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">No commands found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">↵</kbd>
              <span>Select</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">⌘K</kbd> to open
          </div>
        </div>
      </div>
    </div>
  );
}
