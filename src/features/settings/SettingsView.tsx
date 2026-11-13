import { Accessibility, CarFront, Check, ChevronRight, History, Moon, RotateCcw, Sparkles, Sun, Trash2 } from "lucide-react";
import { useState } from "react";

import { ChangelogSheet } from "@/components/changelog/ChangelogSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      showToast({
        actionLabel: "Undo",
        message: "All local data cleared.",
        onAction: () => restoreSnapshot(snapshot),
        tone: "success"
      });
      setClearOpen(false);
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to clear local data.", tone: "error" });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">SETTINGS</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">App preferences</h1>
      </div>
      <Card className="flex items-center gap-3">
        {dark ? <Moon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /> : <Sun aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{dark ? "Obsidian Black & Red" : "Light Mode"}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Switch between the default dark theme and a clean light surface.</p>
        </div>
        <Toggle checked={dark} disabled={themeSaving} label="Toggle appearance theme" onChange={(checked) => void changeTheme(checked)} />
      </Card>
      <Card className="flex items-center gap-3">
        <Accessibility aria-hidden="true" className="size-5 shrink-0 text-red-500" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Reduced Motion: {reducedMotion ? "On" : "Off"}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{settings?.reducedMotion === null ? "Following your system preference until you choose a setting." : "Saved for this device and used across all motion."}</p>
        </div>
        <Toggle checked={reducedMotion} disabled={motionSaving} label="Toggle reduced motion" onChange={(checked) => void changeReducedMotion(checked)} />
      </Card>
      <Card className="flex items-center gap-3">
        <CarFront aria-hidden="true" className="size-5 shrink-0 text-red-500" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Garage vehicle manager</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400"><span className="tabular-nums">{vehicles.length}</span> vehicle{vehicles.length === 1 ? "" : "s"} in your offline garage.</p>
        </div>
        <Button onClick={onOpenGarage} size="sm" variant="secondary">Manage</Button>
      </Card>
      <Card>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">LOCAL DATA</p>
        <div className="mt-4 grid gap-4">
          <div className="flex items-center gap-3">
            <RotateCcw aria-hidden="true" className="size-5 shrink-0 text-red-500" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Load Sample Data</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Add Yamaha MT-15 and Honda Civic FD4 data to an empty garage.</p>
            </div>
            <Button loading={seeding} onClick={() => void seed()} size="sm" variant="secondary">Load</Button>
          </div>
          <div className="flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <Trash2 aria-hidden="true" className="size-5 shrink-0 text-rose-500" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Clear All Data</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Remove this device’s local garage, records, and preferences.</p>
            </div>
            <Button onClick={() => setClearOpen(true)} size="sm" variant="danger">Clear</Button>
          </div>
        </div>
      </Card>
      <Card className="flex items-center gap-3">
        <Sparkles aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">APP VERSION</p>
          <p className="mt-1 tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{APP_VERSION}</p>
        </div>
      </Card>
      <Card>
        <div className="flex items-start gap-3">
          <History aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-500" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">CHANGELOG</p>
            <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{CURRENT_RELEASE.title}</p>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {CURRENT_RELEASE.highlights.map((highlight) => <li className="flex gap-2" key={highlight}><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-red-500" strokeWidth={2} /><span>{highlight}</span></li>)}
            </ul>
          </div>
        </div>
        <Button className="mt-4 w-full" onClick={() => setChangelogOpen(true)} size="md" variant="secondary">View all releases <ChevronRight className="size-4" strokeWidth={2} /></Button>
      </Card>
      <ChangelogSheet onClose={() => setChangelogOpen(false)} open={changelogOpen} />
      <BottomSheet footer={<Button className="w-full" loading={clearing} onClick={() => void clear()} size="lg" variant="danger">Clear All Data</Button>} onClose={() => setClearOpen(false)} open={clearOpen} title="Clear local data?">
        <p className="pb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">This removes all local MotoLog data. Undo is available briefly in the confirmation toast.</p>
      </BottomSheet>
    </div>
  );
}
