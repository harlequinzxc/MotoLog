import { useEffect, useState } from "react";

import { motionDuration } from "@/lib/motion";

export function usePresence(open: boolean, exitDuration: number) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    let timeout = 0;

    if (open) {
      setIsMounted(true);
      setIsVisible(true);
    } else if (isMounted) {
      setIsVisible(false);
      timeout = window.setTimeout(() => setIsMounted(false), motionDuration(exitDuration));
    }

    return () => window.clearTimeout(timeout);
  }, [exitDuration, isMounted, open]);

  return { isMounted, isVisible };
}
