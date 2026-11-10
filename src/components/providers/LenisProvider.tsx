"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, type ReactNode } from "react";

interface LenisProviderProps {
  children: ReactNode;
}

/**
 * Lenis ignores native scroll events while its own smooth animation runs, so
 * inertia (or a page height) carried over from the previous route would
 * override Next's scroll on navigation — landing the new page mid-scroll or
 * snapping it back to a stale limit. Rendered after `children`, this layout
 * effect runs after Next's scroll handler and before Lenis's next frame, so resyncing
 * here makes Lenis adopt the scroll position Next just set.
 */
function LenisRouteSync() {
  const lenis = useLenis();
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!lenis) return;
    // stop() + start() is the public path to Lenis's private reset(); skip it
    // when something else (e.g. a modal) deliberately stopped scrolling.
    if (!lenis.isStopped) {
      lenis.stop();
      lenis.start();
    }
    lenis.resize();
  }, [lenis, pathname]);

  return null;
}

/**
 * Global smooth scroll via Lenis (https://github.com/darkroomengineering/lenis).
 */
export function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis
      options={{
        allowNestedScroll: true,
        anchors: true,
        lerp: 0.08,
        smoothWheel: true,
      }}
      root
      data-component="LenisProvider"
    >
      {children}
      <LenisRouteSync />
    </ReactLenis>
  );
}
