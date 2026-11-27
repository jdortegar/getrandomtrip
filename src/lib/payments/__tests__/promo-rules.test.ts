import { describe, expect, it } from "vitest";
import {
  evaluatePromoRules,
  promoErrorCode,
  promoMetadataRules,
  promoReasonFromErrorCode,
  type PromoRuleInput,
} from "../promo-rules";

const NOW = Date.UTC(2026, 9, 17) / 1000;

function input(overrides: Partial<PromoRuleInput> = {}): PromoRuleInput {
  return {
    amountCents: 20000,
    tripOriginCountry: "AR",
    codeRedemptions: 0,
    coupon: { redeem_by: null },
    currency: "usd",
    nowSeconds: NOW,
    promotion: {
      expires_at: null,
      max_redemptions: null,
      metadata: { allowedCountries: null, reusable: false },
      restrictions: {
        first_time_transaction: false,
        minimum_amount: null,
        minimum_amount_currency: null,
      },
    },
    userCodeUses: 0,
    userSettledPayments: 0,
    ...overrides,
  };
}

function promotion(
  overrides: Partial<PromoRuleInput["promotion"]> = {},
  restrictions: Partial<PromoRuleInput["promotion"]["restrictions"]> = {},
): PromoRuleInput["promotion"] {
  const base = input().promotion;
  return {
    ...base,
    ...overrides,
    restrictions: { ...base.restrictions, ...restrictions },
  };
}

