import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import HeaderHero from "../HeaderHero";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it.each([
  ["/videos/hero-video-1.mp4", "video/mp4"],
  ["/videos/custom.webm?version=1", "video/webm"],
])("uses only the supplied video asset %s", (src, type) => {
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<HeaderHero title="Journey" videoSrc={src} />));
    const sources = container.querySelectorAll("source");
    expect(sources).toHaveLength(1);
    expect(sources[0].getAttribute("src")).toBe(src);
    expect(sources[0].type).toBe(type);
  } finally {
    act(() => root.unmount());
  }
});
