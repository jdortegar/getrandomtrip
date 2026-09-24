import { describe, expect, it } from "vitest";
import { parseDinnerVoucher } from "../dinnerVoucher";

const restaurant = { name: "La Casona", address: "  Calle Colón 123  " };
const item = {
  id: "main",
  title: "Menú del día",
  description: "Opción vegetariana",
};
const data = {
  guests: "Ana Pérez and Luis",
  restaurant,
  date: "2026-09-23",
  time: "20:30",
  service: "Cena para dos",
  menuItems: [item],
};
const document = {
  template: "dinner-voucher",
  templateVersion: 1,
  label: " Dinner ",
  locale: "es",
  country: "AR",
  data,
};
const parse = (patch: object, mode: "draft" | "generation" = "generation") =>
  parseDinnerVoucher({ ...document, data: { ...data, ...patch } }, mode);
const success = (patch: object) => ({
  ok: true,
  value: { ...document, label: "Dinner", data: { ...data, ...patch } },
});
function error(result: unknown, path: string, code: string) {
  expect(result).toEqual({
    ok: false,
    errors: expect.arrayContaining([{ path, code }]),
  });
}

describe("parseDinnerVoucher", () => {
  it.each([
    ["date", "2025-02-29", "invalid_date"],
    ["date", "2026-04-31", "invalid_date"],
    ["time", "24:00", "invalid_time"],
    ["time", "20:60", "invalid_time"],
    ["issueDate", "2026-13-01", "invalid_date"],
  ])("validates %s only for generation", (field, value, code) => {
    const patch = { [field]: value };
    error(parse(patch), `data.${field}`, code);
    expect(parse(patch, "draft")).toEqual(success(patch));
  });
  it.each(["locationUrl", "providerUrl"])("validates optional %s", (field) => {
    for (const value of [
      "http://example.com",
      "https://user:pass@example.com",
      " ",
    ]) {
      const patch = { restaurant: { ...restaurant, [field]: value } };
      error(parse(patch), `data.restaurant.${field}`, "invalid_url");
      expect(parse(patch, "draft")).toEqual(success(patch));
    }
  });
  it("preserves order, explicit claims and inclusive bounds", () => {
    const patch = {
      menuItems: Array.from({ length: 50 }, (_, i) => ({
        id: `${50 - i}`,
        title: "Plato",
      })),
      date: "2024-02-29",
      time: "23:59",
      conditions: "á".repeat(4000),
      holder: "Ana",
      issueDate: "2024-02-28",
      reservationReference: "ABC-42",
      paymentWording: "Pay restaurant",
      supplierConfirmation: "Confirmed by restaurant",
      restaurant: {
        ...restaurant,
        contact: "Recepción",
        locationUrl: "https://example.com/map",
        providerUrl: "https://example.com",
      },
    };
    expect(parse(patch)).toEqual(success(patch));
    const blankOptions = {
      holder: "",
      issueDate: "",
      time: "00:00",
      restaurant: { ...restaurant, locationUrl: "", providerUrl: "" },
    };
    expect(parse(blankOptions)).toEqual(success(blankOptions));
  });
  it("preserves authored text without inferring reservation or payment claims", () => {
    expect(parse({})).toEqual(success({}));
  });
  it.each(["guests", "date", "time", "service"])(
    "requires %s only for generation",
    (field) => {
      const patch = { [field]: "" };
      expect(parse(patch, "draft")).toEqual(success(patch));
      error(parse(patch), `data.${field}`, "required");
    },
  );
  it.each(["name", "address"])(
    "requires restaurant %s only for generation",
    (field) => {
      const patch = { restaurant: { ...restaurant, [field]: " " } };
      expect(parse(patch, "draft")).toEqual(success(patch));
      error(parse(patch), `data.restaurant.${field}`, "required");
    },
  );
  it("allows empty menus but requires supplied titles for generation", () => {
    expect(parse({ menuItems: [] })).toEqual(success({ menuItems: [] }));
    const patch = { menuItems: [{ ...item, title: " " }] };
    expect(parse(patch, "draft")).toEqual(success(patch));
    error(parse(patch), "data.menuItems.0.title", "required");
  });
  for (const mode of ["draft", "generation"] as const) {
    it.each([
      ["$", null],
      ["$", { ...document, extra: true }],
      [
        "$",
        Object.defineProperty({ ...document }, "data", { enumerable: false }),
      ],
      ["data", { ...document, data: { ...data, extra: true } }],
      ["data.restaurant", { ...document, data: { ...data, restaurant: [] } }],
      [
        "data.restaurant",
        {
          ...document,
          data: { ...data, restaurant: { ...restaurant, extra: true } },
        },
      ],
      [
        "data.menuItems.0",
        {
          ...document,
          data: { ...data, menuItems: [{ ...item, extra: true }] },
        },
      ],
    ])(`rejects malformed %s in ${mode}`, (path, input) =>
      error(parseDinnerVoucher(input, mode), String(path), "invalid_shape"),
    );
    it.each([
      "guests",
      "date",
      "time",
      "service",
      "conditions",
      "holder",
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
      `bounds restaurant %s in ${mode}`,
      (field) => {
        for (const [value, code] of [
          [2, "invalid_type"],
          ["x".repeat(4001), "too_long"],
        ])
          error(
            parse({ restaurant: { ...restaurant, [field]: value } }, mode),
            `data.restaurant.${field}`,
            String(code),
          );
      },
    );
    it(`bounds menus and requires stable unique IDs in ${mode}`, () => {
      for (const menuItems of [undefined, null, {}, Array(51).fill(item)])
        error(parse({ menuItems }, mode), "data.menuItems", "invalid_array");
      for (const menuItems of [[null], Array(1)])
        error(parse({ menuItems }, mode), "data.menuItems.0", "invalid_shape");
      error(
        parse({ menuItems: [item, item] }, mode),
        "data.menuItems.1.id",
        "duplicate_id",
      );
      error(
        parse({ menuItems: [{ ...item, id: " " }] }, mode),
        "data.menuItems.0.id",
        "required",
      );
      for (const key of ["id", "title", "description"]) {
        error(
          parse({ menuItems: [{ ...item, [key]: 2 }] }, mode),
          `data.menuItems.0.${key}`,
          "invalid_type",
        );
        error(
          parse({ menuItems: [{ ...item, [key]: "x".repeat(4001) }] }, mode),
          `data.menuItems.0.${key}`,
          "too_long",
        );
      }
    });
    it.each([
      ["template", "invalid_value"],
      ["templateVersion", "invalid_value"],
      ["locale", "invalid_locale"],
      ["country", "invalid_country"],
    ])(`validates %s in ${mode}`, (field, code) =>
      error(
        parseDinnerVoucher({ ...document, [field]: "bad" }, mode),
        field,
        code,
      ),
    );
  }
});
