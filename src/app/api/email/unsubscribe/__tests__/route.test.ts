// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email-campaigns/contacts", () => ({
  unsubscribeContact: vi.fn(),
}));
vi.mock("@/lib/email-campaigns/unsubscribeToken", () => ({
  verifyUnsubscribeToken: vi.fn((token: string) =>
    token === "valid-token" ? "c1" : null,
  ),
}));

import { unsubscribeContact } from "@/lib/email-campaigns/contacts";
import { POST } from "../route";

const ENDPOINT = "http://localhost/api/email/unsubscribe";
const mockedUnsubscribe = vi.mocked(unsubscribeContact);

beforeEach(() => {
  mockedUnsubscribe.mockReset();
  mockedUnsubscribe.mockResolvedValue("unsubscribed");
});

describe("POST /api/email/unsubscribe", () => {
  it("handles an RFC 8058 one-click form POST with the token in the query", async () => {
    const res = await POST(
      new Request(`${ENDPOINT}?token=valid-token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockedUnsubscribe).toHaveBeenCalledWith("c1");
  });

  it("accepts the token from a JSON body", async () => {
    const res = await POST(
      new Request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "valid-token" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockedUnsubscribe).toHaveBeenCalledWith("c1");
  });

  it("returns 200 when the contact was already unsubscribed", async () => {
    mockedUnsubscribe.mockResolvedValue("unchanged");

    const res = await POST(
      new Request(`${ENDPOINT}?token=valid-token`, { method: "POST" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 400 for an invalid, missing or malformed token", async () => {
    const invalid = await POST(
      new Request(`${ENDPOINT}?token=forged`, { method: "POST" }),
    );
    const missing = await POST(
      new Request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    const malformed = await POST(
      new Request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }),
    );

    for (const res of [invalid, missing, malformed]) {
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: "invalid_token" });
    }
    expect(mockedUnsubscribe).not.toHaveBeenCalled();
  });

  it("exposes no GET handler", async () => {
    const mod = await import("../route");
    expect("GET" in mod).toBe(false);
  });
});
