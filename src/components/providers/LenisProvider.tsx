"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

interface LenisProviderProps {
  children: ReactNode;
}

/**
 * Global smooth scroll via Lenis (https://github.com/darkroomengineering/lenis).
 */
export function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis
      options={{
        lerp: 0.08,
        smoothWheel: true,
      }}
      root
    >
      {children}
    </ReactLenis>
  );
}
