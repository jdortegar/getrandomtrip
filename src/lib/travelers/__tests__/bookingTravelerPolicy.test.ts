import { expect, it } from "vitest";
import { summarizeCompanionDetails } from "../bookingTravelerPolicy";
const adult = {
  kind: "ADULT",
  fullName: "Test Guest",
  idDocument: "TEST-ID",
  email: "guest@example.test",
  dateOfBirth: null,
};
it("counts field completeness, not persisted row count or stale status", () => {
  const stale = { ...adult, status: "COMPLETE", fullName: " " };
  expect(summarizeCompanionDetails([stale], 2, {})).toMatchObject({
    expected: 1,
    complete: 0,
    incomplete: 1,
    missing: 0,
    extra: 0,
    needsReminder: true,
  });
});
it("requires DOB instead of email for minors, never phone", () => {
  expect(
    summarizeCompanionDetails(
      [{ ...adult, kind: "MINOR", email: null }],
      2,
      {},
    ),
  ).toMatchObject({ incomplete: 1 });
  expect(
    summarizeCompanionDetails(
      [{ ...adult, kind: "MINOR", email: null, dateOfBirth: "2015-01-02" }],
      2,
      {},
    ),
  ).toMatchObject({ complete: 1, needsReminder: false });
  expect(summarizeCompanionDetails([adult], 2, {})).toMatchObject({
    complete: 1,
    needsReminder: false,
  });
});
it("counts uncreated legacy slots using max of pax and structured headcount", () => {
  expect(summarizeCompanionDetails([], 3, {})).toMatchObject({
    expected: 2,
    missing: 2,
    needsReminder: true,
  });
  expect(
    summarizeCompanionDetails([adult], 1, { adults: 2, minors: 1, pets: 3 }),
  ).toMatchObject({ expected: 2, missing: 1 });
});
it("distinguishes extras from missing slots and does not remind complete companions", () => {
  expect(summarizeCompanionDetails([adult, adult], 2, {})).toMatchObject({
    complete: 2,
    missing: 0,
    extra: 1,
    needsReminder: false,
  });
  expect(summarizeCompanionDetails([], 1, {})).toMatchObject({
    complete: 0,
    missing: 0,
    needsReminder: false,
  });
});
