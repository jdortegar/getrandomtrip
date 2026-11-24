// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { refreshSourceMessage } from "../refreshSocialMessage";

const { getSourcePreview, find, lock, transaction } = vi.hoisted(() => {
  let tail = Promise.resolve();
  const releases = new Map<unknown, () => void>();
  return {
    lock: vi.fn(async (tx: unknown) => {
      const previous = tail;
      tail = new Promise<void>((resolve) => releases.set(tx, resolve));
      await previous;
    }),
    transaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => {
      const tx = { socialSource: { findUnique: find } };
      try {
        return await work(tx);
      } finally {
        releases.get(tx)?.();
        releases.delete(tx);
      }
    }),
    find: vi.fn(),
    getSourcePreview: vi.fn(),
  };
});
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: transaction },
}));
vi.mock("@/lib/db/socialApprovals", () => ({ lockSocialApproval: lock }));
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

    find.mockResolvedValue({
      id: "source",
      igMediaId: "media",
      caption: "Original",
      permalink: "https://www.instagram.com/p/example/",
      mediaType: "IMAGE",
      status,
      messageTs: "123.456",
    });
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

it.each([
  { status: "TRANSLATION_QUEUED", messageTs: "1.1" },
  { status: "SYNCED", messageTs: "1.1" },
  { status: "ANNOUNCED", messageTs: "2.2" },
])(
  "skips repair if source changes during preview: $status / $messageTs",
  async (current) => {
    const stale = {
      id: "source",
      igMediaId: "media",
      caption: "old",
      permalink: "https://www.instagram.com/p/example/",
      mediaType: "IMAGE",
      status: "ANNOUNCED",
      messageTs: "1.1",
    };
    let finish!: (url: string) => void;
    getSourcePreview.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
    );
    find.mockClear();
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const repair = refreshSourceMessage(stale, "ANNOUNCED", undefined, {
      onlyIfAnnounced: true,
    });
    expect(find).not.toHaveBeenCalled();
    find.mockResolvedValue({ ...stale, ...current });
    finish("https://cdn.test/preview.png");
    await repair;
    expect(find).toHaveBeenCalledWith({ where: { id: "source" } });
    expect(fetcher).not.toHaveBeenCalled();
  },
);

it("orders overlapping Slack writes and re-reads state for the waiting writer", async () => {
  const source = {
    id: "source",
    igMediaId: "media",
    caption: "original",
    permalink: "https://example.test/post",
    mediaType: "IMAGE",
    status: "ANNOUNCED",
    messageTs: "1.1",
  };
  let current = source;
  find.mockImplementation(async () => current);
  lock.mockClear();
  transaction.mockClear();
  getSourcePreview.mockResolvedValue(null);
  let finish!: (response: Response) => void;
  const fetcher = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetcher);
  const repair = refreshSourceMessage(source, "ANNOUNCED", undefined, {
    onlyIfAnnounced: true,
  });
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  current = { ...source, status: "SYNCED" };
  const newer = refreshSourceMessage(source, "TRANSLATION_QUEUED");
  await vi.waitFor(() => expect(transaction).toHaveBeenCalledTimes(2));
  expect(fetcher).toHaveBeenCalledTimes(1);
  finish(Response.json({ ok: true }));
  await Promise.all([repair, newer]);
  expect(lock).toHaveBeenCalledTimes(2);
  expect(lock).toHaveBeenLastCalledWith(
    expect.anything(),
    "source-card:source",
  );
  expect(transaction).toHaveBeenLastCalledWith(expect.any(Function), {
    maxWait: 5000,
    timeout: 15000,
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  const latest = JSON.parse(fetcher.mock.calls[1][1].body);
  expect(JSON.stringify(latest)).toContain("Marked as posted manually");
  expect(
    latest.blocks.some((block: { type: string }) => block.type === "actions"),
  ).toBe(false);
});
