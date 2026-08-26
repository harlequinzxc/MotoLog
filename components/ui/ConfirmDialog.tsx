"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useId } from "react";

interface ConfirmDialogProps {
  confirmLabel: string;
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

/** A focused destructive-action confirmation modal. */
export function ConfirmDialog({
  confirmLabel,
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-5">
      <button
        aria-label={`Close ${title}`}
        className="absolute inset-0 animate-sheet-backdrop cursor-default bg-black/70"
        onClick={onCancel}
        type="button"
      />
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="animate-confirm-dialog relative w-full max-w-sm rounded-3xl border border-border-default bg-bg-card p-6 shadow-[0_24px_70px_rgb(0_0_0_/_0.5)]"
        role="alertdialog"
      >
        <span className="grid size-12 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          <TriangleAlert aria-hidden="true" size={23} />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-tight text-text-primary" id={titleId}>
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary" id={descriptionId}>
          {description}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            className="h-11 rounded-2xl border border-border-default bg-bg-input text-sm font-bold text-text-primary transition-colors hover:bg-bg-card"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-11 rounded-2xl bg-red-500 px-3 text-sm font-bold text-white shadow-[0_10px_28px_rgb(239_68_68_/_0.24)] transition-transform hover:bg-red-400 active:scale-[0.98]"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
