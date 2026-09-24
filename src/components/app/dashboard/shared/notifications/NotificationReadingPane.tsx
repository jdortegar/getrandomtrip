"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";

interface NotificationReadingPaneProps {
  notification: ClientNotification;
  href: string | null;
  copy: NotificationsDict;
  locale: string;
  canPrev: boolean;
  canNext: boolean;
  busy: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
  /** Focused on open by the enclosing `NotificationDialog`'s `onOpenAutoFocus` — Radix owns the focus trap, Esc, and focus return, so this component adds no focus/keydown handling of its own. */
  titleRef: RefObject<HTMLHeadingElement | null>;
}

/** Content of the notification reading dialog: title, timestamp, body, CTA, and actions. */
export function NotificationReadingPane({
  notification,
  href,
  copy,
  locale,
  canPrev,
  canNext,
  busy,
  onPrev,
  onNext,
  onToggleRead,
  onDelete,
  titleRef,
}: NotificationReadingPaneProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { body, createdAt, title, type } = notification;
  const isReviewAction = type === "EXPERIENCE_PENDING_TRIPPER_REVIEW";
  const actionLabel = isReviewAction ? copy.actionReview : copy.actionView;
  const absoluteTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-component="NotificationReadingPane"
    >
      <div className="p-6 pb-4">
        <h2
          className="text-xl font-semibold text-ink"
          ref={titleRef}
          tabIndex={-1}
        >
          {title}
        </h2>
        <p className="mt-1 text-xs text-neutral-400">{absoluteTime}</p>
      </div>

      {/*
        Scrollable body: `flex-1` + `min-h-0` + `overflow-y-auto` inside the
        enclosing flex column (mobile full-screen, or `sm:max-h-[85vh]` on
        desktop — see NotificationDialog) is what keeps a long message
        scrolling in place instead of pushing the footer off-screen.
        `sm:min-h-56` is purely cosmetic on top of that: without it, a short
        one-line message leaves the action buttons crammed right under the
        text on desktop.
      */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 sm:min-h-56">
        {body && <p className="text-sm leading-relaxed text-ink">{body}</p>}

        {href && (
          <Button
            asChild
            className="min-h-0 self-start px-0 font-sans text-sm font-medium normal-case tracking-normal has-[>svg]:px-0 hover:underline"
            variant="link"
          >
            <Link href={href}>
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-6 pt-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleRead}
            size="sm"
            type="button"
            variant="secondary"
          >
            {copy.pane.markUnread}
          </Button>
          <Button
            onClick={() => setDeleteConfirmOpen(true)}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {copy.pane.delete}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={!canPrev || busy}
            onClick={onPrev}
            size="sm"
            type="button"
            variant="ghost"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {copy.pane.previous}
          </Button>
          <Button
            disabled={!canNext || busy}
            onClick={onNext}
            size="sm"
            type="button"
            variant="ghost"
          >
            {copy.pane.next}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmModal
        cancelLabel={copy.bulkActions.cancel}
        confirmLabel={copy.bulkActions.confirm}
        description={copy.pane.deleteConfirmBody}
        icon={Trash2}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          onDelete();
        }}
        onOpenChange={setDeleteConfirmOpen}
        open={deleteConfirmOpen}
        title={copy.pane.deleteConfirmTitle}
        tone="danger"
      />
    </div>
  );
}
