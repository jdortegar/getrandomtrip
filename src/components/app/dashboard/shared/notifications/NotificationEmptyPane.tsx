"use client";

import type { RefObject } from "react";
import { AlertTriangle, SearchX } from "lucide-react";
import type { NotificationsDict } from "@/lib/types/dictionary";

/** No more "empty" (nothing-selected) state — the dialog simply isn't open when nothing is selected. */
export type NotificationEmptyPaneVariant = "notFound" | "error";

interface NotificationEmptyPaneProps {
  variant: NotificationEmptyPaneVariant;
  copy: NotificationsDict;
  /** Focused on open by the enclosing `NotificationDialog`'s `onOpenAutoFocus`. */
  titleRef: RefObject<HTMLHeadingElement | null>;
}

const VARIANT_ICON: Record<NotificationEmptyPaneVariant, typeof SearchX> = {
  notFound: SearchX,
  error: AlertTriangle,
};

/** Renders inside the reading dialog when `?id=` can't be resolved (404) or fails to load. */
export function NotificationEmptyPane({ variant, copy, titleRef }: NotificationEmptyPaneProps) {
  const Icon = VARIANT_ICON[variant];
  const title = variant === "notFound" ? copy.pane.notFoundTitle : copy.pane.loadError;
  // "error" has no distinct body copy of its own — the enclosing dialog's
  // sr-only DialogDescription already covers the accessible-description
  // requirement, so there is nothing to duplicate visually here.
  const body = variant === "notFound" ? copy.pane.notFoundBody : null;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-10 text-center"
      data-component="NotificationEmptyPane"
    >
      <Icon className="h-10 w-10 text-neutral-300" />
      <h2 className="text-sm font-semibold text-neutral-700" ref={titleRef} tabIndex={-1}>
        {title}
      </h2>
      {body && <p className="text-sm text-ink">{body}</p>}
    </div>
  );
}
