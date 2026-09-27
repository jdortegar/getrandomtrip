import { describe, expect, it } from "vitest";
import { analyticsPage, sanitizeEvent } from "../privacy";

describe("analytics privacy boundary", () => {
  it("normalizes public slugs and removes all query/hash values", () => {
    expect(analyticsPage("/en/blog/secret?token=private#email")).toEqual({
      page_path: "/en/blog/article",
      page_location: "https://getrandomtrip.com/en/blog/article",
      page_referrer: "",
      page_title: "Blog article",
      language: "en",
      purchaseOnly: false,
    });
  });
  it.each([
    "/login",
    "/reset-password?token=secret",
    "/en/invite/path-token",
    "/dashboard/tripper",
    "/trips/private",
    "/review/token",
    "/verify-email",
    "/unrecognized/value",
  ])("does not measure %s", (path) => expect(analyticsPage(path)).toBeNull());
  it("marks checkout success as purchase-only with no query", () => {
    expect(
      analyticsPage("/checkout/success?payment_intent_client_secret=secret"),
    ).toMatchObject({ page_path: "/checkout/success", purchaseOnly: true });
  });
  it("strips arbitrary parameters and rejects unapproved event names/values", () => {
    expect(
      sanitizeEvent({
        event: "login",
        method: "google",
        email: "private",
        user_id: "id",
      }),
    ).toEqual({ event: "login", method: "google" });
    expect(sanitizeEvent({ event: "login", method: "token" })).toBeNull();
    expect(
      sanitizeEvent({ event: "click_button", label: "secret" }),
    ).toBeNull();
    expect(
      sanitizeEvent({
        event: "generate_lead",
        trip_type: "solo",
        origin: "private",
      }),
    ).toEqual({ event: "generate_lead", trip_type: "solo" });
    expect(
      sanitizeEvent({
        event: "purchase",
        transaction_id: "pi_Abc123",
        value: 123.45,
        currency: "USD",
        items: [{ name: "private" }],
      }),
    ).toEqual({
      event: "purchase",
      transaction_id: "pi_Abc123",
      value: 123.45,
      currency: "USD",
    });
    expect(
      sanitizeEvent({
        event: "purchase",
        transaction_id: "private@email",
        value: 1,
        currency: "USD",
      }),
    ).toBeNull();
  });
});
