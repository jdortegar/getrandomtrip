import { describe, expect, it } from "vitest";
import { formatPaymentDeadline } from "../payment-deadline";

const deadline = new Date("2026-10-30T12:00:00.000Z");

describe("formatPaymentDeadline", () => {
  it("uses a 24h clock in the trip's time zone, in both locales", () => {
    expect(formatPaymentDeadline(deadline, "es", "America/Argentina/Buenos_Aires")).toBe("30 de octubre de 2026 a las 09:00");
    expect(formatPaymentDeadline(deadline, "en", "Europe/Madrid")).toBe("October 30, 2026 at 13:00");
  });

  it("falls back to Buenos Aires for a missing or unknown zone", () => {
    expect(formatPaymentDeadline(deadline, "es", null)).toBe("30 de octubre de 2026 a las 09:00");
    expect(formatPaymentDeadline(deadline, "es", "Not/AZone")).toBe("30 de octubre de 2026 a las 09:00");
  });
});
