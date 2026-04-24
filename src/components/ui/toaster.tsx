"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      theme="light"
      toastOptions={{
        style: {
          fontFamily: "var(--font-barlow), sans-serif",
          fontSize: "0.875rem",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-gray-200, #e5e7eb)",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
        classNames: {
          title: "font-medium text-neutral-900",
          description: "text-neutral-600",
        },
      }}
    />
  );
}
