import { describe, expect, it } from "vitest";
import { buildTripTimeline } from "@/components/app/dashboard/traveler/tripDetailsHelpers";

const now = new Date("2026-03-01T12:00:00.000Z");
const base = {
  createdAt: "2026-01-10T15:00:00.000Z",
  startDate: "2026-03-12T00:00:00.000Z",
  endDate: "2026-03-19T00:00:00.000Z",
};

const summary = (steps: ReturnType<typeof buildTripTimeline>) =>
  steps.map((s) => `${s.key}:${s.state}`);

describe("buildTripTimeline", () => {
  it("marks the next milestone as current for a paid, unrevealed trip", () => {
    const steps = buildTripTimeline(
      { ...base, status: "CONFIRMED", paidAt: "2026-01-11T10:00:00.000Z" },
      now,
    );
    expect(summary(steps)).toEqual([
      "created:done",
      "paid:done",
      "revealed:current",
      "departure:upcoming",
      "completed:upcoming",
    ]);
    expect(steps[3]).toMatchObject({ date: base.startDate, dateOnly: true });
    expect(steps[4]).toMatchObject({ date: base.endDate, dateOnly: true });
  });

  it("counts a confirmed trip as paid even without payment data (companion view)", () => {
    const steps = buildTripTimeline({ ...base, status: "CONFIRMED" }, now);
    expect(steps[1]).toMatchObject({ key: "paid", state: "done", date: null });
  });

  it("leaves payment as the current step while it is pending", () => {
    const steps = buildTripTimeline({ ...base, status: "PENDING_PAYMENT" }, now);
    expect(summary(steps).slice(0, 3)).toEqual(["created:done", "paid:current", "revealed:upcoming"]);
  });

  it("marks departure done once the start date has passed", () => {
    const steps = buildTripTimeline(
      { ...base, status: "REVEALED", destinationRevealedAt: "2026-03-10T00:00:00.000Z" },
      new Date("2026-03-14T00:00:00.000Z"),
    );
    expect(summary(steps).slice(2)).toEqual(["revealed:done", "departure:done", "completed:current"]);
  });

  it("keeps departure pending while a past-start trip still waits on the reveal", () => {
    const steps = buildTripTimeline(
      { ...base, status: "CONFIRMED", paidAt: "2026-01-11T10:00:00.000Z" },
      new Date("2026-03-14T00:00:00.000Z"),
    );
    expect(summary(steps).slice(2)).toEqual(["revealed:current", "departure:upcoming", "completed:upcoming"]);
  });

  it("uses completedAt for a completed trip", () => {
    const steps = buildTripTimeline(
      { ...base, status: "COMPLETED", completedAt: "2026-03-20T09:00:00.000Z" },
      now,
    );
    expect(steps.every((s) => s.state === "done")).toBe(true);
    expect(steps[4]).toMatchObject({ date: "2026-03-20T09:00:00.000Z", dateOnly: false });
  });

  it("ends a cancelled trip on a cancelled step with no future milestones", () => {
    const steps = buildTripTimeline(
      {
        ...base,
        status: "CANCELLED",
        paidAt: "2026-01-11T10:00:00.000Z",
        updatedAt: "2026-02-01T10:00:00.000Z",
      },
      now,
    );
    expect(summary(steps)).toEqual(["created:done", "paid:done", "cancelled:done"]);
    expect(steps[2].date).toBe("2026-02-01T10:00:00.000Z");
  });
});
