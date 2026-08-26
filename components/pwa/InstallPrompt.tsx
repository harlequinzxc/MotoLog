"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { MotoMark } from "@/components/branding/MotoMark";
import { APP_NAME } from "@/lib/constants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

/**
 * Chrome emits `beforeinstallprompt` only after the manifest and service worker
 * meet its PWA installability checks. Holding that event lets this button open
 * Chrome's native install dialog from a deliberate user interaction.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptToInstall = async () => {
    if (!deferredPrompt || isPrompting) {
      return;
    }

    setIsPrompting(true);

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsPrompting(false);
    }
  };

  if (!deferredPrompt || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label={`Install ${APP_NAME}`}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-border-default bg-bg-card p-3 shadow-[0_16px_48px_rgb(0_0_0_/_0.45)]"
    >
      <MotoMark className="shrink-0" size={36} />
      <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-text-primary">
        Install {APP_NAME} for quick access.
      </p>
      <button
        className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-text-primary transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        disabled={isPrompting}
        onClick={promptToInstall}
        type="button"
      >
        {isPrompting ? "Opening" : "Install"}
      </button>
      <button
        aria-label="Dismiss install prompt"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-input hover:text-text-primary"
        onClick={() => setIsVisible(false)}
        type="button"
      >
        <X aria-hidden="true" size={17} />
      </button>
    </aside>
  );
}
