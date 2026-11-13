import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PartnersSection } from "../PartnersSection";

const NAMES = ["Viator", "Booking.com", "Duffel", "GetYourGuide", "Stripe"];

function render() {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <PartnersSection copy={{ title: "Tu viaje, en buenas manos" }} />,
  );
  return container;
}

describe("PartnersSection", () => {
  it("shows the four partners in a single row, never a grid", () => {
    const list = render().querySelector("ul")!;

    expect(list.className).toContain("flex");
    expect(list.className).not.toMatch(/grid-cols/);
    expect(list.className).not.toMatch(/flex-wrap|flex-col/);
  });

  it("autoplays as a loop on mobile and stops from tablet up or with reduced motion", () => {
    const classes = render().querySelector("ul")!.classList;

    expect(classes).toContain("animate-[infinite-scroll_20s_linear_infinite]");
    expect(classes).toContain("md:animate-none");
    expect(classes).toContain("motion-reduce:animate-none");
  });

  it("announces each partner once; the loop copy is hidden from assistive tech and from tablet up", () => {
    const container = render();
    const visible = Array.from(
      container.querySelectorAll('li:not([aria-hidden="true"]) img'),
    ).map((img) => img.getAttribute("alt"));
    const copies = container.querySelectorAll('li[aria-hidden="true"]');

    expect(visible).toEqual(NAMES);
    expect(copies).toHaveLength(NAMES.length);
    copies.forEach((copy) => {
      expect(copy.classList).toContain("md:hidden");
      expect(copy.querySelector("img")?.getAttribute("alt")).toBe("");
    });
  });
});
