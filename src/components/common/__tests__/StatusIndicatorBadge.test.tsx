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
    ["trip", "CONFIRMED", "bg-secondary/35"],
    ["trip", "REVEALED", "bg-feature/15"],
    ["trip", "COMPLETED", "bg-primary/10"],
    ["trip", "PENDING_PAYMENT", "bg-feature/15"],
    ["trip", "COLLECTING", "bg-feature/15"],
    ["trip", "CANCELLED", "bg-red-50"],
    ["trip", "SAVED", "bg-ground"],
    ["experience", "ACTIVE", "bg-green-50"],
    ["experience", "PENDING_TRIPPER_REVIEW", "bg-primary/10"],
    ["payment", "FAILED", "bg-red-50"],
    ["payment", "PENDING", "bg-feature/15"],
    ["payment", "REFUNDED", "bg-ground"],
    ["role", "ADMIN", "bg-primary/10"],
    ["role", "TRAVELER", "bg-secondary/35"],
    ["role", "TRIPPER", "bg-feature/15"],
    ["document", "published", "bg-green-50"],
    ["availability", "coming-soon", "bg-ground"],
    ["tripper-booking", "confirmed", "bg-secondary/35"],
    ["tripper-booking", "revealed", "bg-feature/15"],
    ["tripper-booking", "completed", "bg-primary/10"],
    ["tripper-booking", "unknown", "bg-ground"],
    ["notification", "unread", "bg-secondary/35"],
    ["review", "submitted", "bg-green-50"],
    ["email-contact", "SUBSCRIBED", "bg-green-50"],
    ["email-contact", "UNSUBSCRIBED", "bg-ground"],
    ["email-contact", "BOUNCED", "bg-red-50"],
    ["email-campaign", "DRAFT", "bg-feature/15"],
    ["email-campaign", "SENDING", "bg-secondary/35"],
    ["email-campaign", "SENT", "bg-green-50"],
    ["email-campaign", "PARTIAL", "bg-red-50"],
    ["email-send", "QUEUED", "bg-ground"],
    ["email-send", "SENT", "bg-secondary/35"],
    ["email-send", "DELIVERED", "bg-green-50"],
    ["email-send", "BOUNCED", "bg-red-50"],
    ["email-send", "FAILED", "bg-red-50"],
    ["traveler", "INVITED", "bg-secondary/35"],
    ["traveler", "PENDING", "bg-feature/15"],
    ["earning", "processing", "bg-secondary/35"],
  ] as const)("maps %s %s to its brand tone", (family, status, wash) => {
    const html = renderToStaticMarkup(
      <StatusIndicatorBadge
        family={family}
        label="Confirmado"
        status={status}
      />,
    );
    expect(html).toContain(wash);
    expect(html).toContain("uppercase");
    expect(html).toContain("rounded-[6px]");
    expect(html).toContain("Confirmado");
  });

  it("never renders the retired generic hues", () => {
    const families = [
      "blog",
      "experience",
      "earning",
      "traveler",
      "trip",
      "payment",
      "role",
      "traveler-trip",
      "document",
      "availability",
      "email-contact",
      "email-campaign",
      "email-send",
      "tripper-booking",
      "tripper-profile",
      "notification",
      "review",
    ] as const;
    const statuses = [
      "unknown",
      "CONFIRMED",
      "REVEALED",
      "COMPLETED",
      "PENDING_REVIEW",
      "PENDING_TRIPPER_REVIEW",
      "SENDING",
      "SENT",
      "INVITED",
      "ADMIN",
      "TRAVELER",
      "processing",
      "revealed",
      "DRAFT",
      "ARCHIVED",
      "QUEUED",
    ];
    for (const family of families)
      for (const status of statuses) {
        const html = renderToStaticMarkup(
          <StatusIndicatorBadge family={family} label="x" status={status} />,
        );
        expect(html).not.toMatch(/(sky|purple|blue|amber|gray)-50/);
      }
  });

  it.each([
    ["CONFIRMED", "bg-secondary/35", "text-primary"],
    ["REVEALED", "bg-feature/15", "text-ink"],
    ["COMPLETED", "bg-primary/10", "text-primary"],
    ["CANCELLED", "bg-red-50", "text-red-800"],
    ["PENDING_PAYMENT", "bg-feature/15", "text-ink"],
    ["COLLECTING", "bg-ground", "text-neutral-600"],
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
      expect(html).toContain("bg-ground");
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
    expect(notice).toContain("text-primary");
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
    ).toContain("bg-feature/15");
    expect(
      renderToStaticMarkup(
        <EarningStatusBadge label="Unknown" status="unknown" />,
      ),
    ).toContain("bg-feature/15");
    expect(
      renderToStaticMarkup(
        <TravelerStatusBadge label="Invitado" status="INVITED" />,
      ),
    ).toContain("bg-secondary/35");
    const html = renderToStaticMarkup(
      <StatusBadge label="Unknown" status="unknown" />,
    );
    expect(html).toContain("bg-ground");
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
