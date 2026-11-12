import { cn } from "@/lib/cn";

interface ToggleProps { checked: boolean; label: string; onChange: (checked: boolean) => void }

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button aria-checked={checked} aria-label={label} className={cn("relative inline-flex min-h-[44px] min-w-[52px] items-center rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500", checked ? "bg-red-600 dark:bg-red-500" : "bg-zinc-300 dark:bg-zinc-700")} onClick={() => onChange(!checked)} role="switch" type="button">
      <span className={cn("size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-0")} />
    </button>
  );
}
