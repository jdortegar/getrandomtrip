import { describe, expect, it } from "vitest";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import { validateDocumentMetadata } from "../documentMetadata";

describe("validateDocumentMetadata", () => {
  it("trims the label and preserves valid generation metadata", () => {
    expect(
      validateDocumentMetadata(
        { label: "  Hotel confirmation  ", country: "AR", locale: "en" },
        "generation",
      ),
    ).toEqual({
      ok: true,
      value: { label: "Hotel confirmation", country: "AR", locale: "en" },
    });
  });

  it("retains incomplete draft blanks but requires them for generation", () => {
    const input = { label: " \n ", country: "", locale: "es" };
    expect(validateDocumentMetadata(input, "draft")).toEqual({
      ok: true,
      value: { label: "", country: "", locale: "es" },
    });
    expect(validateDocumentMetadata(input, "generation")).toEqual({
      ok: false,
      errors: [
        { path: "label", code: "required" },
        { path: "country", code: "required" },
      ],
    });
  });

  it.each([1, 120])("accepts a %i-character label after trimming", (length) => {
    const label = "á".repeat(length);
    expect(
      validateDocumentMetadata(
        { label: ` ${label} `, country: "TT", locale: "es" },
        "generation",
      ),
    ).toEqual({ ok: true, value: { label, country: "TT", locale: "es" } });
  });

  describe.each(["draft", "generation"] as const)("%s", (mode) => {
    const valid = { label: "Trip", country: "AR", locale: "en" };

    it.each([null, undefined, [], "Trip", 42, false, new Date(), new Map()])(
      "rejects non-record metadata %j without throwing",
      (input) => {
        expect(validateDocumentMetadata(input, mode)).toEqual({
          ok: false,
          errors: [{ path: "$", code: "invalid_shape" }],
        });
      },
    );

    it("rejects unknown fields and inherited metadata", () => {
      const hidden = Object.defineProperty({ ...valid }, "storageKey", {
        value: "private",
      });
      for (const input of [
        { ...valid, storageKey: "private" },
        { ...valid, [Symbol("private")]: true },
        hidden,
        Object.create(valid),
      ]) {
        expect(validateDocumentMetadata(input, mode)).toEqual({
          ok: false,
          errors: [{ path: "$", code: "invalid_shape" }],
        });
      }
    });

    it("accepts a plain null-prototype record", () => {
      expect(
        validateDocumentMetadata(
          Object.assign(Object.create(null), valid),
          mode,
        ),
      ).toEqual({
        ok: true,
        value: valid,
      });
    });

    describe.each(["label", "country", "locale"] as const)("%s", (path) => {
      it.each([null, undefined, 7, false, [], {}])(
        "rejects non-string %j",
        (value) => {
          expect(
            validateDocumentMetadata({ ...valid, [path]: value }, mode),
          ).toEqual({
            ok: false,
            errors: [{ path, code: "invalid_type" }],
          });
        },
      );

      it("rejects a missing field instead of silently defaulting it", () => {
        const input: Partial<typeof valid> = { ...valid };
        delete input[path];
        expect(validateDocumentMetadata(input, mode)).toEqual({
          ok: false,
          errors: [{ path, code: "invalid_type" }],
        });
      });
    });

    it("returns all field errors without mutating input", () => {
      const input = Object.freeze({
        label: "x".repeat(121),
        country: "ZZ",
        locale: "fr",
      });
      expect(validateDocumentMetadata(input, mode)).toEqual({
        ok: false,
        errors: [
          { path: "label", code: "too_long" },
          { path: "country", code: "invalid_country" },
          { path: "locale", code: "invalid_locale" },
        ],
      });
      const padded = Object.freeze({ ...valid, label: "  Hotel  " });
      expect(validateDocumentMetadata(padded, mode)).toEqual({
        ok: true,
        value: { ...valid, label: "Hotel" },
      });
      expect(padded.label).toBe("  Hotel  ");
    });

    it("rejects labels longer than the publication limit", () => {
      expect(
        validateDocumentMetadata(
          { label: "a".repeat(121), country: "AR", locale: "en" },
          mode,
        ),
      ).toEqual({ ok: false, errors: [{ path: "label", code: "too_long" }] });
    });

    it.each(DESTINATION_COUNTRY_CODES)(
      "accepts catalog country %s",
      (country) => {
        const input = { label: "Reserva", country, locale: "es" };
        expect(validateDocumentMetadata(input, mode)).toEqual({
          ok: true,
          value: input,
        });
      },
    );

    it.each(["ZZ", "FR", "ar", " AR ", " "])(
      "rejects country %j",
      (country) => {
        expect(
          validateDocumentMetadata(
            { label: "Trip", country, locale: "en" },
            mode,
          ),
        ).toEqual({
          ok: false,
          errors: [{ path: "country", code: "invalid_country" }],
        });
      },
    );

    it.each(["fr", "", "EN", " es "])("rejects locale %j", (locale) => {
      expect(
        validateDocumentMetadata(
          { label: "Trip", country: "AR", locale },
          mode,
        ),
      ).toEqual({
        ok: false,
        errors: [{ path: "locale", code: "invalid_locale" }],
      });
    });
  });
});
