"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

interface BottomSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

/** A mobile-first modal sheet that rises from the safe-area-aware screen edge. */
export function BottomSheet({
  children,
  isOpen,
  onClose,
  title,
}: BottomSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label={`Close ${title}`}
        className="absolute inset-0 animate-sheet-backdrop cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="animate-bottom-sheet absolute inset-x-0 bottom-0 mx-auto flex h-[90dvh] max-h-[90dvh] w-full max-w-[480px] flex-col rounded-t-3xl border-x border-t border-border-default bg-bg-card shadow-[0_-18px_60px_rgb(0_0_0_/_0.5)]"
        role="dialog"
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-3">
          <span className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-text-muted/60" />
          <h2 className="pt-5 text-2xl font-bold tracking-tight text-text-primary" id={titleId}>
            {title}
          </h2>
          <button
            aria-label={`Close ${title}`}
            className="mt-4 grid size-8 place-items-center rounded-full bg-bg-elevated text-text-muted transition-colors hover:bg-bg-input hover:text-text-primary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </section>
    </div>
  );
}
