import { describe, expect, it } from "vitest";
import { parseActivityVoucher } from "../activityVoucher";

const provider = { name: "Aventura", address: "  Río Luján  " };
const item = { id: "kayak", title: "Kayak", description: "Guía en español" };
const data = {
  participants: "Ana Pérez and Luis",
  provider,
  date: "2026-09-23",
  time: "09:30",
  program: [item],
};
const document = {
  template: "activity-voucher",
  templateVersion: 1,
  label: " Activity ",
  locale: "en",
  country: "AR",
  data,
};
const parse = (patch: object, mode: "draft" | "generation" = "generation") =>
  parseActivityVoucher({ ...document, data: { ...data, ...patch } }, mode);
const success = (patch: object) => ({
  ok: true,
  value: { ...document, label: "Activity", data: { ...data, ...patch } },
});
function error(result: unknown, path: string, code: string) {
  expect(result).toEqual({
    ok: false,
    errors: expect.arrayContaining([{ path, code }]),
  });
}

describe("parseActivityVoucher", () => {
  it.each([
    ["date", "2025-02-29", "invalid_date"],
    ["time", "24:00", "invalid_time"],
    ["issueDate", "2026-13-01", "invalid_date"],
  ])("validates supplied %s only for generation", (field, value, code) => {
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
      const patch = { provider: { ...provider, [field]: value } };
      error(parse(patch), `data.provider.${field}`, "invalid_url");
      expect(parse(patch, "draft")).toEqual(success(patch));
    }
  });
  it("preserves order, authored claims, and inclusive limits", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `${50 - i}`,
      title: "Kayak",
    }));
    const patch = {
      program: items,
      inclusions: items,
      date: "2024-02-29",
      time: "00:00",
      recommendations: "á".repeat(4000),
      holder: "Ana",
      issueDate: "2024-02-28",
      reservationReference: "ABC-42",
      paymentWording: "Pay provider",
      supplierConfirmation: "Confirmed by provider",
      provider: {
        ...provider,
        contact: "Guía",
        locationUrl: "https://example.com/map",
        providerUrl: "https://example.com",
      },
    };
    expect(parse(patch)).toEqual(success(patch));
    expect(
      parse({
        time: "23:59",
        holder: "",
        provider: { ...provider, providerUrl: "" },
      }),
    ).toEqual(
      success({
        time: "23:59",
        holder: "",
        provider: { ...provider, providerUrl: "" },
      }),
    );
  });
  it("preserves authored text without inventing supplier/payment claims", () => {
    expect(parse({})).toEqual(success({}));
  });
  it.each(["participants", "date", "time"])(
    "requires %s only for generation",
    (field) => {
      expect(parse({ [field]: "" }, "draft")).toEqual(success({ [field]: "" }));
      error(parse({ [field]: "" }), `data.${field}`, "required");
    },
  );
  it.each(["name", "address"])("requires provider %s", (field) => {
    const patch = { provider: { ...provider, [field]: " " } };
    expect(parse(patch, "draft")).toEqual(success(patch));
    error(parse(patch), `data.provider.${field}`, "required");
  });
  it("requires a program, but allows absent or empty inclusions", () => {
    expect(parse({ program: [] }, "draft")).toEqual(success({ program: [] }));
    error(parse({ program: [] }), "data.program", "required");
    expect(parse({ inclusions: [] })).toEqual(success({ inclusions: [] }));
  });
  for (const mode of ["draft", "generation"] as const) {
    it.each([
      ["$", null],
      ["$", { ...document, privateKey: "secret" }],
      [
        "$",
        Object.defineProperty({ ...document }, "data", { enumerable: false }),
      ],
      ["data", { ...document, data: { ...data, extra: true } }],
      ["data.provider", { ...document, data: { ...data, provider: [] } }],
      [
        "data.provider",
        { ...document, data: { ...data, provider: { ...provider, extra: 1 } } },
      ],
    ])(`rejects malformed %s in ${mode}`, (path, input) =>
      error(parseActivityVoucher(input, mode), String(path), "invalid_shape"),
    );
    it.each([
      "participants",
      "date",
      "time",
      "holder",
      "issueDate",
      "reservationReference",
      "paymentWording",
      "supplierConfirmation",
      "recommendations",
    ])(`bounds %s in ${mode}`, (field) => {
      error(parse({ [field]: null }, mode), `data.${field}`, "invalid_type");
      error(
        parse({ [field]: "x".repeat(4001) }, mode),
        `data.${field}`,
        "too_long",
      );
    });
    it.each(["name", "address", "contact", "locationUrl", "providerUrl"])(
      `bounds provider %s in ${mode}`,
      (field) => {
        for (const [value, code] of [
          [1, "invalid_type"],
          ["x".repeat(4001), "too_long"],
        ])
          error(
            parse({ provider: { ...provider, [field]: value } }, mode),
            `data.provider.${field}`,
            String(code),
          );
      },
    );
    it.each(["program", "inclusions"])(
      `validates ordered %s in ${mode}`,
      (field) => {
        for (const value of [undefined, null, {}, Array(51).fill(item)])
          error(
            parse({ [field]: value }, mode),
            `data.${field}`,
            "invalid_array",
          );
        for (const [value, code] of [
          [null, "invalid_shape"],
          [{ ...item, extra: 1 }, "invalid_shape"],
        ])
          error(
            parse({ [field]: [value] }, mode),
            `data.${field}.0`,
            String(code),
          );
        error(
          parse({ [field]: [item, item] }, mode),
          `data.${field}.1.id`,
          "duplicate_id",
        );
        error(
          parse({ [field]: [{ ...item, id: " " }] }, mode),
          `data.${field}.0.id`,
          "required",
        );
        for (const key of ["id", "title", "description"]) {
          error(
            parse({ [field]: [{ ...item, [key]: 1 }] }, mode),
            `data.${field}.0.${key}`,
            "invalid_type",
          );
          error(
            parse({ [field]: [{ ...item, [key]: "x".repeat(4001) }] }, mode),
            `data.${field}.0.${key}`,
            "too_long",
          );
        }
      },
    );
    it.each([
      ["template", "invalid_value"],
      ["templateVersion", "invalid_value"],
      ["locale", "invalid_locale"],
      ["country", "invalid_country"],
    ])(`validates %s in ${mode}`, (field, code) =>
      error(
        parseActivityVoucher({ ...document, [field]: "bad" }, mode),
        field,
        code,
      ),
    );
  }
  it.each(["program", "inclusions"])(
    "requires supplied %s titles only for generation",
    (field) => {
      const patch = { [field]: [{ ...item, title: " " }] };
      error(parse(patch), `data.${field}.0.title`, "required");
      expect(parse(patch, "draft")).toEqual(success(patch));
    },
  );
});
