import { describe, it, expect } from "vitest";
import { subjects } from "../TripperInvite";

const TRIPPER_WORDS = /tripper/i;

describe("TripperInvite subjects", () => {
  it("has distinct, non-empty es and en subjects for TRIPPER", () => {
    expect(subjects.TRIPPER.es).toBeTruthy();
    expect(subjects.TRIPPER.en).toBeTruthy();
    expect(subjects.TRIPPER.es).not.toBe(subjects.TRIPPER.en);
  });

  it("has distinct, non-empty es and en subjects for SITE_ACCESS", () => {
    expect(subjects.SITE_ACCESS.es).toBeTruthy();
    expect(subjects.SITE_ACCESS.en).toBeTruthy();
    expect(subjects.SITE_ACCESS.es).not.toBe(subjects.SITE_ACCESS.en);
  });

  it("SITE_ACCESS subject never references a Tripper role, in either locale", () => {
    expect(subjects.SITE_ACCESS.es).not.toMatch(TRIPPER_WORDS);
    expect(subjects.SITE_ACCESS.en).not.toMatch(TRIPPER_WORDS);
  });

  it("TRIPPER subject still references the Tripper role, in either locale", () => {
    expect(subjects.TRIPPER.es).toMatch(TRIPPER_WORDS);
    expect(subjects.TRIPPER.en).toMatch(TRIPPER_WORDS);
  });
});
