import { describe, expect, it } from "vitest";

import { parseXsedNotificationBody } from "../notifications";

describe("parseXsedNotificationBody", () => {
  it("normalizes valid signup input", () => {
    expect(
      parseXsedNotificationBody({
        email: "  Traveler@Example.COM ",
        locale: "en",
      }),
    ).toEqual({
      email: "traveler@example.com",
      locale: "en",
    });
  });

  it("rejects invalid email input", () => {
    expect(
      parseXsedNotificationBody({
        email: "not-an-email",
        locale: "es",
      }),
    ).toBeNull();
  });

  it("omits unsupported locale input", () => {
    expect(
      parseXsedNotificationBody({
        email: "traveler@example.com",
        locale: "fr",
      }),
    ).toEqual({
      email: "traveler@example.com",
      locale: null,
    });
  });
});
