import { Check, ChevronDown } from "lucide-react";
import { Children, isValidElement, useId, useMemo, useState, type ReactNode } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/cn";

interface OptionProps {
  children?: ReactNode;
  disabled?: boolean;
  value?: string | number;
}

interface SelectOption {
  disabled: boolean;
  label: ReactNode;
  value: string;
}

interface SelectProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  value: string;
}

function optionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionProps>(child) || child.props.value === undefined) return [];
    return [{ disabled: Boolean(child.props.disabled), label: child.props.children, value: String(child.props.value) }];
  });
}

export function Select({ children, className, disabled = false, label, onValueChange, value }: SelectProps) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const selected = options.find((option) => option.value === value);

  const choose = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
  };

  return (
    <div className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-400" id={labelId}>{label}</span>
      <button aria-expanded={open} aria-haspopup="dialog" aria-labelledby={labelId} className={cn("motion-press flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-zinc-300 bg-white px-3 text-left text-base text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50", className)} data-motion="select" disabled={disabled} onClick={() => setOpen(true)} type="button">
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? "Select an option"}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-zinc-500" strokeWidth={2} />
      </button>
      <BottomSheet onClose={() => setOpen(false)} open={open} title={label}>
        <div aria-labelledby={labelId} className="pb-4" role="listbox">
          {options.map((option, index) => {
            const selectedOption = option.value === value;
            return (
              <button aria-selected={selectedOption} className={`motion-press flex min-h-[56px] w-full items-center gap-3 px-1 py-3 text-left ${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""} ${selectedOption ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-50"}`} disabled={option.disabled} key={option.value} onClick={() => choose(option.value)} role="option" type="button">
                <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${selectedOption ? "border-red-500 bg-red-500 text-white" : "border-zinc-300 dark:border-zinc-700"}`}>{selectedOption ? <Check aria-hidden="true" className="size-3" strokeWidth={2} /> : null}</span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{option.label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
