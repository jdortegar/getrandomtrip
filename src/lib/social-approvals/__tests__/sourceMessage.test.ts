// @vitest-environment node
import { expect, it, vi } from "vitest";
import { sourceMessage } from "../sourceMessage";
import { shortcodeOf } from "../sourceMedia";

const source = {
  id: "src",
  caption: "Tres pasos. El destino, sorpresa.",
  permalink: "https://www.instagram.com/p/DXiYOKaFxwb/",
  mediaType: "CAROUSEL_ALBUM",
  status: "ANNOUNCED",
};
const buttons = (message: ReturnType<typeof sourceMessage>) =>
  message.blocks.filter((b) => b.type === "actions");

it("offers Translate this post only while the post is waiting", () => {
  const message = sourceMessage(source, "https://cdn.test/1.jpg");
  expect(JSON.stringify(buttons(message))).toContain('"Translate this post"');
  expect(JSON.stringify(buttons(message))).toContain('"value":"src"');
  expect(message.blocks.some((b) => b.type === "image")).toBe(true);
  expect(
    buttons(
      sourceMessage({ ...source, status: "TRANSLATION_QUEUED" }, null, "U1"),
    ),
  ).toHaveLength(0);
});
it("offers only Mark as posted manually for video posts", () => {
  const message = sourceMessage({
    ...source,
    mediaType: "VIDEO",
    status: "UNSUPPORTED",
  });
  const ids = JSON.stringify(buttons(message));
  expect(ids).not.toContain("social_translate");
  expect(ids).toContain('"action_id":"social_mark_posted"');
  expect(ids).toContain('"confirm"');
  expect(JSON.stringify(message.blocks)).toContain("Video posts");
});
it("shows the backlog when announcing and no buttons once mirrored", () => {
  expect(JSON.stringify(sourceMessage(source, null, null, 1).blocks)).toContain(
    "1 more Spanish post waiting after this one",
  );
  expect(JSON.stringify(sourceMessage(source, null, null, 0).blocks)).toContain(
    "latest Spanish post",
  );
  for (const status of ["SYNCED", "PUBLISHED", "TRANSLATION_QUEUED"])
    expect(buttons(sourceMessage({ ...source, status }))).toHaveLength(0);
});
it("reads shortcodes from post and reel permalinks", () => {
  expect(shortcodeOf(source.permalink)).toBe("DXiYOKaFxwb");
  expect(shortcodeOf("https://www.instagram.com/reel/Dbn0ubQNBT5/")).toBe(
    "Dbn0ubQNBT5",
  );
  expect(shortcodeOf("https://example.com/")).toBeNull();
});
it("pages through the whole Spanish feed and returns it oldest first", async () => {
  const { listSourceMedia } = await import("../sourceMedia");
  const row = (id: string, ts: string) => ({
    id,
    permalink: `https://www.instagram.com/p/${id}/`,
    timestamp: ts,
    media_type: "IMAGE",
  });
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        data: [
          row("C", "2026-04-03T00:00:00Z"),
          row("B", "2026-04-02T00:00:00Z"),
        ],
        paging: { cursors: { after: "cur" }, next: "https://graph/next" },
      }),
    )
    .mockResolvedValueOnce(
      Response.json({ data: [row("A", "2026-04-01T00:00:00Z")], paging: {} }),
    );
  vi.stubGlobal("fetch", fetchMock);
  const media = await listSourceMedia("tok", "ig");
  expect(media.map((m) => m.id)).toEqual(["A", "B", "C"]);
  expect(String(fetchMock.mock.calls[1][0])).toContain("after=cur");
  vi.unstubAllGlobals();
});
