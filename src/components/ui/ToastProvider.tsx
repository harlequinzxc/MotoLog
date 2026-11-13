import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Toast, type ToastItem, type ToastTone } from "@/components/ui/Toast";
import { MOTION_DURATION, motionDuration } from "@/lib/motion";

interface ToastContextValue {
  showToast: (input: Omit<ToastItem, "id">) => void;
}

interface ToastEntry extends ToastItem {
  isExiting: boolean;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const exitTimers = useRef<Map<string, number>>(new Map());
  const autoDismissTimers = useRef<Map<string, number>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const exitTimer = exitTimers.current.get(id);
    const autoDismissTimer = autoDismissTimers.current.get(id);
    if (exitTimer) window.clearTimeout(exitTimer);
    if (autoDismissTimer) window.clearTimeout(autoDismissTimer);
    exitTimers.current.delete(id);
    autoDismissTimers.current.delete(id);
  }, []);

  const dismiss = useCallback((id: string) => {
    if (exitTimers.current.has(id)) return;
    setToasts((current) => current.map((toast) => toast.id === id ? { ...toast, isExiting: true } : toast));
    const exitTimer = window.setTimeout(() => remove(id), motionDuration(MOTION_DURATION.micro));
    exitTimers.current.set(id, exitTimer);
  }, [remove]);

  const showToast = useCallback((input: { actionLabel?: string; message: string; onAction?: () => void | Promise<void>; tone: ToastTone }) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.filter((toast) => !toast.isExiting).slice(-2), { ...input, id, isExiting: false }]);
    const autoDismissTimer = window.setTimeout(() => dismiss(id), 5_000);
    autoDismissTimers.current.set(id, autoDismissTimer);
  }, [dismiss]);

  useEffect(() => () => {
    exitTimers.current.forEach((timer) => window.clearTimeout(timer));
    autoDismissTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[90] mx-auto flex max-w-[480px] flex-col items-center gap-2 px-4">
        {toasts.map((toast) => <Toast isExiting={toast.isExiting} key={toast.id} message={toast} onDismiss={() => dismiss(toast.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
