import { Moon, RotateCcw, Sparkles, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/ToastProvider";
import { CHANGELOG } from "@/data/changelog";
import { useApp } from "@/context/AppProvider";

export function SettingsView() {
  const { clearAllData, restoreSnapshot, seedSampleData, settings, updateSettings } = useApp();
  const { showToast } = useToast(); const [clearOpen, setClearOpen] = useState(false), [seeding, setSeeding] = useState(false), [clearing, setClearing] = useState(false);
  const dark = settings?.themeMode !== "light";
  const seed = async () => { setSeeding(true); try { await seedSampleData(); showToast({ message: "Sample data loaded.", tone: "success" }); } catch (caughtError) { showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to load sample data.", tone: "error" }); } finally { setSeeding(false); } };
  const clear = async () => { setClearing(true); try { const snapshot = await clearAllData(); showToast({ actionLabel: "Undo", message: "All local data cleared.", onAction: () => restoreSnapshot(snapshot), tone: "success" }); setClearOpen(false); } finally { setClearing(false); } };
  return <div className="grid gap-5"><div><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">SETTINGS</p><h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">App preferences</h1></div><Card className="flex items-center gap-3">{dark ? <Moon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /> : <Sun aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />}<div className="flex-1"><p className="font-semibold text-zinc-900 dark:text-zinc-50">Dark Black & Red</p><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Switch app surfaces between dark and light.</p></div><Toggle checked={dark} label="Toggle dark mode" onChange={(checked) => void updateSettings({ themeMode: checked ? "dark" : "light" })} /></Card><div className="grid grid-cols-2 gap-3"><Button loading={seeding} onClick={seed} size="lg" variant="secondary"><RotateCcw className="size-5" strokeWidth={2} />Sample Data</Button><Button onClick={() => setClearOpen(true)} size="lg" variant="danger"><Trash2 className="size-5" strokeWidth={2} />Clear Data</Button></div><Card><div className="flex items-center gap-2"><Sparkles aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /><p className="font-semibold text-zinc-900 dark:text-zinc-50">Changelog · {CHANGELOG[0].version}</p></div><ul className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">{CHANGELOG[0].highlights.map((highlight) => <li key={highlight}>• {highlight}</li>)}</ul></Card><BottomSheet footer={<Button className="w-full" loading={clearing} onClick={clear} size="lg" variant="danger">Clear All Data</Button>} onClose={() => setClearOpen(false)} open={clearOpen} title="Clear local data?"><p className="pb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">This removes all local MotoLog data. Undo is available briefly in the confirmation toast.</p></BottomSheet></div>;
}
