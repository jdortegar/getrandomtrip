import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../accordion";

function renderTrigger(className?: string) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <Accordion collapsible type="single">
      <AccordionItem value="a">
        <AccordionTrigger className={className}>Question</AccordionTrigger>
        <AccordionContent>Answer</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  return container.querySelector("button")!;
}

describe("AccordionTrigger", () => {
  it("shows a pointer cursor", () => {
    expect(renderTrigger().classList).toContain("cursor-pointer");
  });

  it("drops the browser outline on click but keeps a keyboard focus ring", () => {
    const classes = renderTrigger().classList;
    expect(classes).toContain("focus:outline-none");
    expect(classes).toContain("focus-visible:ring-2");
    expect(classes).toContain("focus-visible:ring-primary");
  });

  it("keeps caller classes", () => {
    expect(renderTrigger("text-left").classList).toContain("text-left");
  });
});
