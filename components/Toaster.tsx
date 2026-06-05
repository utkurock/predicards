"use client";

import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

type ToasterState = {
  toasts: Toast[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToast = create<ToasterState>((set, get) => ({
  toasts: [],
  push: (message, kind = "info") => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, kind }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-lg border bg-bg-card/95 px-4 py-3 text-sm shadow-xl backdrop-blur-xl ${
              t.kind === "success"
                ? "border-accent/40"
                : t.kind === "error"
                ? "border-live/40"
                : "border-line"
            }`}
          >
            {t.kind === "success" && <CheckCircle2 className="h-4 w-4 text-accent" />}
            {t.kind === "error" && <AlertCircle className="h-4 w-4 text-live" />}
            {t.kind === "info" && <Info className="h-4 w-4 text-text-secondary" />}
            <span className="text-text-primary">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
