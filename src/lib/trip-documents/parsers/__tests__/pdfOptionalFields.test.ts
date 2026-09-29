import { expect, it } from "vitest";
import { parseDraftDocument, parseDraftPatch } from "../../draftContracts";
import { parseHotelVoucher } from "../hotelVoucher";
import { parseDinnerVoucher } from "../dinnerVoucher";
import { parseActivityVoucher } from "../activityVoucher";
import { parseXsedRoadmap } from "../xsedRoadmap";
import { parseExperienceRoadmap } from "../experienceRoadmap";
import { referenceFixtures } from "../../pdf/__tests__/referenceFixtures";
const parsers = {
  "hotel-voucher": parseHotelVoucher,
  "dinner-voucher": parseDinnerVoucher,
  "activity-voucher": parseActivityVoucher,
  "xsed-roadmap": parseXsedRoadmap,
  "experience-roadmap": parseExperienceRoadmap,
};
for (const fixture of referenceFixtures) {
  it(`round-trips optional ${fixture.template} fields through drafts and validated generation`, () => {
    expect(parseDraftDocument(fixture)).toEqual({ ok: true, value: fixture });
    expect(parseDraftPatch({ revision: 1, document: fixture })).toEqual({
      ok: true,
      value: { revision: 1, document: fixture },
    });
    expect(parsers[fixture.template](fixture, "generation")).toEqual({
      ok: true,
      value: fixture,
    });
  });
  it(`accepts version-one ${fixture.template} payloads without new optional fields`, () => {
    const legacy = structuredClone(fixture);
    for (const key of [
      "localActivities",
      "supplierConfirmationUrl",
      "reservationReference",
      "travelerLabel",
      "experienceLabel",
      "service",
      "endTime",
    ] as const) {
      if (key !== "service" || legacy.template === "activity-voucher")
        Reflect.deleteProperty(legacy.data, key);
    }
    for (const key of ["property", "restaurant", "provider"] as const) {
      const provider = Reflect.get(legacy.data, key);
      if (provider)
        for (const field of ["locality", "region", "email"])
          Reflect.deleteProperty(provider, field);
    }
    expect(parsers[legacy.template](legacy, "generation").ok).toBe(true);
  });
  if (
    ["hotel-voucher", "dinner-voucher", "activity-voucher"].includes(
      fixture.template,
    )
  ) {
    it.each([
      "http://example.com",
      "javascript:alert(1)",
      "data:application/pdf,test",
      "https://user:password@example.com",
    ])(
      `rejects unsafe authored confirmation URL for ${fixture.template}: %s`,
      (url) => {
        expect(
          parsers[fixture.template](
            {
              ...fixture,
              data: { ...fixture.data, supplierConfirmationUrl: url },
            },
            "generation",
          ),
        ).toMatchObject({
          ok: false,
          errors: [
            { path: "data.supplierConfirmationUrl", code: "invalid_url" },
          ],
        });
      },
    );
  }
}
