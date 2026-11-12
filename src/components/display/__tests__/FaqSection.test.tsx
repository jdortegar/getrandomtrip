import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FaqSection from "../FaqSection";

const items = [
  { answer: "Revealed 48 hours before departure.", question: "When?" },
  { answer: "Lodging and curated activities.", question: "What is included?" },
];

describe("FaqSection server markup", () => {
  it("renders every answer in the server HTML so crawlers can read it", () => {
    const html = renderToStaticMarkup(<FaqSection items={items} />);

    for (const item of items) {
      expect(html).toContain(item.question);
      expect(html).toContain(item.answer);
    }
  });

  it("keeps closed answers visually hidden", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(<FaqSection items={items} />);
    const panels = container.querySelectorAll('[role="region"]');

    expect(panels).toHaveLength(items.length);
    panels.forEach((panel) => expect(panel.hasAttribute("hidden")).toBe(true));
  });

  it("renders nothing when there are no items", () => {
    expect(renderToStaticMarkup(<FaqSection items={[]} />)).toBe("");
  });

  it("shows an answer when its question is clicked and hides it again", () => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<FaqSection items={items} />));

    const [firstTrigger] = container.querySelectorAll("button");
    const panels = () => container.querySelectorAll('[role="region"]');

    act(() => firstTrigger.click());
    expect(panels()[0].hasAttribute("hidden")).toBe(false);
    expect(panels()[1].hasAttribute("hidden")).toBe(true);

    act(() => firstTrigger.click());
    expect(panels()[0].hasAttribute("hidden")).toBe(true);

    act(() => root.unmount());
    container.remove();
  });
});
