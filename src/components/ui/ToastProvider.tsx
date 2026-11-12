import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast, type ToastItem, type ToastTone } from "@/components/ui/Toast";

interface ToastContextValue { showToast: (toast: Omit<ToastItem, "id">) => void }
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const showToast = useCallback((toast: { actionLabel?: string; message: string; onAction?: () => void | Promise<void>; tone: ToastTone }) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    window.setTimeout(() => dismiss(id), 5_000);
  }, [dismiss]);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>{children}<div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[90] mx-auto flex max-w-[480px] flex-col items-center gap-2 px-4">{toasts.map((toast) => <Toast key={toast.id} message={toast} onDismiss={() => dismiss(toast.id)} />)}</div></ToastContext.Provider>;
}

export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error("useToast must be used within ToastProvider"); return context; }
