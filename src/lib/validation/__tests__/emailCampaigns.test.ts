import { describe, expect, it } from "vitest";

import {
  contactListQuerySchema,
  createCampaignSchema,
  promoLookupQuerySchema,
  updateCampaignSchema,
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
    segmentSources: ["WAITLIST", "WAITLIST", "FRIENDS_FAMILY"],
    promoCode: " fundador30 ",
  };

  it("accepts a full campaign and normalizes optional fields", () => {
    const parsed = createCampaignSchema.parse(valid);
    expect(parsed.preheader).toBeNull();
    expect(parsed.segmentSources).toEqual(["WAITLIST", "FRIENDS_FAMILY"]);
    expect(parsed.promoCode).toBe("FUNDADOR30");
  });

  it("treats an empty promo code as none", () => {
    expect(createCampaignSchema.parse({ ...valid, promoCode: "  " }).promoCode).toBeNull();
  });

  it.each([
    ["locale", { locale: "pt" }],
    ["empty segments", { segmentSources: [] }],
    ["unknown segment", { segmentSources: ["USERS"] }],
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
