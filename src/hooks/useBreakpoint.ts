'use client';

/**
 * Breakpoint Hook
 * Provides responsive breakpoint detection and utilities
 */

import { useState, useEffect } from 'react';

// Breakpoint definitions matching our design system
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to get current breakpoint
 * @returns Current breakpoint name
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if current breakpoint matches or is above target
 * @param target - Target breakpoint to check against
 * @returns Boolean indicating if current breakpoint is at or above target
 */
export function useBreakpointAbove(target: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const targetIndex = breakpointOrder.indexOf(target);
  
  return currentIndex >= targetIndex;
}

/**
 * Hook to check if current breakpoint matches or is below target
 * @param target - Target breakpoint to check against
 * @returns Boolean indicating if current breakpoint is at or below target
 */
export function useBreakpointBelow(target: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const targetIndex = breakpointOrder.indexOf(target);
  
  return currentIndex <= targetIndex;
}

/**
 * Hook to check if current breakpoint is between two breakpoints (inclusive)
 * @param min - Minimum breakpoint
 * @param max - Maximum breakpoint
 * @returns Boolean indicating if current breakpoint is between min and max
 */
export function useBreakpointBetween(min: Breakpoint, max: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const minIndex = breakpointOrder.indexOf(min);
  const maxIndex = breakpointOrder.indexOf(max);
  
  return currentIndex >= minIndex && currentIndex <= maxIndex;
}

/**
 * Hook to get responsive values based on current breakpoint
 * @param values - Object mapping breakpoints to values
 * @returns Value for current breakpoint, falling back to smaller breakpoints
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Find the closest available value (current or smaller breakpoint)
  for (let i = currentIndex; i >= 0; i--) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }
  }
  
  return undefined;
}

/**
 * Hook to get window dimensions
 * @returns Object with width and height
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * Hook to check if device is mobile
 * @returns Boolean indicating if device is mobile
 */
export function useIsMobile(): boolean {
  return useBreakpointBelow('md');
}

/**
 * Hook to check if device is tablet
 * @returns Boolean indicating if device is tablet
 */
export function useIsTablet(): boolean {
  return useBreakpointBetween('md', 'lg');
}

/**
 * Hook to check if device is desktop
 * @returns Boolean indicating if device is desktop
 */
export function useIsDesktop(): boolean {
  return useBreakpointAbove('lg');
}
