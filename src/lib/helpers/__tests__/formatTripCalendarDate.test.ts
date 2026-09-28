import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("trip calendar dates versus event timestamps", () => {
  it.each([
    ["America/Argentina/Buenos_Aires", "Oct 2, 2026", "Oct 3, 2026"],
    ["Asia/Tokyo", "Oct 3, 2026", "Oct 4, 2026"],
  ])(
    "preserves travel days and local event dates in %s",
    (timeZone, early, late) => {
      // Start a real process: changing TZ inside a test worker is not portable.
      const output = execFileSync(
        process.execPath,
        [
          "--import",
          "tsx",
          "--eval",
          `
          const { formatTripCalendarDate } = require(${JSON.stringify(resolve("src/lib/helpers/formatTripCalendarDate.ts"))});
          const { formatAdminDate } = require(${JSON.stringify(resolve("src/lib/admin/format.ts"))});
          const start = "2026-10-03T00:00:00.000Z";
          const end = "2026-10-04T00:00:00.000Z";
          console.log(JSON.stringify({
            en: [formatTripCalendarDate(start, "en"), formatTripCalendarDate(end, "en")],
            es: [formatTripCalendarDate(start, "es"), formatTripCalendarDate(end, "es")],
            dateOnly: formatTripCalendarDate("2026-10-03", "en"),
            missing: formatTripCalendarDate(null, "es"),
            earlyEvent: formatAdminDate(start, "en"),
            lateEvent: formatAdminDate("2026-10-03T23:30:00.000Z", "en")
          }));
        `,
        ],
        { encoding: "utf8", env: { ...process.env, TZ: timeZone } },
      );

      expect(JSON.parse(output)).toEqual({
        en: ["Oct 3, 2026", "Oct 4, 2026"],
        es: ["3 oct 2026", "4 oct 2026"],
        dateOnly: "Oct 3, 2026",
        missing: "—",
        earlyEvent: early,
        lateEvent: late,
      });
    },
  );
});
