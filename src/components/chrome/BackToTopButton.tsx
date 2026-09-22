"use client";

import { useState } from "react";
import { useLenis } from "lenis/react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/hooks/useDictionary";

const SHOW_AFTER_PX = 480;

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const label = useDictionary((d) => d.common.backToTop);

  // Lenis (root mode) drives the real scroll position via its own render
  // loop — native `window` scroll events don't fire reliably on every tick,
  // so this has to read position from Lenis itself, not window.scrollY.
  const lenis = useLenis((instance) => {
    setVisible(instance.animatedScroll > SHOW_AFTER_PX);
  });

  return (
    <button
      aria-hidden={!visible}
      aria-label={label}
      className={cn(
        "fixed bottom-5 right-5 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary/90",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      )}
      onClick={() => lenis?.scrollTo(0, { duration: 1.2 })}
      tabIndex={visible ? 0 : -1}
      type="button"
      data-component="BackToTopButton"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
