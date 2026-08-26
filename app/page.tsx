import { Fuel, Gauge, ShieldCheck, Sparkles } from "lucide-react";

import { APP_NAME, APP_VERSION } from "@/lib/constants";

const foundationItems = [
  {
    icon: Fuel,
    title: "Fuel logs, simplified",
    description: "Record every stop and make the numbers useful.",
  },
  {
    icon: Gauge,
    title: "Built for the ride",
    description: "Keep mileage, range, and costs close at hand.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "Your garage will live safely on your device.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-accent text-bg-base shadow-accent">
            <Fuel aria-hidden="true" size={21} strokeWidth={2.6} />
          </span>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            {APP_NAME}
          </span>
        </div>
        <span className="rounded-full border border-border-default bg-bg-card px-3 py-1 text-xs font-medium text-text-secondary">
          {APP_VERSION}
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-14">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-accent">
          <Sparkles aria-hidden="true" size={14} />
          PWA FOUNDATION READY
        </div>
        <h1 className="max-w-sm text-4xl font-bold leading-[1.08] tracking-tight text-text-primary">
          Every fuel stop tells a better story.
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-text-secondary">
          MotoLog is your focused companion for tracking fuel, mileage, and the
          vehicles you love to ride.
        </p>

        <div className="mt-10 grid gap-3">
          {foundationItems.map(({ icon: Icon, title, description }) => (
            <article
              className="flex items-center gap-4 rounded-2xl border border-border-default bg-bg-card p-4"
              key={title}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg-input text-accent">
                <Icon aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-text-muted">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-text-muted">
        Your garage is about to take shape.
      </p>
    </main>
  );
}
