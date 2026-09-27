import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FaqBlock, type FaqBlockDict } from "../FaqBlock";

const copy: FaqBlockDict = {
  description: "Answers to common questions.",
  eyebrow: "FAQ",
  items: [{ answer: "A surprise trip.", question: "What is a drop?" }],
  title: "Your questions",
};

describe("FaqBlock spacing", () => {
  it("preserves compact top spacing by default for existing callers", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(<FaqBlock copy={copy} />);

    expect(container.querySelector("section > div")?.classList).toContain(
      "pt-0!",
    );
  });

  it("allows callers to restore standard responsive section padding", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <FaqBlock className="" copy={copy} />,
    );
    const classes = container.querySelector("section > div")?.classList;

    expect(classes).not.toContain("pt-0!");
    expect(classes).toContain("py-24");
    expect(classes).toContain("md:py-32");
    expect(container.textContent).toContain(copy.items[0].question);
  });
});
