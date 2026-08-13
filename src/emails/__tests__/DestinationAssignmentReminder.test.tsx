import { describe, it, expect } from "vitest";
import { subjects, escalatedSubjects } from "../DestinationAssignmentReminder";

describe("subjects", () => {
  it("has distinct, non-empty es and en subjects", () => {
    expect(subjects.es).toBeTruthy();
    expect(subjects.en).toBeTruthy();
    expect(subjects.es).not.toBe(subjects.en);
  });
});

describe("escalatedSubjects", () => {
  it("has distinct, non-empty es and en escalated subjects", () => {
    expect(escalatedSubjects.es).toBeTruthy();
    expect(escalatedSubjects.en).toBeTruthy();
    expect(escalatedSubjects.es).not.toBe(escalatedSubjects.en);
  });

  it("differs from the standard subject in each locale", () => {
    expect(escalatedSubjects.es).not.toBe(subjects.es);
    expect(escalatedSubjects.en).not.toBe(subjects.en);
  });
});
