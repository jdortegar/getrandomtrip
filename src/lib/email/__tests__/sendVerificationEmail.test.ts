import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { db, sendMailMock } = vi.hoisted(() => ({
  db: { user: { findUnique: vi.fn() } },
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: sendMailMock }));

import {
  deliverVerificationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccessInviteEmail,
} from "../index";

beforeEach(() => {
  vi.resetAllMocks();
  db.user.findUnique.mockResolvedValue({
    email: "jane@example.com",
    name: "Jane",
    locale: "en",
  });
  sendMailMock.mockResolvedValue({ id: "mail" });
});

async function sentHtml() {
  await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(1));
  return renderToStaticMarkup(
    sendMailMock.mock.calls[0][0].content.react,
  ).replace(/&amp;/g, "&");
}

describe("sendVerificationEmail return path (T12)", () => {
  it("links to the plain verify page by default", async () => {
    sendVerificationEmail("user-1", "tok");
    const html = await sentHtml();
    expect(html).toContain("/en/verify-email?token=tok");
    expect(html).not.toContain("next=");
  });

  it("carries a validated invite return path so verifying brings the companion back", async () => {
    sendVerificationEmail("user-1", "tok", "/en/invite/abc123");
    const html = await sentHtml();
    expect(html).toContain(
      "/en/verify-email?token=tok&next=%2Fen%2Finvite%2Fabc123",
    );
  });

  it("drops an unsafe return path instead of embedding it", async () => {
    sendVerificationEmail("user-1", "tok", "https://evil.example.com");
    const html = await sentHtml();
    expect(html).not.toContain("next=");
    expect(html).not.toContain("evil");
  });
});

describe("deliverVerificationEmail (awaitable)", () => {
  it("resolves after sending and includes a valid return path", async () => {
    await deliverVerificationEmail("user-1", "tok", "/en/invite/abc123");
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const html = renderToStaticMarkup(
      sendMailMock.mock.calls[0][0].content.react,
    ).replace(/&amp;/g, "&");
    expect(html).toContain(
      "/en/verify-email?token=tok&next=%2Fen%2Finvite%2Fabc123",
    );
  });

  it("throws when the mail provider fails", async () => {
    sendMailMock.mockRejectedValue(new Error("smtp down"));
    await expect(deliverVerificationEmail("user-1", "tok")).rejects.toThrow(
      "smtp down",
    );
  });

  it("returns without sending when the user has no email", async () => {
    db.user.findUnique.mockResolvedValue({
      email: null,
      name: "J",
      locale: "en",
    });
    await expect(
      deliverVerificationEmail("user-1", "tok"),
    ).resolves.toBeUndefined();
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe("sendVerificationEmail failure handling", () => {
  it("swallows and logs provider failures", async () => {
    sendMailMock.mockRejectedValue(new Error("smtp down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => sendVerificationEmail("user-1", "tok")).not.toThrow();
    await vi.waitFor(() => expect(errSpy).toHaveBeenCalled());
  });
});

afterEach(() => vi.unstubAllEnvs());

describe("environment-bound account action links", () => {
  it.each(["develop", "deploy-preview-304"])(
    "keeps account tokens on %s",
    async (alias) => {
      const origin = `https://${alias}--getrandomtrip-1.netlify.app`;
      vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
      vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", "getrandomtrip-1");
      vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", origin);
      await deliverVerificationEmail("user-1", "tok", "/en/invite/abc123");
      expect(sendMailMock.mock.calls[0][0].content.react.props.verifyUrl).toBe(
        `${origin}/en/verify-email?token=tok&next=%2Fen%2Finvite%2Fabc123`,
      );
      sendMailMock.mockClear();
      sendPasswordResetEmail("user-1", "reset");
      await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(1));
      expect(sendMailMock.mock.calls[0][0].content.react.props.resetUrl).toBe(
        `${origin}/en/reset-password?token=reset`,
      );
      sendMailMock.mockClear();
      sendAccessInviteEmail("invitee@example.test", "invite", "es", "TRIPPER");
      await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(1));
      expect(sendMailMock.mock.calls[0][0].content.react.props.inviteUrl).toBe(
        `${origin}/es/tripper-invite?token=invite`,
      );
    },
  );

  it("does not send a verification token when deployment metadata is missing", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", undefined);
    await expect(deliverVerificationEmail("user-1", "secret")).rejects.toThrow(
      "trusted nonproduction",
    );
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
