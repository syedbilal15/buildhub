"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastData {
  message: string;
  type: "success" | "error";
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ toast, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss, duration]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-scale-in">
      <div
        className={`flex items-center gap-2.5 rounded-xl px-5 py-3 shadow-xl ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        } text-white`}
      >
        {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={onDismiss} className="ml-2 rounded p-0.5 text-white/70 hover:text-white">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
