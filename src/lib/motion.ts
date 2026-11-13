export const MOTION_DURATION = {
  micro: 160,
  standard: 200,
  sheet: 280
} as const;

export function systemPrefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function resolveReducedMotion(savedPreference: boolean | null, systemPreference = systemPrefersReducedMotion()) {
  return savedPreference ?? systemPreference;
}

export function motionDuration(duration: number) {
  if (typeof document !== "undefined" && document.documentElement.dataset.reducedMotion === "true") return 50;
  return duration;
}
