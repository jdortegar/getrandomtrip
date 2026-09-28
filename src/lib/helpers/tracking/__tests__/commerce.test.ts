import { describe, expect, it } from "vitest";
import { analyticsPage, sanitizeEvent } from "../privacy";

const item = { item_id: "trip-solo", quantity: 1, price: 250 };
const money = { value: 250, currency: "USD", items: [item] };

describe("commerce privacy contract", () => {
  it("allows exact checkout as commerce-only, without identifiers", () => {
    expect(analyticsPage("/en/checkout?tripId=private")).toMatchObject({
      page_path: "/en/checkout",
      commerceOnly: true,
      purchaseOnly: false,
    });
    for (const path of [
      "/checkout/private",
      "/checkout/pending",
      "/checkout/failure",
      "/dashboard/checkout",
    ])
      expect(analyticsPage(path)).toBeNull();
  });

  it.each(["begin_checkout", "add_payment_info", "purchase"])(
    "sanitizes %s with bounded catalog items",
    (event) => {
      const safe = sanitizeEvent({
        event,
        ...money,
        transaction_id: "pi_123",
        payment_type: "stripe",
        email: "private",
        items: [
          {
            ...item,
            item_name: "private",
            item_category: "private",
            traveler: "private",
          },
        ],
      });
      expect(safe).toMatchObject({
        event,
        ...money,
        items: [
          {
            item_id: "trip-solo",
            item_name: "Solo trip",
            item_category: "solo",
            quantity: 1,
            price: 250,
          },
        ],
      });
      expect(JSON.stringify(safe)).not.toContain("private");
    },
  );

  it.each(["view_item", "select_item"])(
    "allows %s without fabricated prices",
    (event) => {
      expect(
        sanitizeEvent({ event, items: [{ ...item, email: "private" }] }),
      ).toEqual({
        event,
        items: [
          {
            item_id: "trip-solo",
            item_name: "Solo trip",
            item_category: "solo",
            quantity: 1,
          },
        ],
      });
    },
  );

  it.each([
    { value: -1 },
    { value: Infinity },
    { value: NaN },
    { value: 1e15 },
    { currency: "usd" },
    { currency: "XXX" },
    { items: [] },
    { items: [{ ...item, item_id: "private@example.com" }] },
    { items: [{ ...item, quantity: -1 }] },
    { items: [{ ...item, quantity: 2 }] },
    { items: [{ ...item, price: 249 }] },
    { items: [item, item] },
  ])("rejects malformed commerce payload %j", (bad) => {
    expect(
      sanitizeEvent({ event: "begin_checkout", ...money, ...bad }),
    ).toBeNull();
  });

  it("requires money/items and safe payment metadata", () => {
    expect(
      sanitizeEvent({ event: "begin_checkout", trip_type: "solo" }),
    ).toBeNull();
    expect(
      sanitizeEvent({
        event: "purchase",
        transaction_id: "pi_123",
        value: 1,
        currency: "USD",
      }),
    ).toBeNull();
    expect(
      sanitizeEvent({
        event: "purchase",
        ...money,
        transaction_id: "email@example.com",
      }),
    ).toBeNull();
    expect(
      sanitizeEvent({
        event: "add_payment_info",
        ...money,
        payment_type: "4111111111111111",
      }),
    ).toBeNull();
    expect(sanitizeEvent({ event: "add_to_cart", ...money })).toBeNull();
  });
});
