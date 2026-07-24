import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  issueVerificationToken,
  consumeVerificationToken,
} from "../verificationTokens";

describe("issueVerificationToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (ops: unknown[]) => Promise.all(ops),
    );
    (
      prisma.verificationToken.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 1 });
    (
      prisma.verificationToken.create as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "tok-1" });
  });

  it("deletes prior unconsumed same-type tokens then creates one row (EMAIL_VERIFY, 24h expiry), returning the plaintext", async () => {
    const beforeMs = Date.now();
    const plaintext = await issueVerificationToken("user-1", "EMAIL_VERIFY");
    const afterMs = Date.now();

    expect(typeof plaintext).toBe("string");
    expect(plaintext.length).toBeGreaterThanOrEqual(64);

    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "EMAIL_VERIFY", consumedAt: null },
    });
    expect(prisma.verificationToken.create).toHaveBeenCalledTimes(1);
    const createArgs = (
      prisma.verificationToken.create as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(createArgs.data.userId).toBe("user-1");
    expect(createArgs.data.type).toBe("EMAIL_VERIFY");
    expect(typeof createArgs.data.tokenHash).toBe("string");
    // The persisted value must be a hash, never the plaintext itself.
    expect(createArgs.data.tokenHash).not.toBe(plaintext);
    const expiresAtMs = (createArgs.data.expiresAt as Date).getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(
      beforeMs + 24 * 60 * 60 * 1000 - 1000,
    );
    expect(expiresAtMs).toBeLessThanOrEqual(
      afterMs + 24 * 60 * 60 * 1000 + 1000,
    );
  });

  it("uses a 1h expiry for PASSWORD_RESET tokens and scopes the delete to that type", async () => {
    const beforeMs = Date.now();
    await issueVerificationToken("user-1", "PASSWORD_RESET");
    const afterMs = Date.now();

    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "PASSWORD_RESET", consumedAt: null },
    });
    const createArgs = (
      prisma.verificationToken.create as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(createArgs.data.type).toBe("PASSWORD_RESET");
    const expiresAtMs = (createArgs.data.expiresAt as Date).getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(
      beforeMs + 60 * 60 * 1000 - 1000,
    );
    expect(expiresAtMs).toBeLessThanOrEqual(afterMs + 60 * 60 * 1000 + 1000);
  });
});

describe("consumeVerificationToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for an unknown token hash", async () => {
    (
      prisma.verificationToken.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await consumeVerificationToken("nope", "EMAIL_VERIFY");

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("returns invalid on type mismatch", async () => {
    (
      prisma.verificationToken.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      userId: "user-1",
      type: "PASSWORD_RESET",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await consumeVerificationToken("tok", "EMAIL_VERIFY");

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("returns used for an already-consumed token", async () => {
    (
      prisma.verificationToken.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      userId: "user-1",
      type: "EMAIL_VERIFY",
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await consumeVerificationToken("tok", "EMAIL_VERIFY");

    expect(result).toEqual({ ok: false, reason: "used" });
  });

  it("returns expired for a token past expiresAt", async () => {
    (
      prisma.verificationToken.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      userId: "user-1",
      type: "EMAIL_VERIFY",
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await consumeVerificationToken("tok", "EMAIL_VERIFY");

    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(prisma.verificationToken.update).not.toHaveBeenCalled();
  });

  it("marks a valid token consumed and returns ok + userId", async () => {
    (
      prisma.verificationToken.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      userId: "user-1",
      type: "EMAIL_VERIFY",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    (
      prisma.verificationToken.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    const result = await consumeVerificationToken("tok", "EMAIL_VERIFY");

    expect(result).toEqual({ ok: true, userId: "user-1" });
    expect(prisma.verificationToken.update).toHaveBeenCalledWith({
      where: { id: "row-1" },
      data: { consumedAt: expect.any(Date) },
    });
  });
});
