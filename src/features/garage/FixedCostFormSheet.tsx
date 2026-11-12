import { CalendarClock, Coins } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { localDateInputValue, localDateToIso } from "@/lib/date";
import type { BillingCycle, FixedCostCategory, FixedCostInput } from "@/types";

interface FixedCostFormSheetProps {
  onClose: () => void;
  onSubmit: (input: FixedCostInput) => Promise<void>;
  open: boolean;
}

const labels: Record<FixedCostCategory, string> = {
  "road-tax": "Road Tax",
  insurance: "Motor Insurance",
  "season-parking": "Season Parking",
  coe: "COE",
  loan: "Loan"
};

export function FixedCostFormSheet({ onClose, onSubmit, open }: FixedCostFormSheetProps) {
  const [category, setCategory] = useState<FixedCostCategory>("road-tax");
  const [amount, setAmount] = useState("");
  const [renewalDate, setRenewalDate] = useState(localDateInputValue());
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCategory("road-tax");
      setAmount("");
      setRenewalDate(localDateInputValue());
      setBillingCycle("annual");
      setError(null);
      setIsSaving(false);
    }
  }, [open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Enter a valid non-negative SGD amount.");
      return;
    }
    if (!renewalDate) {
      setError("Choose a renewal date.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        category,
        label: labels[category],
        amount: parsedAmount,
        billingCycle,
        renewalAt: localDateToIso(renewalDate)
      });
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save fixed cost.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet footer={<Button className="w-full" form="fixed-cost-form" loading={isSaving} size="lg" type="submit">Add Fixed Cost</Button>} onClose={onClose} open={open} title="Add Fixed Cost">
      <form className="grid gap-5 pb-2" id="fixed-cost-form" onSubmit={submit}>
        <Select label="Cost category" onChange={(event) => setCategory(event.target.value as FixedCostCategory)} value={category}>
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Input endAdornment="SGD" inputMode="decimal" label="Amount" onChange={(event) => setAmount(event.target.value)} placeholder="110.00" startAdornment={<Coins className="size-4" strokeWidth={2} />} type="number" value={amount} />
        <Select label="Billing cycle" onChange={(event) => setBillingCycle(event.target.value as BillingCycle)} value={billingCycle}>
          <option value="monthly">Monthly</option>
          <option value="six-monthly">6-Monthly</option>
          <option value="annual">Annual</option>
        </Select>
        <Input label="Renewal / expiry date" onChange={(event) => setRenewalDate(event.target.value)} startAdornment={<CalendarClock className="size-4" strokeWidth={2} />} type="date" value={renewalDate} />
        {error ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p> : null}
      </form>
    </BottomSheet>
  );
}
