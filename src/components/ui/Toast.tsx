import { CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastTone = "error" | "success";

export interface ToastItem {
  actionLabel?: string;
  id: string;
  message: string;
  onAction?: () => void | Promise<void>;
  tone: ToastTone;
}

interface ToastProps {
  isExiting: boolean;
  message: ToastItem;
  onDismiss: () => void;
}

export function Toast({ isExiting, message, onDismiss }: ToastProps) {
  const Icon = message.tone === "error" ? Info : CheckCircle2;
  const [isVisible, setIsVisible] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isExiting) {
      setIsVisible(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isExiting]);

  const runAction = async () => {
    if (!message.onAction || isActing) return;
    setIsActing(true);
    try {
      await message.onAction();
      onDismiss();
    } catch {
      setActionError("Unable to complete that action.");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="motion-toast pointer-events-auto flex min-w-[280px] max-w-sm items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900" data-motion="toast" data-state={isVisible && !isExiting ? "open" : "closed"}>
      <Icon aria-hidden="true" className={message.tone === "error" ? "size-5 text-rose-500" : "size-5 text-red-500"} strokeWidth={2} />
      <p className={`min-w-0 flex-1 text-sm font-medium ${actionError ? "text-rose-700 dark:text-rose-300" : "text-zinc-800 dark:text-zinc-100"}`}>{actionError ?? message.message}</p>
      {message.onAction && message.actionLabel ? <button className="motion-press min-h-[44px] rounded-lg px-2 text-sm font-semibold text-red-600 disabled:opacity-50 dark:text-red-400" disabled={isActing} onClick={() => void runAction()} type="button">{message.actionLabel}</button> : null}
      <button aria-label="Dismiss notification" className="motion-press grid min-h-[44px] min-w-[44px] place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800" disabled={isActing} onClick={onDismiss} type="button">
        <X className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
