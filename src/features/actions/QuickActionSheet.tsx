import { Fuel, ReceiptText, Wrench } from "lucide-react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

export type QuickAction = "expense" | "fuel" | "service";

export function QuickActionSheet({ onClose, onSelect, open }: { onClose: () => void; onSelect: (action: QuickAction) => void; open: boolean }) {
  const choose = (action: QuickAction) => { onSelect(action); onClose(); };
  return <BottomSheet onClose={onClose} open={open} title="Quick log"><div className="grid gap-2 pb-5"><p className="text-sm text-zinc-500 dark:text-zinc-400">Capture the record while it is still fresh.</p><Button className="justify-start" onClick={() => choose("fuel")} size="lg"><Fuel className="size-5" strokeWidth={2} />Log fill-up</Button><Button className="justify-start" onClick={() => choose("service")} size="lg" variant="secondary"><Wrench className="size-5" strokeWidth={2} />Log service</Button><Button className="justify-start" onClick={() => choose("expense")} size="lg" variant="secondary"><ReceiptText className="size-5" strokeWidth={2} />Log expense</Button></div></BottomSheet>;
}
