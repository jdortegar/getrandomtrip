import { describe, it, expect, beforeEach, vi } from "vitest";
import { GRT_TRIPPER_COOKIE } from "@/lib/tripper/attribution";

const TRUSTED_ORIGIN = "http://localhost:3010";

function makePostRequest(
  body: unknown,
  headers: Record<string, string> = { Origin: TRUSTED_ORIGIN },
) {
  const request = new Request("http://localhost/api/attribution/mode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // `Origin`/`Referer` are forbidden request-header names per the Fetch
  // spec — happy-dom's `Request` constructor silently drops them when
  // passed via the `headers` init option (as a real browser would for an
  // outgoing `fetch()`). Setting them directly on `.headers` after
  // construction bypasses that, letting the test simulate what an actual
  // incoming HTTP request looks like server-side (where these headers are
  // attacker-uncontrollable and always present as sent by the browser).
  for (const [key, value] of Object.entries(headers)) {
    request.headers.set(key, value);
  }
  return request;
}

describe("POST /api/attribution/mode", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-mode-route");
    vi.stubEnv("NEXTAUTH_URL", TRUSTED_ORIGIN);
  });

  it("returns 400 INVALID_MODE for an unrecognized mode value", async () => {
    const { POST } = await import("../route");
    const res = await POST(makePostRequest({ mode: "bogus" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "INVALID_MODE" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("mode: randomtrip clears the grt_tripper cookie only (never touches referredByTripperId — no prisma import exists in this route)", async () => {
    const { POST } = await import("../route");
    const res = await POST(makePostRequest({ mode: "randomtrip" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, mode: "randomtrip" });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${GRT_TRIPPER_COOKIE}=;`);
    expect(setCookie.toLowerCase()).toContain("1970");
  });

  it("mode: tripper without a slug returns 400 MISSING_SLUG and sets no cookie", async () => {
    const { POST } = await import("../route");
    const res = await POST(makePostRequest({ mode: "tripper" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "MISSING_SLUG" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("mode: tripper with a slug signs and sets a fresh grt_tripper cookie", async () => {
    const { POST } = await import("../route");
    const res = await POST(makePostRequest({ mode: "tripper", slug: "maria" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, mode: "tripper" });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${GRT_TRIPPER_COOKIE}=v1.maria.`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
  });
});

describe("POST /api/attribution/mode — origin/CSRF guard (finding #5)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-mode-route");
    vi.stubEnv("NEXTAUTH_URL", TRUSTED_ORIGIN);
  });

  it("rejects a request with a mismatched Origin header — no cookie is set", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      makePostRequest(
        { mode: "tripper", slug: "maria" },
        { Origin: "http://evil.example.com" },
      ),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "FORBIDDEN" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a request with no Origin and no Referer header at all", async () => {
    const { POST } = await import("../route");
    const res = await POST(makePostRequest({ mode: "tripper", slug: "maria" }, {}));

    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("falls back to a matching Referer header when Origin is absent", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      makePostRequest(
        { mode: "tripper", slug: "maria" },
        { Referer: `${TRUSTED_ORIGIN}/some/page` },
      ),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(
      `${GRT_TRIPPER_COOKIE}=v1.maria.`,
    );
  });

  it("accepts a request with a matching Origin header (regression: the happy path from the tests above)", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      makePostRequest({ mode: "tripper", slug: "maria" }),
    );

    expect(res.status).toBe(200);
  });
});
