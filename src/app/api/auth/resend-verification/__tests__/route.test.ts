import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    verificationToken: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/auth/verificationTokens", () => ({
  issueVerificationToken: vi.fn().mockResolvedValue("plaintext-token"),
}));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: vi.fn() }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import { sendVerificationEmail } from "@/lib/email";

type RouteModule = typeof import("../route");

const NOW = new Date("2026-10-01T12:00:00.000Z");

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const mocked = <T extends (...args: never[]) => unknown>(fn: T) =>
  fn as unknown as ReturnType<typeof vi.fn>;

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mocked(getServerSession).mockResolvedValue({ user: { id: "u1" } });
    mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      emailVerified: null,
    });
    mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);
  });
  afterEach(() => vi.useRealTimers());

  it("401s without a session and sends nothing", async () => {
    mocked(getServerSession).mockResolvedValue(null);
    const { POST } = (await import("../route")) as RouteModule;
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
    expect(issueVerificationToken).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("401s when the session user no longer exists", async () => {
    mocked(prisma.user.findUnique).mockResolvedValue(null);
    const { POST } = (await import("../route")) as RouteModule;
    expect((await POST(makeRequest({}))).status).toBe(401);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("409s already_verified for a verified account and sends nothing", async () => {
    mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      emailVerified: new Date(),
    });
    const { POST } = (await import("../route")) as RouteModule;
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "already_verified" });
    expect(issueVerificationToken).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("issues a fresh token and emails the session user (no return path)", async () => {
    const { POST } = (await import("../route")) as RouteModule;
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(issueVerificationToken).toHaveBeenCalledWith("u1", "EMAIL_VERIFY");
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "u1",
      "plaintext-token",
      undefined,
    );
  });

  it("tolerates a request with no body", async () => {
    const { POST } = (await import("../route")) as RouteModule;
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "u1",
      "plaintext-token",
      undefined,
    );
  });

  it("forwards a valid invite return path", async () => {
    const { POST } = (await import("../route")) as RouteModule;
    await POST(makeRequest({ returnPath: "/en/invite/abc_123-XYZ" }));
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "u1",
      "plaintext-token",
      "/en/invite/abc_123-XYZ",
    );
  });

  it.each([
    "https://evil.example/en/invite/abc",
    "//evil.example",
    "/en/invite/abc?next=https://evil.example",
    "/en/dashboard",
    42,
    null,
  ])("ignores an invalid return path (%s) but still sends", async (bad) => {
    const { POST } = (await import("../route")) as RouteModule;
    const res = await POST(makeRequest({ returnPath: bad }));
    expect(res.status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "u1",
      "plaintext-token",
      undefined,
    );
  });

  it("429s with the remaining seconds inside the 60s cooldown and sends nothing", async () => {
    mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      createdAt: new Date(NOW.getTime() - 45_000),
    });
    const { POST } = (await import("../route")) as RouteModule;
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: "cooldown",
      retryAfterSeconds: 15,
    });
    expect(res.headers.get("Retry-After")).toBe("15");
    expect(issueVerificationToken).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("allows a resend once the cooldown has elapsed", async () => {
    mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      createdAt: new Date(NOW.getTime() - 61_000),
    });
    const { POST } = (await import("../route")) as RouteModule;
    expect((await POST(makeRequest({}))).status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("looks up the cooldown on the latest EMAIL_VERIFY token of the session user only", async () => {
    const { POST } = (await import("../route")) as RouteModule;
    await POST(makeRequest({}));
    expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
      where: { userId: "u1", type: "EMAIL_VERIFY" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
  });

  it("500s with a stable code when issuing fails", async () => {
    mocked(issueVerificationToken).mockRejectedValueOnce(new Error("db"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = (await import("../route")) as RouteModule;
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal_error" });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});
