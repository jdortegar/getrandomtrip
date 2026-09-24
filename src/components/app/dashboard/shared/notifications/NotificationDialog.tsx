"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface NotificationDialogProps {
  /** Open iff a notification is selected (`selection.selectedId !== null`) — regardless of whether it has resolved yet. */
  open: boolean;
  /** Routed to the selection hook's `close()` so history semantics stay correct (back() if pushed, otherwise replace). Radix calls this for the X button, Esc, and an outside click alike. */
  onClose: () => void;
  closeAriaLabel: string;
  /**
   * Accessible name/description for Radix's `aria-labelledby`/`aria-describedby`
   * wiring — rendered visually hidden. The *visible* heading lives inside
   * `children` (via `titleRef`), kept as a plain element so
   * `NotificationReadingPane`/`NotificationEmptyPane` stay unit-testable
   * standalone, without requiring a `Dialog` context in every test.
   */
  title: string;
  description: string;
  /** Render prop so the caller can attach the same ref to whichever inner heading (reading pane or empty/not-found pane) is currently mounted, for `onOpenAutoFocus`. */
  children: (titleRef: RefObject<HTMLHeadingElement | null>) => ReactNode;
}

/**
 * The Radix dialog shell for the notification reading view (replaces the
 * former split-view sticky pane). Centered modal on desktop, full-screen on
 * mobile. Radix owns focus trap, Esc, outside-click, and focus return —
 * this component adds no manual focus/keydown handling on top of it.
 */
export function NotificationDialog({
  open,
  onClose,
  closeAriaLabel,
  title,
  description,
  children,
}: NotificationDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
    >
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden border-0 bg-white p-0 shadow-xl",
          // Mobile: full-screen.
          "inset-0 top-0 left-0 h-full max-h-full w-full max-w-full translate-x-0 translate-y-0 rounded-none",
          // sm+: centered modal, bounded height with an internally scrollable body.
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-gray-200",
        )}
        data-component="NotificationDialog"
        onOpenAutoFocus={(event) => {
          if (titleRef.current) {
            event.preventDefault();
            titleRef.current.focus();
          }
        }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <DialogClose
          aria-label={closeAriaLabel}
          className="absolute top-4 right-4 z-10 rounded-xs p-1.5 text-neutral-500 opacity-70 transition-opacity hover:bg-neutral-100 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <XIcon className="h-4 w-4" />
        </DialogClose>
        {children(titleRef)}
      </DialogContent>
    </Dialog>
  );
}
