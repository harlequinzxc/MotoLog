import { Accessibility, CarFront, Check, ChevronRight, History, Moon, RotateCcw, Sparkles, Sun, Trash2 } from "lucide-react";
import { useState } from "react";

import { ChangelogSheet } from "@/components/changelog/ChangelogSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ListGroup } from "@/components/ui/ListGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { APP_VERSION } from "@/data/appVersion";
import { CURRENT_RELEASE } from "@/data/changelog";

interface SettingsViewProps {
  onOpenGarage: () => void;
}

export function SettingsView({ onOpenGarage }: SettingsViewProps) {
  const { clearAllData, reducedMotion, restoreSnapshot, seedSampleData, settings, updateSettings, vehicles } = useApp();
  const { showToast } = useToast();
  const [clearOpen, setClearOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [motionSaving, setMotionSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const dark = settings?.themeMode !== "light";

  const changeTheme = async (nextDark: boolean) => {
    if (themeSaving) return;
    setThemeSaving(true);
    try {
      await updateSettings({ themeMode: nextDark ? "dark" : "light" });
      showToast({ message: nextDark ? "Obsidian Black & Red enabled." : "Light Mode enabled.", tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to update appearance.", tone: "error" });
    } finally {
      setThemeSaving(false);
    }
  };

  const changeReducedMotion = async (nextReducedMotion: boolean) => {
    if (motionSaving) return;
    setMotionSaving(true);
    try {
      await updateSettings({ reducedMotion: nextReducedMotion });
      showToast({ message: nextReducedMotion ? "Reduced Motion is on." : "Reduced Motion is off.", tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to update motion preference.", tone: "error" });
    } finally {
      setMotionSaving(false);
    }
  };

  const seed = async () => {
    setSeeding(true);
    try {
      await seedSampleData();
      showToast({ message: "Sample garage data is ready.", tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to load sample data.", tone: "error" });
    } finally {
      setSeeding(false);
    }
  };

  const clear = async () => {
    setClearing(true);
    try {
      const snapshot = await clearAllData();
      showToast({ actionLabel: "Undo", message: "All local data cleared.", onAction: () => restoreSnapshot(snapshot), tone: "success" });
      setClearOpen(false);
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to clear local data.", tone: "error" });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="grid gap-7">
      <SectionHeader eyebrow="CONTROL CENTER" title="Settings" />
      <section>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-400">EXPERIENCE</p>
        <ListGroup>
          <div className="flex items-center gap-3 px-4 py-4">
            {dark ? <Moon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /> : <Sun aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />}
            <div className="min-w-0 flex-1"><p className="font-semibold text-zinc-900 dark:text-zinc-50">{dark ? "Obsidian Black & Red" : "Light Mode"}</p><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Choose the surface that is easiest on your eyes.</p></div>
            <Toggle checked={dark} disabled={themeSaving} label="Toggle appearance theme" onChange={(checked) => void changeTheme(checked)} />
          </div>
          <div className="flex items-center gap-3 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <Accessibility aria-hidden="true" className="size-5 shrink-0 text-red-500" strokeWidth={2} />
            <div className="min-w-0 flex-1"><p className="font-semibold text-zinc-900 dark:text-zinc-50">Reduced Motion: {reducedMotion ? "On" : "Off"}</p><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{settings?.reducedMotion === null ? "Following your system preference." : "Saved for this device."}</p></div>
            <Toggle checked={reducedMotion} disabled={motionSaving} label="Toggle reduced motion" onChange={(checked) => void changeReducedMotion(checked)} />
          </div>
        </ListGroup>
      </section>
      <section>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-400">GARAGE</p>
        <ListGroup>
          <div className="flex items-center gap-3 px-4 py-4">
            <CarFront aria-hidden="true" className="size-5 shrink-0 text-red-500" strokeWidth={2} />
            <div className="min-w-0 flex-1"><p className="font-semibold text-zinc-900 dark:text-zinc-50">Vehicle manager</p><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400"><span className="tabular-nums">{vehicles.length}</span> vehicle{vehicles.length === 1 ? "" : "s"} in this garage.</p></div>
            <Button onClick={onOpenGarage} size="sm" variant="secondary">Manage</Button>
          </div>
        </ListGroup>
      </section>
      <section>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-400">LOCAL DATA</p>
        <ListGroup>
          <div className="flex items-center gap-3 px-4 py-4">
            <RotateCcw aria-hidden="true" className="size-5 shrink-0 text-red-500" strokeWidth={2} />
            <div className="min-w-0 flex-1"><p className="font-semibold text-zinc-900 dark:text-zinc-50">Load sample garage</p><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Yamaha MT-15 and Honda Civic FD4, ready to explore.</p></div>
            <Button loading={seeding} onClick={() => void seed()} size="sm" variant="secondary">Load</Button>
          </div>
          <div className="flex items-center gap-3 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <Trash2 aria-hidden="true" className="size-5 shrink-0 text-rose-500" strokeWidth={2} />
            <div className="min-w-0 flex-1"><p className="font-semibold text-zinc-900 dark:text-zinc-50">Clear all local data</p><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Remove this device’s garage and records.</p></div>
            <Button onClick={() => setClearOpen(true)} size="sm" variant="danger">Clear</Button>
          </div>
        </ListGroup>
      </section>
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="flex items-start gap-3"><Sparkles aria-hidden="true" className="mt-0.5 size-5 text-red-500" strokeWidth={2} /><div><p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-400">CURRENT RELEASE</p><p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{CURRENT_RELEASE.title} <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{APP_VERSION}</span></p></div></div>
        <ul className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">{CURRENT_RELEASE.highlights.map((highlight) => <li className="flex gap-2" key={highlight}><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-red-500" strokeWidth={2} /><span>{highlight}</span></li>)}</ul>
        <Button className="mt-5" onClick={() => setChangelogOpen(true)} size="sm" variant="ghost">Release history <ChevronRight className="size-4" strokeWidth={2} /></Button>
      </section>
      <ChangelogSheet onClose={() => setChangelogOpen(false)} open={changelogOpen} />
      <BottomSheet footer={<Button className="w-full" loading={clearing} onClick={() => void clear()} size="lg" variant="danger">Clear all data</Button>} onClose={() => setClearOpen(false)} open={clearOpen} title="Clear this device?">
        <p className="pb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">This removes every local MotoLog record. Undo remains available briefly after confirmation.</p>
      </BottomSheet>
    </div>
  );
}
