"use client";

import { Fuel, History, LayoutDashboard, Settings, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LogFillUpSheet } from "@/components/fillups/LogFillUpSheet";
import { useAppContext } from "@/context/AppContext";

const navigationItems = [
  { label: "Dash", href: "/", icon: LayoutDashboard },
  { label: "History", href: "/history", icon: History },
  { label: "Garage", href: "/garage", icon: Warehouse },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

function isRouteActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

interface NavLinkProps {
  href: string;
  icon: (typeof navigationItems)[number]["icon"];
  label: string;
  pathname: string;
}

function NavLink({ href, icon: Icon, label, pathname }: NavLinkProps) {
  const active = isRouteActive(pathname, href);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`relative flex h-[4.5rem] flex-col items-center justify-center gap-1 border-t-2 px-1 text-[10px] font-medium tracking-[0.02em] transition-all duration-150 ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-text-muted hover:text-text-secondary"
      }`}
      href={href}
    >
      <Icon
        aria-hidden="true"
        className={active ? "scale-105 drop-shadow-[0_0_8px_rgb(255_255_255_/_0.18)]" : undefined}
        size={22}
        strokeWidth={active ? 2.5 : 2}
      />
      <span>{label}</span>
    </Link>
  );
}

/** Persistent primary navigation and the entry point for logging a fill-up. */
export function BottomNav() {
  const pathname = usePathname();
  const { activeVehicle } = useAppContext();
  const [isFillUpSheetOpen, setIsFillUpSheetOpen] = useState(false);
  const [isVehicleToastVisible, setIsVehicleToastVisible] = useState(false);

  useEffect(() => {
    if (!isVehicleToastVisible) {
      return;
    }

    const timeout = window.setTimeout(() => setIsVehicleToastVisible(false), 2_800);
    return () => window.clearTimeout(timeout);
  }, [isVehicleToastVisible]);

  const handleLogFill = () => {
    if (!activeVehicle) {
      setIsVehicleToastVisible(true);
      return;
    }

    setIsVehicleToastVisible(false);
    setIsFillUpSheetOpen(true);
  };

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-bg-base/95 before:pointer-events-none before:absolute before:-top-10 before:inset-x-0 before:h-10 before:bg-gradient-to-t before:from-bg-base before:via-bg-base/60 before:to-transparent backdrop-blur-xl"
      >
        <div className="relative mx-auto grid h-[calc(4.5rem+env(safe-area-inset-bottom))] max-w-[480px] grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
          {navigationItems.slice(0, 2).map((item) => (
            <NavLink key={item.href} pathname={pathname} {...item} />
          ))}

          <div className="relative flex h-[4.5rem] flex-col items-center pt-11">
            <button
              aria-label="Log a fill-up"
              className="absolute -top-4 grid size-14 place-items-center rounded-2xl bg-accent text-text-primary shadow-[0_4px_20px_rgb(var(--color-accent)_/_0.35),0_0_0_4px_rgb(var(--color-accent)_/_0.08)] transition-transform duration-150 hover:-translate-y-0.5"
              onClick={handleLogFill}
              title="Log a fill-up"
              type="button"
            >
              <Fuel aria-hidden="true" size={24} strokeWidth={2.4} />
            </button>
            <span className="text-[10px] font-medium tracking-[0.02em] text-accent">
              Log Fill
            </span>
          </div>

          {navigationItems.slice(2).map((item) => (
            <NavLink key={item.href} pathname={pathname} {...item} />
          ))}
        </div>
      </nav>

      {isVehicleToastVisible ? (
        <div
          aria-live="polite"
          className="animate-toast-in fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full border border-border-default bg-bg-card px-4 py-3 text-sm font-semibold text-text-primary shadow-[0_14px_40px_rgb(0_0_0_/_0.38)]"
          role="status"
        >
          <span className="mr-2 text-accent">●</span>
          Add a vehicle first
        </div>
      ) : null}

      {isFillUpSheetOpen && activeVehicle ? (
        <LogFillUpSheet
          key={activeVehicle.id}
          onClose={() => setIsFillUpSheetOpen(false)}
          vehicle={activeVehicle}
        />
      ) : null}
    </>
  );
}
