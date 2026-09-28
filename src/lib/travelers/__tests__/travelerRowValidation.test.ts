import { describe, it, expect } from "vitest";
import {
  isMinorRowFilled,
} from "../travelerRowValidation";

describe("isMinorRowFilled", () => {
  it("returns true when name, dateOfBirth, and idDocument are all filled", () => {
    expect(
      isMinorRowFilled({
        fullName: "Lucia Duarte",
        dateOfBirth: "2016-04-02",
        idDocument: "XPB998212",
      }),
    ).toBe(true);
  });

  it("returns false when any field is blank", () => {
    expect(
      isMinorRowFilled({ fullName: "Lucia Duarte", dateOfBirth: "", idDocument: "XPB998212" }),
    ).toBe(false);
    expect(
      isMinorRowFilled({ fullName: "", dateOfBirth: "2016-04-02", idDocument: "XPB998212" }),
    ).toBe(false);
    expect(
      isMinorRowFilled({ fullName: "Lucia Duarte", dateOfBirth: "2016-04-02", idDocument: "" }),
    ).toBe(false);
  });

  it("treats whitespace-only fields as blank", () => {
    expect(
      isMinorRowFilled({ fullName: "   ", dateOfBirth: "2016-04-02", idDocument: "XPB998212" }),
    ).toBe(false);
  });
});
