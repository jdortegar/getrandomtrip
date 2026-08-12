import { describe, expect, it } from "vitest";
import {
  FULFILLMENT_VISIBLE_STATUSES,
  isFulfillmentVisible,
} from "../fulfillmentVisibility";

const ALL_STATUSES = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
  "CANCELLED",
];

const NON_ADMIN_VISIBLE = new Set(["REVEALED", "COMPLETED", "CANCELLED"]);

describe("isFulfillmentVisible", () => {
  it("named guard: FULFILLMENT_VISIBLE_STATUSES has exactly 3 members and includes CANCELLED", () => {
    expect(FULFILLMENT_VISIBLE_STATUSES.size).toBe(3);
    expect(FULFILLMENT_VISIBLE_STATUSES.has("CANCELLED")).toBe(true);
    expect(FULFILLMENT_VISIBLE_STATUSES.has("REVEALED")).toBe(true);
    expect(FULFILLMENT_VISIBLE_STATUSES.has("COMPLETED")).toBe(true);
  });

  it.each(ALL_STATUSES)("non-admin, status=%s", (status) => {
    expect(isFulfillmentVisible(status, false)).toBe(NON_ADMIN_VISIBLE.has(status));
  });

  it.each(ALL_STATUSES)("admin is exempt from the gate, status=%s", (status) => {
    expect(isFulfillmentVisible(status, true)).toBe(true);
  });
});
