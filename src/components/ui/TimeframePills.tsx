import type { Timeframe } from "@/utils/dashboardMetrics";

const OPTIONS: Array<{ label: string; value: Timeframe }> = [
  { label: "30D", value: "30d" },
  { label: "3M", value: "3m" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" }
];

interface TimeframePillsProps {
  onChange: (timeframe: Timeframe) => void;
  value: Timeframe;
}

export function TimeframePills({ onChange, value }: TimeframePillsProps) {
  return (
    <div aria-label="Timeframe" className="grid grid-cols-4 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800" role="group">
      {OPTIONS.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={`min-h-[44px] rounded-xl tabular-nums text-xs font-semibold ${value === option.value ? "bg-red-600 text-white dark:bg-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
