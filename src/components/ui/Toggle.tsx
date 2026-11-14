import { cn } from "@/lib/cn";

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, disabled = false, label, onChange }: ToggleProps) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className="motion-press grid min-h-[44px] min-w-[56px] place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50"
      data-motion="toggle"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span aria-hidden="true" className={cn("relative h-8 w-14 rounded-full border p-[3px] shadow-inner", checked ? "border-red-500 bg-red-600 dark:bg-red-500" : "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800")}>
        <span className={cn("motion-toggle-thumb absolute left-[3px] top-[3px] size-[26px] rounded-full border border-black/5 bg-white shadow-sm dark:border-white/10", checked ? "translate-x-6" : "translate-x-0")} />
      </span>
    </button>
  );
}
