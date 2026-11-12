import { Moon, Settings2, Sparkles, Sun } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CHANGELOG } from "@/data/changelog";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/context/AppProvider";
import { useToast } from "@/components/ui/ToastProvider";

export function SettingsView() {
  const { settings, updateThemeMode } = useApp();
  const { showToast } = useToast();
  const isDark = settings?.themeMode !== "light";
  const changeTheme = async (checked: boolean) => {
    await updateThemeMode(checked ? "dark" : "light");
    showToast({ message: `${checked ? "Dark" : "Light"} theme enabled.`, tone: "success" });
  };

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">APP SETTINGS</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">MotoLog preferences</h1>
      </div>
      <Card className="flex items-center gap-3">
        {isDark ? <Moon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /> : <Sun aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />}
        <div className="flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Dark mode</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Switch between zinc light and obsidian dark surfaces.</p>
        </div>
        <Toggle checked={isDark} label="Toggle dark mode" onChange={(checked) => void changeTheme(checked)} />
      </Card>
      <Card className="flex items-center gap-3">
        <Settings2 aria-hidden="true" className="size-5 text-zinc-500" strokeWidth={2} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">More reporting, backup, and preference controls arrive in the next slice.</p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Changelog · {CHANGELOG[0].version}</p>
        </div>
        <ul className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          {CHANGELOG[0].highlights.map((highlight) => <li key={highlight}>• {highlight}</li>)}
        </ul>
      </Card>
    </div>
  );
}
