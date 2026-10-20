import { describe, expect, it } from "vitest";

import {
  contactListQuerySchema,
  createCampaignSchema,
  createContactSchema,
  createSegmentSchema,
  promoLookupQuerySchema,
  updateCampaignSchema,
  updateContactSchema,
  updateSegmentSchema,
} from "../emailCampaigns";

describe("contactListQuerySchema paging", () => {
  it("falls back to page 1 for non-finite or invalid pages", () => {
    for (const page of ["1e400", "-3", "abc", "0", null]) {
      expect(contactListQuerySchema.parse({ page, limit: null }).page).toBe(1);
    }
  });

  it("keeps valid pages and clamps the limit", () => {
    const parsed = contactListQuerySchema.parse({ page: "3", limit: "500" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(100);
  });

  it("accepts a segment filter and drops a blank one", () => {
    expect(contactListQuerySchema.parse({ segmentId: "s1" }).segmentId).toBe("s1");
    expect(contactListQuerySchema.parse({ segmentId: " " }).segmentId).toBeUndefined();
  });
});

describe("contact segment ids", () => {
  it("de-duplicates segment ids on create and update", () => {
    expect(
      createContactSchema.parse({ email: "a@example.com", segmentIds: ["s1", " s1 ", "s2"] })
        .segmentIds,
    ).toEqual(["s1", "s2"]);
    expect(updateContactSchema.parse({ segmentIds: ["s2", "s2"] })).toEqual({
      segmentIds: ["s2"],
    });
  });

  it("allows clearing every membership", () => {
    expect(updateContactSchema.parse({ segmentIds: [] })).toEqual({ segmentIds: [] });
  });

  it("rejects non-string or blank ids", () => {
    expect(updateContactSchema.safeParse({ segmentIds: [1] }).success).toBe(false);
    expect(updateContactSchema.safeParse({ segmentIds: [" "] }).success).toBe(false);
  });
});

describe("segment schemas", () => {
  it("trims the name and normalizes a blank description to null", () => {
    expect(createSegmentSchema.parse({ name: "  VIP  ", description: " " })).toEqual({
      name: "VIP",
      description: null,
    });
    expect(createSegmentSchema.parse({ name: "VIP" })).toEqual({
      name: "VIP",
      description: null,
    });
  });

  it.each([
    ["blank name", { name: "   " }],
    ["long name", { name: "x".repeat(61) }],
    ["long description", { name: "VIP", description: "x".repeat(301) }],
    ["unknown key", { name: "VIP", systemKey: "WAITLIST" }],
  ])("rejects %s", (_label, body) => {
    expect(createSegmentSchema.safeParse(body).success).toBe(false);
  });

  it("accepts partial updates and rejects empty ones", () => {
    expect(updateSegmentSchema.parse({ name: " Espera " })).toEqual({ name: "Espera" });
    expect(updateSegmentSchema.parse({ description: null })).toEqual({ description: null });
    expect(updateSegmentSchema.safeParse({}).success).toBe(false);
    expect(updateSegmentSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("createCampaignSchema", () => {
  const valid = {
    name: "Founders launch",
    subject: "Tu escapada te espera",
    preheader: "",
    title: "Llegó el momento",
    bodyMarkdown: "Hola **viajero**",
    ctaLabel: "Reservar",
    ctaUrl: "https://getrandomtrip.com/es",
    locale: "es",
    segmentIds: ["seg_waitlist", "seg_waitlist", "s1"],
    promoCode: " fundador30 ",
  };

  it("accepts a full campaign and normalizes optional fields", () => {
    const parsed = createCampaignSchema.parse(valid);
    expect(parsed.preheader).toBeNull();
    expect(parsed.segmentIds).toEqual(["seg_waitlist", "s1"]);
    expect(parsed.promoCode).toBe("FUNDADOR30");
  });

  it("treats an empty promo code as none", () => {
    expect(createCampaignSchema.parse({ ...valid, promoCode: "  " }).promoCode).toBeNull();
  });

  it.each([
    ["locale", { locale: "pt" }],
    ["empty segments", { segmentIds: [] }],
    ["blank segment id", { segmentIds: [" "] }],
    ["legacy segment sources", { segmentSources: ["WAITLIST"] }],
    ["long subject", { subject: "x".repeat(151) }],
    ["long preheader", { preheader: "x".repeat(201) }],
    ["long title", { title: "x".repeat(151) }],
    ["long body", { bodyMarkdown: "x".repeat(20_001) }],
    ["blank body", { bodyMarkdown: "   " }],
    ["http cta", { ctaUrl: "http://getrandomtrip.com" }],
    ["relative cta", { ctaUrl: "/es/xsed" }],
    ["cta url without label", { ctaLabel: "" }],
    ["cta label without url", { ctaUrl: null }],
    ["unknown key", { status: "SENT" }],
  ])("rejects %s", (_label, override) => {
    expect(createCampaignSchema.safeParse({ ...valid, ...override }).success).toBe(
      false,
    );
  });

  it("accepts a campaign without CTA", () => {
    expect(
      createCampaignSchema.safeParse({ ...valid, ctaLabel: null, ctaUrl: "" })
        .success,
    ).toBe(true);
  });
});

describe("updateCampaignSchema", () => {
  it("accepts partial updates and clears the promo code with an empty string", () => {
    expect(updateCampaignSchema.parse({ promoCode: "" })).toEqual({
      promoCode: null,
    });
    expect(updateCampaignSchema.parse({ title: " New " })).toEqual({ title: "New" });
  });

  it("requires CTA label and URL to change together", () => {
    expect(
      updateCampaignSchema.safeParse({ ctaUrl: "https://getrandomtrip.com" }).success,
    ).toBe(false);
    expect(
      updateCampaignSchema.safeParse({ ctaUrl: null, ctaLabel: null }).success,
    ).toBe(true);
  });

  it("rejects empty bodies and unknown keys", () => {
    expect(updateCampaignSchema.safeParse({}).success).toBe(false);
    expect(updateCampaignSchema.safeParse({ status: "SENT" }).success).toBe(false);
  });
});

describe("promoLookupQuerySchema", () => {
  it("uppercases the code and rejects blanks", () => {
    expect(promoLookupQuerySchema.parse({ code: " amigos30 " })).toEqual({
      code: "AMIGOS30",
    });
    expect(promoLookupQuerySchema.safeParse({ code: " " }).success).toBe(false);
    expect(promoLookupQuerySchema.safeParse({ code: null }).success).toBe(false);
  });
});
