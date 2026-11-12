import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CHANGELOG } from "@/data/changelog";

const RELEASE_KEY = "motolog:last-seen-release";

export function WhatsNewSheet() {
  const release = CHANGELOG[0];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(RELEASE_KEY) !== release.version) setOpen(true);
  }, [release.version]);

  const close = () => {
    localStorage.setItem(RELEASE_KEY, release.version);
    setOpen(false);
  };

  return (
    <BottomSheet footer={<Button className="w-full" onClick={close} size="lg">Continue</Button>} onClose={close} open={open} title={`What's New · ${release.version}`}>
      <div className="pb-4">
        <Sparkles aria-hidden="true" className="size-7 text-red-500" strokeWidth={2} />
        <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{release.title}</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {release.highlights.map((highlight) => <li className="flex gap-2" key={highlight}><span className="text-red-500">•</span>{highlight}</li>)}
        </ul>
      </div>
    </BottomSheet>
  );
}
