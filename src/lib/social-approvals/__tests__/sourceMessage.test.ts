// @vitest-environment node
import { expect, it } from "vitest";
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
it("explains that video posts cannot be translated and offers no button", () => {
  const message = sourceMessage({
    ...source,
    mediaType: "VIDEO",
    status: "UNSUPPORTED",
  });
  expect(buttons(message)).toHaveLength(0);
  expect(JSON.stringify(message.blocks)).toContain("Video posts");
});
it("reads shortcodes from post and reel permalinks", () => {
  expect(shortcodeOf(source.permalink)).toBe("DXiYOKaFxwb");
  expect(shortcodeOf("https://www.instagram.com/reel/Dbn0ubQNBT5/")).toBe(
    "Dbn0ubQNBT5",
  );
  expect(shortcodeOf("https://example.com/")).toBeNull();
});
