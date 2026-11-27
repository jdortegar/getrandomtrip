import { render } from "@react-email/components";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { config } from "../../../netlify/functions/xsed-notify";
import { getNotifyTargetUtcOffset, LOCAL_WINDOW_START_HOUR } from "@/lib/xsed/window";
import XsedDropNotification, { subjects } from "../XsedDropNotification";

/** Minutes between the cron's send minute (:50) and the top-of-hour opening. */
const cronMinute = Number(String(config.schedule).split(" ")[0]);
const leadMinutes = 60 - cronMinute;

describe("XSED drop email timing", () => {
  it("is sent 10 minutes before the window opens (17:50 for an 18:00 drop)", () => {
    expect(leadMinutes).toBe(10);
    // Sunday 20:50 UTC = 17:50 in Buenos Aires, the hour before LOCAL_WINDOW_START_HOUR.
    expect(LOCAL_WINDOW_START_HOUR).toBe(18);
    expect(getNotifyTargetUtcOffset(new Date("2026-09-27T20:50:00Z"))).toBe(-3);
  });

  it.each([
    ["es", `${leadMinutes} minutos`],
    ["en", `${leadMinutes} minutes`],
  ] as const)("promises the real lead time in the %s subject and body", async (locale, phrase) => {
    const html = await render(<XsedDropNotification locale={locale} />);
    expect(subjects[locale]).toContain(phrase);
    expect(html).toContain(phrase);
    expect(html).not.toMatch(/\b(?!10\b)\d+ (minutos|minutes)/);
  });
});
