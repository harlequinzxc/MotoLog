import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  actionLabel: string;
  description: string;
  icon: LucideIcon;
  onAction: () => void;
  title: string;
}

export function EmptyState({ actionLabel, description, icon: Icon, onAction, title }: EmptyStateProps) {
  return (
    <div className="motion-list-item grid min-h-44 place-items-center py-5 text-center" data-motion="empty-state">
      <div className="max-w-xs">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-red-500/10 text-red-500">
          <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
        </span>
        <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
        <Button className="mt-4" onClick={onAction} size="sm">{actionLabel}</Button>
      </div>
    </div>
  );
}
