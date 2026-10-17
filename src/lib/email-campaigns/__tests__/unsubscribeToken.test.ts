// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildUnsubscribeHeaders,
  buildUnsubscribeUrl,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../unsubscribeToken";
import { SITE_URL } from "@/lib/seo/urls";

beforeEach(() => {
  vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "test-unsubscribe-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("unsubscribe token", () => {
  it("round-trips a contact id", () => {
    const token = createUnsubscribeToken("ckcontact123");

    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(verifyUnsubscribeToken(token)).toBe("ckcontact123");
  });

  it("rejects a token whose payload was swapped for another contact", () => {
    const [, signature] = createUnsubscribeToken("ckcontact123").split(".");
    const forgedPayload = Buffer.from("ckvictim456").toString("base64url");

    expect(verifyUnsubscribeToken(`${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a tampered signature, malformed tokens and other secrets", () => {
    const token = createUnsubscribeToken("ckcontact123");
    const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;

    expect(verifyUnsubscribeToken(tampered)).toBeNull();
    expect(verifyUnsubscribeToken("")).toBeNull();
    expect(verifyUnsubscribeToken("no-dot")).toBeNull();
    expect(verifyUnsubscribeToken(`${token}.extra`)).toBeNull();

    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "another-secret");
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it("throws on create and returns null on verify without a secret", () => {
    const token = createUnsubscribeToken("ckcontact123");
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "");

    expect(() => createUnsubscribeToken("ckcontact123")).toThrow(
      "EMAIL_UNSUBSCRIBE_SECRET",
    );
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });
});

describe("unsubscribe links", () => {
  it("builds the localized page URL carrying a verifiable token", () => {
    const es = new URL(buildUnsubscribeUrl("ckcontact123", "es"));
    const en = new URL(buildUnsubscribeUrl("ckcontact123", "en"));

    expect(`${es.origin}${es.pathname}`).toBe(`${SITE_URL}/unsubscribe`);
    expect(`${en.origin}${en.pathname}`).toBe(`${SITE_URL}/en/unsubscribe`);
    expect(verifyUnsubscribeToken(es.searchParams.get("token")!)).toBe(
      "ckcontact123",
    );
  });

  it("builds RFC 8058 one-click headers pointing at the API endpoint", () => {
    const headers = buildUnsubscribeHeaders("ckcontact123");
    const match = /^<(.+)>$/.exec(headers["List-Unsubscribe"]);
    const url = new URL(match![1]);

    expect(`${url.origin}${url.pathname}`).toBe(
      `${SITE_URL}/api/email/unsubscribe`,
    );
    expect(verifyUnsubscribeToken(url.searchParams.get("token")!)).toBe(
      "ckcontact123",
    );
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});
