"use client";

import { Bike, History, LayoutDashboard, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LogFillUpSheet } from "@/components/fillups/LogFillUpSheet";
import { useAppContext } from "@/context/AppContext";

const navigationItems = [
  { label: "Dash", href: "/", icon: LayoutDashboard },
  { label: "History", href: "/history", icon: History },
  { label: "Garage", href: "/garage", icon: Bike },
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
      className={`relative flex h-[4.5rem] flex-col items-center justify-center gap-1 border-t-2 px-1 text-[10px] font-semibold tracking-[0.01em] transition-colors duration-200 ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-text-muted hover:text-text-secondary"
      }`}
      href={href}
    >
      <Icon aria-hidden="true" size={21} strokeWidth={active ? 2.5 : 2} />
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
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-bg-base/95 backdrop-blur-lg"
      >
        <div className="mx-auto grid h-[calc(4.5rem+env(safe-area-inset-bottom))] max-w-lg grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
          {navigationItems.slice(0, 2).map((item) => (
            <NavLink key={item.href} pathname={pathname} {...item} />
          ))}

          <div className="relative flex h-[4.5rem] flex-col items-center pt-10">
            <button
              aria-label="Log a fill-up"
              className="absolute -top-7 grid size-14 place-items-center rounded-full bg-accent text-bg-base shadow-[0_12px_34px_rgb(var(--color-accent)_/_0.46)] transition-transform duration-200 hover:scale-105 active:scale-95"
              onClick={handleLogFill}
              title="Log a fill-up"
              type="button"
            >
              <Plus aria-hidden="true" size={27} strokeWidth={3} />
            </button>
            <span className="text-[10px] font-semibold tracking-[0.01em] text-text-secondary">
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
