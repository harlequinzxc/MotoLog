"use client";

import {
  Download,
  Eraser,
  FileUp,
  Palette,
  ReceiptText,
  SlidersHorizontal,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";

import { MotoMark } from "@/components/branding/MotoMark";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppContext } from "@/context/AppContext";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { exportAppDataToCsv, importAppDataFromCsv } from "@/lib/csv";
import { type AccentTheme, useTheme } from "@/lib/theme";
import type { ConsumptionUnit } from "@/lib/types";

const CURRENCIES = [
  { code: "SGD", symbol: "S$", label: "SGD" },
  { code: "USD", symbol: "$", label: "USD" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
  { code: "JPY", symbol: "¥", label: "JPY" },
  { code: "AUD", symbol: "A$", label: "AUD" },
] as const;

interface Notice {
  kind: "error" | "success";
  text: string;
}

function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-3xl border border-border-default bg-bg-card p-5">
      <p className="text-[11px] font-bold tracking-[0.16em] text-accent">{title}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function isAccentTheme(
  value: string,
  themes: Record<string, unknown>,
): value is AccentTheme {
  return Object.prototype.hasOwnProperty.call(themes, value);
}

/** Appearance, regional settings, backups, and local-data management. */
export function SettingsScreen() {
  const {
    clearData,
    fillUps,
    isHydrated,
    replaceData,
    settings,
    updateSettings,
    vehicles,
  } = useAppContext();
  const { accentTheme, accentThemes, setAccentTheme } = useTheme();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isEraseDialogOpen, setIsEraseDialogOpen] = useState(false);

  const selectAccentTheme = (theme: AccentTheme) => {
    setAccentTheme(theme);
    updateSettings({ accentTheme: theme });
    setNotice({ kind: "success", text: "Accent color updated." });
  };

  const selectCurrency = (currency: (typeof CURRENCIES)[number]) => {
    updateSettings({
      currency: currency.code,
      currencySymbol: currency.symbol,
    });
    setNotice({ kind: "success", text: `Currency set to ${currency.code}.` });
  };

  const selectDistanceUnit = (imperial: boolean) => {
    updateSettings(
      imperial
        ? {
            distanceUnit: "mi",
            volumeUnit: "gal-uk",
            consumptionUnit: "mpg-uk",
          }
        : {
            distanceUnit: "km",
            volumeUnit: "L",
            consumptionUnit:
              settings.consumptionUnit === "mpg-uk" ||
              settings.consumptionUnit === "mpg-us"
                ? "km/L"
                : settings.consumptionUnit,
          },
    );
  };

  const selectConsumptionUnit = (consumptionUnit: ConsumptionUnit) => {
    const usesMiles = consumptionUnit === "mpg-uk" || consumptionUnit === "mpg-us";
    updateSettings({
      consumptionUnit,
      distanceUnit: usesMiles ? "mi" : "km",
      volumeUnit: usesMiles ? "gal-uk" : "L",
    });
  };

  const exportBackup = () => {
    const csv = exportAppDataToCsv({
      vehicles,
      fillUps,
      settings: { ...settings, accentTheme },
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `motolog-backup-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice({ kind: "success", text: "CSV backup downloaded." });
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const importedData = importAppDataFromCsv(await file.text());
      replaceData(importedData);

      if (isAccentTheme(importedData.settings.accentTheme, accentThemes)) {
        setAccentTheme(importedData.settings.accentTheme);
      } else {
        setAccentTheme("orange");
      }

      setNotice({
        kind: "success",
        text: `Restored ${importedData.vehicles.length} ${importedData.vehicles.length === 1 ? "vehicle" : "vehicles"} and ${importedData.fillUps.length} ${importedData.fillUps.length === 1 ? "fill-up" : "fill-ups"}.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to import this CSV backup.",
      });
    }
  };

  const eraseAllData = () => {
    clearData();
    setAccentTheme("orange");
    setIsEraseDialogOpen(false);
    setNotice({ kind: "success", text: "All local MotoLog data was erased." });
  };

  if (!isHydrated) {
    return (
      <section className="mx-auto min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-lg px-5 pb-8 pt-[max(1.75rem,env(safe-area-inset-top))]">
        <div className="h-8 w-36 animate-pulse rounded bg-bg-input" />
        <div className="mt-8 h-44 animate-pulse rounded-3xl bg-bg-card" />
        <div className="mt-4 h-52 animate-pulse rounded-3xl bg-bg-card" />
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-lg px-5 pb-8 pt-[max(1.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MotoMark size={31} />
          <span className="text-sm font-bold tracking-tight text-text-primary">
            {APP_NAME}
          </span>
        </div>
        <span className="rounded-full border border-border-default bg-bg-card px-3 py-1 text-xs font-medium text-text-secondary">
          Settings
        </span>
      </header>

      <div className="mt-7">
        <p className="text-[11px] font-bold tracking-[0.16em] text-accent">PREFERENCES</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
          Make it yours
        </h1>
      </div>

      {notice ? (
        <p
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium ${
            notice.kind === "success"
              ? "border-accent/25 bg-accent/10 text-text-primary"
              : "border-red-500/25 bg-red-500/10 text-red-200"
          }`}
          role="status"
        >
          {notice.text}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        <SettingsSection title="APPEARANCE">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Accent color</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Updates buttons, highlights, and charts instantly.
              </p>
            </div>
            <Palette aria-hidden="true" size={20} className="shrink-0 text-accent" />
          </div>
          <div className="mt-5 grid grid-cols-5 gap-3">
            {(Object.entries(accentThemes) as [
              AccentTheme,
              (typeof accentThemes)[AccentTheme],
            ][]).map(([theme, value]) => {
              const selected = accentTheme === theme;
              return (
                <button
                  aria-label={`Use ${value.label}`}
                  aria-pressed={selected}
                  className={`grid aspect-square place-items-center rounded-2xl border transition-transform hover:scale-105 active:scale-95 ${
                    selected
                      ? "border-text-primary bg-bg-input ring-2 ring-text-primary ring-offset-2 ring-offset-bg-card"
                      : "border-border-default bg-bg-input"
                  }`}
                  key={theme}
                  onClick={() => selectAccentTheme(theme)}
                  type="button"
                >
                  <span
                    className="size-7 rounded-full shadow-[inset_0_1px_1px_rgb(255_255_255_/_0.3)]"
                    style={{ backgroundColor: value.hex }}
                  />
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="CURRENCY">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Display currency</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Used across fill-ups, history, and dashboard costs.
              </p>
            </div>
            <ReceiptText aria-hidden="true" size={20} className="shrink-0 text-accent" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {CURRENCIES.map((currency) => {
              const selected = settings.currency === currency.code;
              return (
                <button
                  aria-pressed={selected}
                  className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                    selected
                      ? "border-accent bg-accent text-text-primary shadow-accent-glow"
                      : "border-border-default bg-bg-input text-text-primary hover:border-accent/40"
                  }`}
                  key={currency.code}
                  onClick={() => selectCurrency(currency)}
                  type="button"
                >
                  <span className="block text-lg font-bold">{currency.symbol}</span>
                  <span
                    className={`mt-1 block text-[10px] font-bold tracking-[0.12em] ${
                      selected ? "text-text-primary/80" : "text-text-muted"
                    }`}
                  >
                    {currency.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="UNITS">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Global defaults</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Vehicle overrides can still use their own preference.
              </p>
            </div>
            <SlidersHorizontal aria-hidden="true" size={20} className="shrink-0 text-accent" />
          </div>

          <p className="mt-5 text-[10px] font-bold tracking-[0.14em] text-text-muted">DISTANCE</p>
          <div className="mt-2 grid grid-cols-2 rounded-2xl border border-border-default bg-bg-input p-1">
            {[
              ["km", "Metric · km"],
              ["mi", "Imperial · mi"],
            ].map(([unit, label]) => {
              const selected = settings.distanceUnit === unit;
              return (
                <button
                  aria-pressed={selected}
                  className={`min-h-11 rounded-xl px-3 text-xs font-bold transition-colors ${
                    selected
                      ? "bg-accent text-text-primary shadow-accent-glow"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  key={unit}
                  onClick={() => selectDistanceUnit(unit === "mi")}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-[10px] font-bold tracking-[0.14em] text-text-muted">CONSUMPTION</p>
          <div className="mt-2 grid grid-cols-3 rounded-2xl border border-border-default bg-bg-input p-1">
            {(
              [
                ["km/L", "km/L"],
                ["L/100km", "L/100"],
                ["mpg-uk", "MPG"],
              ] as const
            ).map(([unit, label]) => {
              const selected = settings.consumptionUnit === unit;
              return (
                <button
                  aria-pressed={selected}
                  className={`min-h-11 rounded-xl px-2 text-xs font-bold transition-colors ${
                    selected
                      ? "bg-accent text-text-primary shadow-accent-glow"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  key={unit}
                  onClick={() => selectConsumptionUnit(unit)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="BACKUP & RESTORE">
          <p className="text-sm leading-6 text-text-secondary">
            Export a portable CSV containing settings, vehicles, and fill-ups — or replace this device with a previous backup.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-3 text-sm font-bold text-text-primary shadow-accent-glow transition-transform hover:brightness-110 active:scale-[0.98]"
              onClick={exportBackup}
              type="button"
            >
              <Download aria-hidden="true" size={17} />
              Export CSV
            </button>
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border-default bg-bg-input px-3 text-sm font-bold text-text-primary transition-colors hover:border-accent/40 hover:bg-bg-card"
              onClick={() => importInputRef.current?.click()}
              type="button"
            >
              <FileUp aria-hidden="true" size={17} className="text-accent" />
              Import CSV
            </button>
            <input
              accept=".csv,text/csv"
              className="sr-only"
              onChange={importBackup}
              ref={importInputRef}
              type="file"
            />
          </div>
        </SettingsSection>

        <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-[11px] font-bold tracking-[0.16em] text-red-300">DANGER ZONE</p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Erase all data</h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Removes every vehicle, fill-up, and saved preference from this device.
              </p>
            </div>
            <Eraser aria-hidden="true" size={20} className="shrink-0 text-red-300" />
          </div>
          <button
            className="mt-5 flex h-11 w-full items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-sm font-bold text-red-200 transition-colors hover:bg-red-500/20"
            onClick={() => setIsEraseDialogOpen(true)}
            type="button"
          >
            Erase all data
          </button>
        </section>
      </div>

      <footer className="pb-2 pt-8 text-center text-xs text-text-muted">
        {APP_NAME} {APP_VERSION} · Local-first by design
      </footer>

      <ConfirmDialog
        confirmLabel="Erase data"
        description="This permanently removes all vehicles, fill-ups, and preferences stored on this device. Export a CSV backup first if you may need it later."
        isOpen={isEraseDialogOpen}
        onCancel={() => setIsEraseDialogOpen(false)}
        onConfirm={eraseAllData}
        title="Erase all MotoLog data?"
      />
    </section>
  );
}
