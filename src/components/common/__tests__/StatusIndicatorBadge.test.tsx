import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlogStatusBadge } from "@/components/common/BlogStatusBadge";
import { EarningStatusBadge } from "@/components/common/EarningStatusBadge";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { TravelerStatusBadge } from "@/components/common/TravelerStatusBadge";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { StatusBadge } from "@/components/app/admin/StatusBadge";

describe("component-owned status treatments", () => {
  it.each([
    ["trip", "CONFIRMED", "green"],
    ["trip", "REVEALED", "sky"],
    ["experience", "ACTIVE", "green"],
    ["payment", "FAILED", "red"],
    ["role", "ADMIN", "purple"],
    ["document", "published", "green"],
    ["availability", "coming-soon", "neutral"],
    ["tripper-booking", "confirmed", "green"],
    ["tripper-booking", "revealed", "purple"],
    ["tripper-booking", "unknown", "amber"],
    ["notification", "unread", "sky"],
    ["review", "submitted", "green"],
    ["email-contact", "SUBSCRIBED", "green"],
    ["email-contact", "UNSUBSCRIBED", "neutral"],
    ["email-contact", "BOUNCED", "red"],
    ["email-campaign", "DRAFT", "amber"],
    ["email-campaign", "SENDING", "sky"],
    ["email-campaign", "SENT", "green"],
    ["email-campaign", "PARTIAL", "red"],
    ["email-send", "QUEUED", "neutral"],
    ["email-send", "SENT", "sky"],
    ["email-send", "DELIVERED", "green"],
    ["email-send", "BOUNCED", "red"],
    ["email-send", "FAILED", "red"],
  ] as const)("preserves %s %s colors", (family, status, color) => {
    const html = renderToStaticMarkup(
      <StatusIndicatorBadge
        family={family}
        label="Confirmado"
        status={status}
      />,
    );
    expect(html).toContain(`bg-${color}-50`);
    expect(html).toContain("uppercase");
    expect(html).toContain("rounded-full");
    expect(html).toContain("Confirmado");
  });

  it.each([
    ["CONFIRMED", "bg-secondary/35", "text-primary"],
    ["REVEALED", "bg-feature/15", "text-ink"],
    ["COMPLETED", "bg-primary/10", "text-primary"],
    ["CANCELLED", "bg-red-50", "text-red-800"],
    ["PENDING_PAYMENT", "bg-ground", "text-neutral-600"],
  ])("uses brand tones for traveler-trip %s", (status, wash, text) => {
    const html = renderToStaticMarkup(
      <StatusIndicatorBadge family="traveler-trip" label="x" status={status} />,
    );
    expect(html).toContain(wash);
    expect(html).toContain(text);
  });

  it.each([
    ["experience", "PENDING_REVIEW", "bg-secondary/35"],
    ["experience", "PENDING_TRIPPER_REVIEW", "bg-primary/10"],
    ["blog", "PENDING_REVIEW", "bg-secondary/35"],
    ["blog", "PENDING_TRIPPER_REVIEW", "bg-primary/10"],
  ] as const)("uses brand tones for %s %s", (family, status, wash) => {
    const html = renderToStaticMarkup(
      <StatusIndicatorBadge family={family} label="x" status={status} />,
    );
    expect(html).toContain(wash);
    expect(html).toContain("text-primary");
  });

  it.each([
    ["experience", "DRAFT", "bg-feature/15", "text-ink"],
    ["blog", "DRAFT", "bg-feature/15", "text-ink"],
    ["experience", "ARCHIVED", "bg-ground", "text-neutral-600"],
    ["experience", "ACTIVE", "bg-green-50", "text-green-800"],
    ["experience", "INACTIVE", "bg-red-50", "text-red-800"],
  ] as const)("maps %s %s to its tone", (family, status, wash, text) => {
    const html = renderToStaticMarkup(
      <StatusIndicatorBadge family={family} label="x" status={status} />,
    );
    expect(html).toContain(wash);
    expect(html).toContain(text);
  });

  it.each(["unknown", "constructor", "toString"])(
    "falls back safely for an unrecognized status %s",
    (status) => {
      const html = renderToStaticMarkup(
        <StatusIndicatorBadge family="trip" label={status} status={status} />,
      );
      expect(html).toContain("bg-gray-50");
    },
  );

  it("preserves notification text and booking layout treatments", () => {
    const notice = renderToStaticMarkup(
      <StatusIndicatorBadge
        family="notification"
        label="Unread"
        status="unread"
      />,
    );
    const booking = renderToStaticMarkup(
      <StatusIndicatorBadge
        family="tripper-booking"
        label="Confirmed"
        status="confirmed"
      />,
    );
    const summary = renderToStaticMarkup(
      <StatusIndicatorBadge
        family="tripper-booking-summary"
        label="Confirmed"
        status="confirmed"
      />,
    );
    expect(notice).toContain("text-sky-700");
    expect(booking).toContain("px-3 py-[5px]");
    expect(summary).toContain("px-2.5 py-1");
    expect(summary).toContain("shrink-0");
  });

  it("retains wrapper fallback and case normalization behavior", () => {
    expect(
      renderToStaticMarkup(
        <BlogStatusBadge label="Publicado" status="published" />,
      ),
    ).toContain("bg-green-50");
    expect(
      renderToStaticMarkup(
        <ExperienceStatusBadge label="Unknown" status="unknown" />,
      ),
    ).toContain("bg-amber-50");
    expect(
      renderToStaticMarkup(
        <EarningStatusBadge label="Unknown" status="unknown" />,
      ),
    ).toContain("bg-amber-50");
    expect(
      renderToStaticMarkup(
        <TravelerStatusBadge label="Invitado" status="INVITED" />,
      ),
    ).toContain("bg-sky-50");
    const html = renderToStaticMarkup(
      <StatusBadge label="Unknown" status="unknown" />,
    );
    expect(html).toContain("bg-gray-50");
    expect(html).toContain('data-component="StatusIndicatorBadge"');
  });

  it("preserves the compact traveler summary without consumer style overrides", () => {
    const html = renderToStaticMarkup(
      <StatusIndicatorBadge
        family="traveler-trip-summary"
        label="Confirmado"
        status="CONFIRMED"
      />,
    );
    expect(html).toContain("px-2 py-0.5 text-[10px]");
    expect(html).toContain("bg-secondary/35");
  });
});
