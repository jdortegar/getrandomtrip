import { describe, expect, it } from "vitest";
import { parseHotelVoucher } from "../hotelVoucher";

const property = { name: "Hotel Azul", address: "  Calle 12, Tandil  " };
const item = { id: "breakfast", title: "Breakfast", description: "Two guests" };
const data = {
  holder: "Ana Pérez",
  guests: "Ana and Luis",
  checkInDate: "2026-09-23",
  checkOutDate: "2026-09-25",
  property,
  inclusions: [item],
};
const document = {
  template: "hotel-voucher",
  templateVersion: 1,
  label: " Hotel ",
  locale: "es",
  country: "AR",
  data,
};
const parse = (patch: object, mode: "draft" | "generation" = "generation") =>
  parseHotelVoucher({ ...document, data: { ...data, ...patch } }, mode);
const success = (patch: object) => ({
  ok: true,
  value: { ...document, label: "Hotel", data: { ...data, ...patch } },
});
function error(result: unknown, path: string, code: string) {
  expect(result).toEqual({
    ok: false,
    errors: expect.arrayContaining([{ path, code }]),
  });
}

describe("parseHotelVoucher", () => {
  it.each([
    ["checkInDate", "2025-02-29", "invalid_date"],
    ["checkOutDate", "2026-09-22", "invalid_range"],
    ["issueDate", "2026-13-01", "invalid_date"],
    ["checkInTime", "24:00", "invalid_time"],
    ["checkOutTime", "11:60", "invalid_time"],
  ])("validates %s only for generation", (field, value, code) => {
    const patch = { [field]: value };
    error(parse(patch), `data.${field}`, code);
    expect(parse(patch, "draft")).toEqual(success(patch));
  });
  it.each(["locationUrl", "providerUrl"])(
    "validates optional property %s",
    (field) => {
      const patch = {
        property: { ...property, [field]: "https://user:pass@example.com" },
      };
      error(parse(patch), `data.property.${field}`, "invalid_url");
      expect(parse(patch, "draft")).toEqual(success(patch));
    },
  );
  it("allows empty inclusions but validates supplied titles", () => {
    expect(parse({ inclusions: [] })).toEqual(success({ inclusions: [] }));
    error(
      parse({ inclusions: [{ ...item, title: " " }] }),
      "data.inclusions.0.title",
      "required",
    );
    error(
      parse({ inclusions: [{ ...item, description: 2 }] }),
      "data.inclusions.0.description",
      "invalid_type",
    );
  });
  it("preserves order and explicit supplier wording at inclusive bounds", () => {
    const inclusions = Array.from({ length: 50 }, (_, i) => ({
      id: `${50 - i}`,
      title: "Breakfast",
    }));
    const patch = {
      inclusions,
      checkOutDate: data.checkInDate,
      checkInTime: "00:00",
      checkOutTime: "23:59",
      issueDate: "2024-02-29",
      instructions: "á".repeat(4000),
      reservationReference: "ABC-42",
      paymentWording: "Pay the hotel",
      supplierConfirmation: "Confirmed by hotel",
      property: {
        ...property,
        contact: "Front desk",
        locationUrl: "https://example.com/map",
        providerUrl: "https://example.com",
      },
    };
    expect(parse(patch)).toEqual(success(patch));
  });
  it("preserves authored text without inventing supplier/payment claims", () => {
    expect(parse({})).toEqual(success({}));
  });
  it.each(["holder", "guests", "checkInDate", "checkOutDate"])(
    "requires %s only for generation",
    (field) => {
      expect(parse({ [field]: "" }, "draft")).toEqual(success({ [field]: "" }));
      error(parse({ [field]: "" }), `data.${field}`, "required");
    },
  );
  it.each(["name", "address"])(
    "requires property %s only for generation",
    (field) => {
      const patch = { property: { ...property, [field]: "" } };
      expect(parse(patch, "draft")).toEqual(success(patch));
      error(parse(patch), `data.property.${field}`, "required");
    },
  );
  for (const mode of ["draft", "generation"] as const) {
    it.each([
      ["$", null],
      ["$", { ...document, privateKey: "secret" }],
      [
        "$",
        Object.defineProperty({ ...document }, "data", { enumerable: false }),
      ],
      ["data", { ...document, data: { ...data, extra: true } }],
      ["data.property", { ...document, data: { ...data, property: [] } }],
      [
        "data.inclusions.0",
        {
          ...document,
          data: { ...data, inclusions: [{ ...item, extra: true }] },
        },
      ],
    ])(`rejects malformed %s in ${mode}`, (path, input) =>
      error(parseHotelVoucher(input, mode), String(path), "invalid_shape"),
    );
    it.each([
      "holder",
      "guests",
      "checkInDate",
      "checkOutDate",
      "checkInTime",
      "checkOutTime",
      "instructions",
      "issueDate",
      "reservationReference",
      "paymentWording",
      "supplierConfirmation",
    ])(`bounds %s in ${mode}`, (field) => {
      error(parse({ [field]: null }, mode), `data.${field}`, "invalid_type");
      error(
        parse({ [field]: "x".repeat(4001) }, mode),
        `data.${field}`,
        "too_long",
      );
    });
    it.each(["name", "address", "contact", "locationUrl", "providerUrl"])(
      `bounds property %s in ${mode}`,
      (field) => {
        const patch = { property: { ...property, [field]: "x".repeat(4001) } };
        error(parse(patch, mode), `data.property.${field}`, "too_long");
      },
    );
    it(`bounds inclusions and requires stable unique IDs in ${mode}`, () => {
      error(
        parse({ inclusions: Array(51).fill(item) }, mode),
        "data.inclusions",
        "invalid_array",
      );
      error(
        parse({ inclusions: [item, item] }, mode),
        "data.inclusions.1.id",
        "duplicate_id",
      );
      error(
        parse({ inclusions: [{ ...item, id: "" }] }, mode),
        "data.inclusions.0.id",
        "required",
      );
    });
    it.each(["template", "templateVersion", "locale", "country"])(
      `validates %s in ${mode}`,
      (field) => {
        const codes = {
          template: "invalid_value",
          templateVersion: "invalid_value",
          locale: "invalid_locale",
          country: "invalid_country",
        };
        error(
          parseHotelVoucher({ ...document, [field]: "bad" }, mode),
          field,
          codes[field as keyof typeof codes],
        );
      },
    );
  }
});
