import { describe, expect, it } from "vitest";
import { buildTripDocumentKey } from "../tripDocumentStore";

describe("buildTripDocumentKey", () => {
  it("shapes the key as {tripRequestId}/{randomUUID} — no userId, no filename, no extension", () => {
    const key = buildTripDocumentKey("trip-123");
    const parts = key.split("/");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBe("trip-123");
    // UUID v4 shape, no filename/extension leakage
    expect(parts[1]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("produces a different key on each call", () => {
    const a = buildTripDocumentKey("trip-123");
    const b = buildTripDocumentKey("trip-123");
    expect(a).not.toBe(b);
  });

  it("never embeds a user id or original filename", () => {
    const key = buildTripDocumentKey("trip-abc");
    expect(key).not.toContain("user-");
    expect(key).not.toContain(".pdf");
    expect(key).not.toContain(".jpg");
    expect(key).not.toContain(".png");
  });
});
