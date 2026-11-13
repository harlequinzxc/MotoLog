import { useEffect } from "react";

interface ScrollLockSnapshot {
  bodyLeft: string;
  bodyOverflow: string;
  bodyPosition: string;
  bodyRight: string;
  bodyTop: string;
  bodyWidth: string;
  documentOverflow: string;
  documentOverscrollBehavior: string;
  scrollY: number;
}

let lockCount = 0;
let snapshot: ScrollLockSnapshot | null = null;

function lockBodyScroll() {
  if (lockCount > 0) {
    lockCount += 1;
    return;
  }

  const body = document.body;
  const documentElement = document.documentElement;
  snapshot = {
    bodyLeft: body.style.left,
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyRight: body.style.right,
    bodyTop: body.style.top,
    bodyWidth: body.style.width,
    documentOverflow: documentElement.style.overflow,
    documentOverscrollBehavior: documentElement.style.overscrollBehavior,
    scrollY: window.scrollY
  };
  body.style.position = "fixed";
  body.style.top = `-${snapshot.scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  documentElement.style.overflow = "hidden";
  documentElement.style.overscrollBehavior = "none";
  lockCount = 1;
}

function unlockBodyScroll() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0 || !snapshot) return;

  const body = document.body;
  const documentElement = document.documentElement;
  body.style.left = snapshot.bodyLeft;
  body.style.overflow = snapshot.bodyOverflow;
  body.style.position = snapshot.bodyPosition;
  body.style.right = snapshot.bodyRight;
  body.style.top = snapshot.bodyTop;
  body.style.width = snapshot.bodyWidth;
  documentElement.style.overflow = snapshot.documentOverflow;
  documentElement.style.overscrollBehavior = snapshot.documentOverscrollBehavior;
  window.scrollTo(0, snapshot.scrollY);
  snapshot = null;
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [locked]);
}
