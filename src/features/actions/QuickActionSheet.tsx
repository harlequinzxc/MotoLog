import { Fuel, ReceiptText, Wrench } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
export type QuickAction="fuel"|"service"|"expense";
export function QuickActionSheet({onClose,onSelect,open}:{onClose:()=>void;onSelect:(action:QuickAction)=>void;open:boolean}){const choose=(action:QuickAction)=>{onSelect(action);onClose()};return <BottomSheet onClose={onClose} open={open} title="Add activity"><div className="grid gap-3 pb-5"><Button className="justify-start" onClick={()=>choose("fuel")} size="lg"><Fuel className="size-5" strokeWidth={2}/>Log Fill-Up</Button><Button className="justify-start" onClick={()=>choose("service")} size="lg" variant="secondary"><Wrench className="size-5" strokeWidth={2}/>Log Service</Button><Button className="justify-start" onClick={()=>choose("expense")} size="lg" variant="secondary"><ReceiptText className="size-5" strokeWidth={2}/>Log Expense</Button></div></BottomSheet>}
