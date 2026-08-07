import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { TripperUnavailableNotice } from "@/components/tripper/TripperUnavailableNotice";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy = {
  title: "Este perfil no está disponible",
  description: "{name} pausó su perfil por ahora. Podés explorar otros trippers mientras tanto.",
  ctaLabel: "Ver todos los trippers",
};

function render(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return container;
}

describe("TripperUnavailableNotice", () => {
  it("interpolates the tripper name into the description", () => {
    const container = render(
      <TripperUnavailableNotice
        copy={copy}
        ctaHref="/trippers"
        tripperName="Florencia"
      />,
    );

    expect(container.textContent).toContain(
      "Florencia pausó su perfil por ahora.",
    );
  });

  it("falls back to a name-less description when tripperName is undefined", () => {
    const container = render(
      <TripperUnavailableNotice copy={copy} ctaHref="/trippers" />,
    );

    expect(container.textContent).not.toContain("undefined");
    expect(container.textContent).toContain("pausó su perfil por ahora");
  });

  it("renders the CTA link pointing at ctaHref with the localized label", () => {
    const container = render(
      <TripperUnavailableNotice
        copy={copy}
        ctaHref="/en/trippers"
        tripperName="Ana"
      />,
    );

    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/en/trippers");
    expect(link?.textContent).toBe("Ver todos los trippers");
  });
});
