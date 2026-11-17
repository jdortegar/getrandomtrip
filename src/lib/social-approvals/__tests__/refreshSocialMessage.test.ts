// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { refreshSourceMessage } from "../refreshSocialMessage";

const { getSourcePreview } = vi.hoisted(() => ({
  getSourcePreview: vi.fn(),
}));
vi.mock("../sourceMedia", () => ({ getSourcePreview }));
vi.mock("../socialAccounts", () => ({
  socialSourceConfig: () => ({ token: "instagram-token" }),
}));
vi.mock("../slackApproval", () => ({
  approvalConfig: () => ({ token: "slack-token", channel: "translations" }),
}));

afterEach(() => vi.unstubAllGlobals());

it.each(["TRANSLATION_QUEUED", "TRANSLATED"])(
  "keeps the Spanish artwork on the %s card",
  async (status) => {
    const previewUrl = "https://example.com/original.png";
    getSourcePreview.mockResolvedValue(previewUrl);
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);

    await refreshSourceMessage(
      {
        id: "source",
        igMediaId: "media",
        caption: "Original",
        permalink: "https://www.instagram.com/p/example/",
        mediaType: "IMAGE",
        status: "ANNOUNCED",
        messageTs: "123.456",
      },
      status,
    );

    expect(getSourcePreview).toHaveBeenCalledWith("instagram-token", "media");
    expect(JSON.parse(fetcher.mock.calls[0][1].body).blocks).toContainEqual({
      type: "image",
      image_url: previewUrl,
      alt_text: "Spanish post preview",
    });
  },
);
