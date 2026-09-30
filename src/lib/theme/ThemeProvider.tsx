/**
 * Theme Provider
 * Provides theme context and dark mode support
 */

"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useStorageValue, writeStorageValue } from "@/hooks/useStorageValue";

import React, { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// THEME TYPES
// ============================================================================

export type ColorScheme = "light" | "dark" | "system";

export interface ThemeConfig {
  colorScheme: ColorScheme;
  accentColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  fontFamily?: "sans" | "serif" | "mono";
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  toggleColorScheme: () => void;
}

// ============================================================================
// THEME CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// THEME PROVIDER
// ============================================================================

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ColorScheme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "getrandomtrip-theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const stored = useStorageValue(storageKey);
  const [selectedScheme, setColorScheme] = useState<ColorScheme | null>(null);
  const [previousStorageKey, setPreviousStorageKey] = useState(storageKey);
  if (previousStorageKey !== storageKey) {
    setPreviousStorageKey(storageKey);
    setColorScheme(null);
  }
  const storedScheme =
    stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : null;
  const colorScheme = selectedScheme ?? storedScheme ?? defaultTheme;
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const isDark =
    colorScheme === "dark" ||
    (colorScheme === "system" && enableSystem && systemDark);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");

    root.classList.add(
      colorScheme === "system" && enableSystem
        ? isDark
          ? "dark"
          : "light"
        : colorScheme,
    );

    // Disable transitions during theme change if requested
    if (disableTransitionOnChange) {
      const css = document.createElement("style");
      css.appendChild(
        document.createTextNode(
          `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
        ),
      );
      document.head.appendChild(css);

      // Force reflow
      (() => window.getComputedStyle(document.body))();

      // Remove the style element after a short delay
      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    }
  }, [colorScheme, enableSystem, disableTransitionOnChange, isDark]);

  const setTheme = (newTheme: ThemeConfig) => {
    setColorScheme(newTheme.colorScheme);
    writeStorageValue(storageKey, newTheme.colorScheme);
  };

  const toggleColorScheme = () => {
    const newScheme: ColorScheme = isDark ? "light" : "dark";
    setColorScheme(newScheme);
    writeStorageValue(storageKey, newScheme);
  };

  const value: ThemeContextValue = {
    theme: { colorScheme },
    setTheme,
    colorScheme,
    setColorScheme: (scheme) => {
      setColorScheme(scheme);
      writeStorageValue(storageKey, scheme);
    },
    isDark,
    toggleColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ============================================================================
// USE THEME HOOK
// ============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

// ============================================================================
// THEME TOGGLE COMPONENT
// ============================================================================

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ThemeToggle({
  className,
  showLabel = false,
  size = "md",
}: ThemeToggleProps) {
  const { isDark, toggleColorScheme } = useTheme();

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <button
      onClick={toggleColorScheme}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
        sizeClasses[size],
        className,
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      {showLabel && (
        <span className="ml-2 text-sm">{isDark ? "Light" : "Dark"}</span>
      )}
    </button>
  );
}
