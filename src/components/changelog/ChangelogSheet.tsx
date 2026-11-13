import { Check, History } from "lucide-react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListGroup } from "@/components/ui/ListGroup";
import { CHANGELOG, CURRENT_RELEASE } from "@/data/changelog";
import { formatLocalCalendarDate } from "@/lib/date";

interface ChangelogSheetProps {
  onClose: () => void;
  open: boolean;
}

export function ChangelogSheet({ onClose, open }: ChangelogSheetProps) {
  return (
    <BottomSheet footer={<Button className="w-full" onClick={onClose} size="lg">Done</Button>} onClose={onClose} open={open} title="Release history">
      <div className="pb-3">
        <div className="flex items-start gap-3 border-l-2 border-red-500 py-1 pl-4">
          <History aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-500" strokeWidth={2} />
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">The changes that materially improved your local garage.</p>
        </div>
        <ListGroup className="mt-5">
          {CHANGELOG.map((release, index) => (
            <article className={`motion-list-item px-4 py-4 ${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""}`} data-motion="release-note" key={release.version}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums text-xs font-semibold text-red-600 dark:text-red-400">{release.version}</span>
                    {release.version === CURRENT_RELEASE.version ? <Badge tone="danger">Current</Badge> : null}
                  </div>
                  <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{release.title}</h3>
                </div>
                <time className="shrink-0 tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{formatLocalCalendarDate(release.date)}</time>
              </div>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{release.highlights.map((highlight) => <li className="flex gap-2" key={highlight}><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-red-500" strokeWidth={2} /><span>{highlight}</span></li>)}</ul>
            </article>
          ))}
        </ListGroup>
      </div>
    </BottomSheet>
  );
}
