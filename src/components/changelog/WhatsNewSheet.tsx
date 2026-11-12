import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CHANGELOG } from "@/data/changelog";
import { useApp } from "@/context/AppProvider";

export function WhatsNewSheet() {
  const { settings, updateSettings } = useApp();
  const release = CHANGELOG[0];
  const [open, setOpen] = useState(false);
  useEffect(() => { if (settings && settings.lastSeenVersion !== release.version) setOpen(true); }, [release.version, settings]);
  const close = async () => { await updateSettings({ lastSeenVersion: release.version }); setOpen(false); };
  return <BottomSheet footer={<Button className="w-full" onClick={() => void close()} size="lg">Continue</Button>} onClose={() => void close()} open={open} title={`What's New · ${release.version}`}><div className="pb-4"><Sparkles aria-hidden="true" className="size-7 text-red-500" strokeWidth={2} /><h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{release.title}</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{release.highlights.map((highlight) => <li className="flex gap-2" key={highlight}><span className="text-red-500">•</span>{highlight}</li>)}</ul></div></BottomSheet>;
}
