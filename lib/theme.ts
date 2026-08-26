"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const THEME_STORAGE_KEY = "motolog:accent-theme";
const THEME_CHANGE_EVENT = "motolog:accent-theme-change";

export const ACCENT_THEMES = {
  orange: {
    label: "Blaze Orange",
    hex: "#FF5502",
    rgb: "255, 85, 2",
  },
  coral: {
    label: "Coral Red",
    hex: "#FF4D5A",
    rgb: "255, 77, 90",
  },
  gold: {
    label: "Track Gold",
    hex: "#F6B73C",
    rgb: "246, 183, 60",
  },
  mint: {
    label: "Signal Mint",
    hex: "#31C48D",
    rgb: "49, 196, 141",
  },
  blue: {
    label: "Apex Blue",
    hex: "#4198FF",
    rgb: "65, 152, 255",
  },
} as const;

export type AccentTheme = keyof typeof ACCENT_THEMES;

const DEFAULT_ACCENT_THEME: AccentTheme = "orange";

interface ThemeContextValue {
  /** The selected named accent theme. */
  accentTheme: AccentTheme;
  /** The complete palette available to the Settings screen. */
  accentThemes: typeof ACCENT_THEMES;
  /** Change the accent color and persist the preference locally. */
  setAccentTheme: (theme: AccentTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isAccentTheme(value: string | null): value is AccentTheme {
  return value !== null && Object.prototype.hasOwnProperty.call(ACCENT_THEMES, value);
}

function readAccentTheme(): AccentTheme {
  if (typeof window === "undefined") {
    return DEFAULT_ACCENT_THEME;
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAccentTheme(savedTheme) ? savedTheme : DEFAULT_ACCENT_THEME;
}

function subscribeToAccentTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function applyAccentTheme(theme: AccentTheme) {
  const accent = ACCENT_THEMES[theme];
  document.documentElement.style.setProperty("--accent", accent.hex);
  document.documentElement.style.setProperty("--color-accent", accent.rgb);
}

/**
 * Provides a persisted accent color for the app. All accent-aware Tailwind
 * utilities resolve through `--color-accent`, so a change is instant and does
 * not require a page reload.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const accentTheme = useSyncExternalStore(
    subscribeToAccentTheme,
    readAccentTheme,
    () => DEFAULT_ACCENT_THEME,
  );

  useEffect(() => {
    applyAccentTheme(accentTheme);
  }, [accentTheme]);

  const setAccentTheme = useCallback((theme: AccentTheme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyAccentTheme(theme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({
      accentTheme,
      accentThemes: ACCENT_THEMES,
      setAccentTheme,
    }),
    [accentTheme, setAccentTheme],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider.");
  }

  return context;
}
