import { CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";

export type ToastTone = "error" | "info" | "success";

export interface ToastMessage {
  actionLabel?: string;
  id: string;
  message: string;
  onAction?: () => void | Promise<void>;
  tone: ToastTone;
}

export function Toast({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  const Icon = message.tone === "error" ? Info : CheckCircle2;
  return (
    <div className="pointer-events-auto flex min-w-[280px] max-w-sm items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
      <Icon aria-hidden="true" className={message.tone === "error" ? "size-5 text-rose-500" : "size-5 text-red-500"} strokeWidth={2} />
      <p className="min-w-0 flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{message.message}</p>
      {message.onAction && message.actionLabel ? (
        <button className="min-h-[44px] rounded-lg px-2 text-sm font-semibold text-red-600 dark:text-red-400" onClick={() => { void message.onAction?.(); onDismiss(); }} type="button">
          {message.actionLabel}
        </button>
      ) : null}
      <button aria-label="Dismiss notification" className="grid min-h-[44px] min-w-[44px] place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onDismiss} type="button">
        <X aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export function ToastViewport({ children }: { children: ReactNode }) {
  return <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[90] mx-auto flex max-w-[480px] flex-col items-center gap-2 px-4">{children}</div>;
}
