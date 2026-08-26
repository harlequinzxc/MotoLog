import type { LucideIcon } from "lucide-react";

import { MotoMark } from "@/components/branding/MotoMark";
import { APP_NAME } from "@/lib/constants";

interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** A lightweight destination placeholder used while each feature is built. */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-lg flex-col px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2.5">
        <MotoMark size={31} />
        <span className="text-sm font-bold tracking-tight text-text-primary">
          {APP_NAME}
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center pb-12 text-center">
        <span className="grid size-16 place-items-center rounded-3xl border border-accent/20 bg-accent/10 text-accent shadow-accent-glow">
          <Icon aria-hidden="true" size={30} strokeWidth={2} />
        </span>
        <p className="mt-7 text-xs font-bold tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
    </section>
  );
}
