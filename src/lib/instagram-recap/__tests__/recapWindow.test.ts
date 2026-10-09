import { expect, it } from "vitest";
import { getRecapWindows } from "../recapWindow";

it("covers yesterday on a regular weekday (Argentina time)", () => {
  // Thu 8 Oct 2026 09:05 ART
  const { current, previous } = getRecapWindows(
    new Date("2026-10-08T12:05:00Z"),
  );
  expect(current).toEqual({
    start: "2026-10-07",
    end: "2026-10-07",
    sinceSec: Date.parse("2026-10-07T03:00:00Z") / 1000,
    untilSec: Date.parse("2026-10-08T03:00:00Z") / 1000,
  });
  expect(previous.start).toBe("2026-09-30");
  expect(previous.end).toBe("2026-09-30");
});

it("covers Fri–Sun on Monday", () => {
  const { current, previous } = getRecapWindows(
    new Date("2026-10-12T12:05:00Z"),
  );
  expect(current.start).toBe("2026-10-09");
  expect(current.end).toBe("2026-10-11");
  expect(current.untilSec - current.sinceSec).toBe(3 * 86_400);
  expect(previous.start).toBe("2026-10-02");
  expect(previous.end).toBe("2026-10-04");
});

it("uses the Argentina date just after UTC midnight", () => {
  // 01:00 UTC Tue = 22:00 ART Mon → still Monday locally
  const { current } = getRecapWindows(new Date("2026-10-13T01:00:00Z"));
  expect(current.end).toBe("2026-10-11");
});
