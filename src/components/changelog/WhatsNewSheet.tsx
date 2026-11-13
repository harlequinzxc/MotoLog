import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { APP_VERSION } from "@/data/appVersion";
import { CURRENT_RELEASE } from "@/data/changelog";
import { useApp } from "@/context/AppProvider";

export function WhatsNewSheet() {
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setOpen(settings.lastSeenVersion !== APP_VERSION);
  }, [settings]);

  const acknowledge = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateSettings({ lastSeenVersion: APP_VERSION });
      setOpen(false);
      showToast({ message: "Release acknowledged.", tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to save the release acknowledgement.", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet footer={<Button className="w-full" loading={saving} onClick={() => void acknowledge()} size="lg">Got It</Button>} onClose={() => void acknowledge()} open={open} title="What’s New">
      <div className="pb-4">
        <Sparkles aria-hidden="true" className="size-7 text-red-500" strokeWidth={2} />
        <p className="mt-4 tabular-nums text-xs font-semibold tracking-widest text-red-600 dark:text-red-400">{APP_VERSION}</p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{CURRENT_RELEASE.title}</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {CURRENT_RELEASE.highlights.map((highlight) => <li className="flex gap-2" key={highlight}><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-red-500" strokeWidth={2} /><span>{highlight}</span></li>)}
        </ul>
      </div>
    </BottomSheet>
  );
}
