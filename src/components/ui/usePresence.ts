import { useEffect, useState } from "react";

import { motionDuration } from "@/lib/motion";

export function usePresence(open: boolean, exitDuration: number) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    let timeout = 0;

    if (open) {
      setIsMounted(true);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeout = window.setTimeout(() => setIsMounted(false), motionDuration(exitDuration));
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [exitDuration, open]);

  return { isMounted, isVisible };
}