describe("evaluatePromoRules", () => {
  it("accepts a code without restrictions", () => {
    expect(evaluatePromoRules(input())).toEqual({ ok: true });
  });

  it("rejects an expired promotion code", () => {
    expect(
      evaluatePromoRules(input({ promotion: promotion({ expires_at: NOW - 1 }) })),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a coupon whose redeem_by date has passed", () => {
    expect(
      evaluatePromoRules(input({ coupon: { redeem_by: NOW - 60 } })),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("accepts a code that expires in the future", () => {
    expect(
      evaluatePromoRules(
        input({
          coupon: { redeem_by: NOW + 60 },
          promotion: promotion({ expires_at: NOW + 60 }),
        }),
      ),
    ).toEqual({ ok: true });
  });

  it("rejects once settled redemptions reach max_redemptions", () => {
    expect(
      evaluatePromoRules(
        input({ codeRedemptions: 3, promotion: promotion({ max_redemptions: 3 }) }),
      ),
    ).toEqual({ ok: false, reason: "max_redemptions_reached" });
  });

  it("accepts while settled redemptions are below max_redemptions", () => {
    expect(
      evaluatePromoRules(
        input({ codeRedemptions: 2, promotion: promotion({ max_redemptions: 3 }) }),
      ),
    ).toEqual({ ok: true });
  });

  it("rejects a code the buyer already used on another settled payment", () => {
    expect(evaluatePromoRules(input({ userCodeUses: 1 }))).toEqual({
      ok: false,
      reason: "already_used",
    });
  });

  it("rejects first-time-only codes for buyers with a settled payment", () => {
    expect(
      evaluatePromoRules(
        input({
          promotion: promotion({}, { first_time_transaction: true }),
          userSettledPayments: 1,
        }),
      ),
    ).toEqual({ ok: false, reason: "first_time_only" });
  });

  it("accepts first-time-only codes for buyers without settled payments", () => {
    expect(
      evaluatePromoRules(
        input({ promotion: promotion({}, { first_time_transaction: true }) }),
      ),
    ).toEqual({ ok: true });
  });

  it("rejects a pre-discount amount below the minimum in the checkout currency", () => {
    expect(
      evaluatePromoRules(
        input({
          amountCents: 9999,
          promotion: promotion(
            {},
            { minimum_amount: 10000, minimum_amount_currency: "usd" },
          ),
        }),
      ),
    ).toEqual({ ok: false, reason: "minimum_amount" });
  });

  it("accepts a pre-discount amount equal to the minimum", () => {
    expect(
      evaluatePromoRules(
        input({
          amountCents: 10000,
          promotion: promotion(
            {},
            { minimum_amount: 10000, minimum_amount_currency: "USD" },
          ),
        }),
      ),
    ).toEqual({ ok: true });
  });

  it("uses the checkout currency option when the minimum is in another currency", () => {
    const restricted = promotion(
      {},
      {
        currency_options: { usd: { minimum_amount: 5000 } },
        minimum_amount: 900000,
        minimum_amount_currency: "ars",
      },
    );
    expect(
      evaluatePromoRules(input({ amountCents: 6000, promotion: restricted })),
    ).toEqual({ ok: true });
    expect(
      evaluatePromoRules(input({ amountCents: 4000, promotion: restricted })),
    ).toEqual({ ok: false, reason: "minimum_amount" });
  });

  it("fails closed when the minimum has no option in the checkout currency", () => {
    expect(
      evaluatePromoRules(
        input({
          promotion: promotion(
            {},
            { minimum_amount: 100, minimum_amount_currency: "eur" },
          ),
        }),
      ),
    ).toEqual({ ok: false, reason: "minimum_amount" });
  });

  it("reports expiry before usage-based reasons", () => {
    expect(
      evaluatePromoRules(
        input({
          codeRedemptions: 9,
          promotion: promotion({ expires_at: NOW - 1, max_redemptions: 1 }),
          userCodeUses: 1,
        }),
      ),
    ).toEqual({ ok: false, reason: "expired" });
  });
});

describe("promo error codes", () => {
  it("round-trips every reason through its API error code", () => {
    for (const reason of [
      "expired",
      "max_redemptions_reached",
      "already_used",
      "first_time_only",
      "minimum_amount",
    ] as const) {
      expect(promoReasonFromErrorCode(promoErrorCode(reason))).toBe(reason);
    }
  });

  it("ignores unrelated error codes", () => {
    expect(promoReasonFromErrorCode("INVALID_TRIP_DATES")).toBeNull();
    expect(promoReasonFromErrorCode(null)).toBeNull();
  });
});

describe("promo metadata rules", () => {
  const argentinaOnly = { allowedCountries: ["AR"], reusable: true };

  it("parses allowed_countries and reusable from Stripe metadata", () => {
    expect(promoMetadataRules({ allowed_countries: " ar, uy ,x", reusable: "TRUE" })).toEqual({
      allowedCountries: ["AR", "UY"],
      reusable: true,
    });
    expect(promoMetadataRules({})).toEqual({ allowedCountries: null, reusable: false });
    expect(promoMetadataRules(null)).toEqual({ allowedCountries: null, reusable: false });
  });

  it("accepts a trip departing from an allowed country", () => {
    expect(
      evaluatePromoRules(input({ promotion: promotion({ metadata: argentinaOnly }) })),
    ).toEqual({ ok: true });
  });

  it("rejects a trip departing from another country", () => {
    expect(
      evaluatePromoRules(
        input({ tripOriginCountry: "US", promotion: promotion({ metadata: argentinaOnly }) }),
      ),
    ).toEqual({ ok: false, reason: "country_not_allowed" });
  });

  it("rejects when the trip origin country is unknown", () => {
    expect(
      evaluatePromoRules(
        input({ tripOriginCountry: null, promotion: promotion({ metadata: argentinaOnly }) }),
      ),
    ).toEqual({ ok: false, reason: "country_not_allowed" });
  });

  it("lets a reusable code be used again by the same buyer", () => {
    expect(
      evaluatePromoRules(
        input({ userCodeUses: 3, promotion: promotion({ metadata: argentinaOnly }) }),
      ),
    ).toEqual({ ok: true });
  });

  it("still rejects reuse of a non-reusable code", () => {
    expect(evaluatePromoRules(input({ userCodeUses: 1 }))).toEqual({
      ok: false,
      reason: "already_used",
    });
  });

  it("maps the country reason to an error code and back", () => {
    expect(promoErrorCode("country_not_allowed")).toBe("PROMO_COUNTRY_NOT_ALLOWED");
    expect(promoReasonFromErrorCode("PROMO_COUNTRY_NOT_ALLOWED")).toBe("country_not_allowed");
  });
});
