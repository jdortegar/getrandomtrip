import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CitySelector from "../CitySelector";

const params = vi.hoisted(() => ({ locale: "en" }));

vi.mock("next/navigation", () => ({ useParams: () => params }));

function renderSelector(countryCode?: string, placeholder?: string) {
  return renderToString(
    <CitySelector
      countryCode={countryCode}
      onChange={() => {}}
      placeholder={placeholder}
      value=""
    />,
  );
}

describe("CitySelector placeholder", () => {
  it.each([
    { locale: "en", text: "Select a country first" },
    { locale: "es", text: "Selecciona un país primero" },
  ])("asks for a country first in $locale", ({ locale, text }) => {
    params.locale = locale;
    // An empty code means "scoped search, country not chosen yet".
    expect(renderSelector("")).toContain(`placeholder="${text}"`);
  });

  it.each([
    { locale: "en", text: "Departure city" },
    { locale: "es", text: "Ciudad de salida" },
  ])("falls back to a localized city placeholder in $locale", ({ locale, text }) => {
    params.locale = locale;
    expect(renderSelector("AR")).toContain(`placeholder="${text}"`);
  });

  it("keeps the caller's placeholder once a country is chosen", () => {
    params.locale = "en";
    expect(renderSelector("AR", "Type a city")).toContain('placeholder="Type a city"');
  });
});
