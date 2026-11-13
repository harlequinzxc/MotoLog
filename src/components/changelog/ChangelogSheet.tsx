import { Check, History } from "lucide-react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CHANGELOG, CURRENT_RELEASE } from "@/data/changelog";
import { formatLocalCalendarDate } from "@/lib/date";

interface ChangelogSheetProps {
  onClose: () => void;
  open: boolean;
}

export function ChangelogSheet({ onClose, open }: ChangelogSheetProps) {
  return (
    <BottomSheet footer={<Button className="w-full" onClick={onClose} size="lg">Done</Button>} onClose={onClose} open={open} title="Changelog">
      <div className="pb-3">
        <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 text-red-700 dark:text-red-200">
          <History aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-500" strokeWidth={2} />
          <p className="text-sm leading-6">See what changed in every MotoLog release.</p>
        </div>
        <div className="mt-4 grid gap-3">
          {CHANGELOG.map((release) => (
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950" key={release.version}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{release.version}</span>
                    {release.version === CURRENT_RELEASE.version ? <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">Current</span> : null}
                  </div>
                  <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{release.title}</h3>
                </div>
                <time className="shrink-0 tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{formatLocalCalendarDate(release.date)}</time>
              </div>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {release.highlights.map((highlight) => <li className="flex gap-2" key={highlight}><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-red-500" strokeWidth={2} /><span>{highlight}</span></li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
