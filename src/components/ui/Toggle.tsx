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
      className={cn(
        "motion-press relative inline-flex min-h-[44px] min-w-[52px] items-center rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50",
        checked ? "bg-red-600 dark:bg-red-500" : "bg-zinc-300 dark:bg-zinc-700"
      )}
      data-motion="toggle"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className={cn("motion-toggle-thumb size-5 rounded-full bg-white shadow", checked ? "translate-x-6" : "translate-x-0")} data-motion="toggle-thumb" />
    </button>
  );
}
