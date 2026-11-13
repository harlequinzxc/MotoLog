import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { MOTION_DURATION, motionDuration } from "@/lib/motion";

interface AnimatedSwapProps {
  children: ReactNode;
  className?: string;
  contentKey: string;
}

export function AnimatedSwap({ children, className, contentKey }: AnimatedSwapProps) {
  const latestChildren = useRef(children);
  latestChildren.current = children;
  const [displayed, setDisplayed] = useState({ contentKey, children });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (contentKey === displayed.contentKey) return;
    let frame = 0;
    setIsVisible(false);
    const timeout = window.setTimeout(() => {
      setDisplayed({ contentKey, children: latestChildren.current });
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    }, motionDuration(MOTION_DURATION.micro));

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [contentKey, displayed.contentKey]);

  return (
    <div className={cn("motion-swap", className)} data-motion="swap" data-state={isVisible ? "open" : "closed"}>
      {contentKey === displayed.contentKey ? children : displayed.children}
    </div>
  );
}
