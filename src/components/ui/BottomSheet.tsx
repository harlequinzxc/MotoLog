import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";
import { MOTION_DURATION } from "@/lib/motion";
import { useBodyScrollLock } from "@/components/ui/useBodyScrollLock";
import { usePresence } from "@/components/ui/usePresence";

interface BottomSheetProps {
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function BottomSheet({ children, footer, onClose, open, title }: BottomSheetProps) {
  const { isMounted, isVisible } = usePresence(open, MOTION_DURATION.sheet);
  useBodyScrollLock(isMounted);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, open]);

  if (!isMounted || typeof document === "undefined") return null;

  const state = isVisible ? "open" : "closed";
  const sheet = (
    <div aria-hidden={!isVisible} className={cn("fixed inset-0 z-[80] flex items-end justify-center", !isVisible && "pointer-events-none")} data-motion="sheet">
      <button aria-label={`Close ${title}`} className="motion-sheet-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" data-motion="backdrop" data-state={state} onClick={onClose} type="button" />
      <section aria-label={title} aria-modal={isVisible} className="motion-sheet-panel relative flex max-h-[90dvh] w-full max-w-[768px] flex-col rounded-t-3xl bg-zinc-50 shadow-2xl dark:bg-zinc-900" data-motion="sheet-panel" data-state={state} role="dialog">
        <div className="shrink-0 px-5 pb-3 pt-3">
          <span className="mx-auto block h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
            <button aria-label={`Close ${title}`} className="motion-press grid min-h-[44px] min-w-[44px] place-items-center rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800" onClick={onClose} type="button"><X className="size-5" strokeWidth={2} /></button>
          </div>
        </div>
        <div className="sheet-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-900">{footer}</div> : null}
      </section>
    </div>
  );

  return createPortal(sheet, document.body);
}
