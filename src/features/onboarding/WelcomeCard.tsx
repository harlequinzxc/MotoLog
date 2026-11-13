import { Bike, CarFront, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function WelcomeCard({ isSeeding, onAddVehicle, onSeedData }: { isSeeding: boolean; onAddVehicle: () => void; onSeedData: () => Promise<void> }) {
  return (
    <Card className="mx-auto max-w-md border-zinc-800 bg-zinc-900 text-center">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-red-400"><Bike aria-hidden="true" className="size-7" strokeWidth={2} /><CarFront aria-hidden="true" className="size-7" strokeWidth={2} /></div>
      <p className="mt-6 text-[11px] font-semibold tracking-[0.18em] text-zinc-400">START YOUR GARAGE</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">Start with the machine you drive.</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-300">Add your own vehicle now, or load a realistic Singapore–Malaysia garage to learn the workflow.</p>
      <div className="mt-6 grid gap-3"><Button onClick={onAddVehicle} size="lg">Add a vehicle</Button><Button loading={isSeeding} onClick={onSeedData} size="lg" variant="secondary"><Sparkles className="size-5" strokeWidth={2} />Load sample garage</Button></div>
    </Card>
  );
}
