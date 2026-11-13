import { Bike, CarFront, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function WelcomeCard({ isSeeding, onAddVehicle, onSeedData }: { isSeeding: boolean; onAddVehicle: () => void; onSeedData: () => Promise<void> }) {
  return <Card className="mx-auto max-w-md text-center"><div className="mx-auto flex w-fit items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-red-500"><Bike aria-hidden="true" className="size-7" strokeWidth={2} /><CarFront aria-hidden="true" className="size-7" strokeWidth={2} /></div><p className="mt-6 text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">WELCOME TO MOTOLOG</p><h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Fuel clarity, one fill at a time.</h1><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Add your own vehicle or explore realistic Singapore and Malaysia sample fuel data.</p><div className="mt-6 grid gap-3"><Button onClick={onAddVehicle} size="lg">Add First Vehicle</Button><Button loading={isSeeding} onClick={onSeedData} size="lg" variant="secondary"><Sparkles className="size-5" strokeWidth={2} />Load Sample Data</Button></div></Card>;
}
