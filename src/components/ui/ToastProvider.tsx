import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { Toast, ToastViewport, type ToastMessage, type ToastTone } from "@/components/ui/Toast";

interface ToastContextValue {
  dismiss: (id: string) => void;
  showToast: (input: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: { actionLabel?: string; message: string; onAction?: () => void | Promise<void>; tone: ToastTone }) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current.slice(-2), { ...input, id }]);
      window.setTimeout(() => dismiss(id), 5_000);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ dismiss, showToast }), [dismiss, showToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport>{toasts.map((toast) => <Toast key={toast.id} message={toast} onDismiss={() => dismiss(toast.id)} />)}</ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
