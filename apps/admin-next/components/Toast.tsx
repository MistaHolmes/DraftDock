"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "warning";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "warning") => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg"
            style={{
              animation: "slideIn 0.3s ease",
              background:
                toast.type === "error"
                  ? "#b41340"
                  : toast.type === "warning"
                    ? "#d97706"
                    : "#16a34a",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
