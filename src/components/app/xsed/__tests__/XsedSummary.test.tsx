import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { XsedSummary } from "../XsedSummary";

function renderTotal(travelType: "solo" | "couple" | "", pax: number) {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <XsedSummary
      onEdit={() => {}}
      originCity="Buenos Aires"
      originCountry="Argentina"
      pax={pax}
      travelType={travelType}
      travelTypeLabel=""
    />,
  );
  return template.content.textContent ?? "";
}

describe("XsedSummary pricing", () => {
  it("charges the solo rate for a solo traveler", () => {
    const text = renderTotal("solo", 1);
    expect(text).toContain("USD 350");
    expect(text).not.toContain("USD 250");
  });

  it("charges the standard rate per person for other travel types", () => {
    expect(renderTotal("couple", 2)).toContain("USD 500");
  });

  it("shows the standard rate before a travel type is chosen", () => {
    expect(renderTotal("", 2)).toContain("USD 250");
  });
});
