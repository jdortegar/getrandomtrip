import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrustSignal } from "@/components/landing/TrustSignal";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

describe("TrustSignal", () => {
  it.each([
    {
      locale: "es",
      copy: es.home.trustSignal,
      titles: [
        "CURADO CON INTENCIÓN",
        "AMADO POR TRIPPERS",
        "TÚ SOLO DI QUE SÍ",
        "MÁS ALLÁ DE TU BURBUJA",
      ],
      descriptions: [
        "Viajes diseñados por expertos.",
        "Experiencias reales que inspiran.",
        "Sin planificar. Sin comparar.",
        "Descubre lo que no buscarías.",
      ],
    },
    {
      locale: "en",
      copy: en.home.trustSignal,
      titles: [
        "CURATED WITH INTENTION",
        "LOVED BY TRIPPERS",
        "JUST SAY YES",
        "BEYOND YOUR BUBBLE",
      ],
      descriptions: [
        "Trips designed by experts.",
        "Real experiences that inspire.",
        "No planning. No comparing.",
        "Discover what you wouldn’t seek out.",
      ],
    },
  ])(
    "renders four localized benefits and decorative icons ($locale)",
    (test) => {
      const template = document.createElement("template");
      template.innerHTML = renderToStaticMarkup(
        <TrustSignal copy={test.copy} />,
      );
      const section = template.content.querySelector("section");
      const list = section?.querySelector("ul");
      const items = [...(list?.querySelectorAll("li") ?? [])];

      expect(section?.getAttribute("aria-label")).toBe(
        test.copy.sectionAriaLabel,
      );
      expect(items).toHaveLength(4);
      expect(section?.querySelectorAll("svg")).toHaveLength(4);
      expect(
        items.map((item) => item.querySelector("h2")?.textContent),
      ).toEqual(test.titles);
      expect(items.map((item) => item.querySelector("p")?.textContent)).toEqual(
        test.descriptions,
      );
      expect(
        items.map((item) => item.querySelector("svg")?.getAttribute("class")),
      ).toEqual([
        expect.stringContaining("lucide-compass"),
        expect.stringContaining("lucide-heart"),
        expect.stringContaining("lucide-lock"),
        expect.stringContaining("lucide-globe"),
      ]);
      for (const item of items) {
        const heading = item.querySelector("h2");
        const icon = item.querySelector("svg");

        expect(item.classList.contains("text-center")).toBe(true);
        expect(item.classList.contains("sm:text-left")).toBe(true);
        expect(
          heading?.parentElement?.classList.contains("justify-center"),
        ).toBe(true);
        expect(
          heading?.parentElement?.classList.contains("sm:justify-start"),
        ).toBe(true);
        expect(icon?.getAttribute("aria-hidden")).toBe("true");
        expect(icon?.getAttribute("focusable")).toBe("false");
        expect(heading?.nextElementSibling).toBe(icon);
        expect(heading?.parentElement?.classList.contains("gap-3")).toBe(true);
        expect(
          heading?.parentElement?.classList.contains("justify-between"),
        ).toBe(false);
        expect(heading?.parentElement?.classList.contains("items-end")).toBe(
          true,
        );
        expect(item.querySelector("p")?.classList.contains("mt-2.5")).toBe(
          true,
        );
        expect(heading?.classList.contains("leading-[24px]")).toBe(true);
        expect(
          item.querySelector("p")?.classList.contains("leading-[22px]"),
        ).toBe(true);
        expect(heading?.parentElement?.nextElementSibling).toBe(
          item.querySelector("p"),
        );
      }
      expect(section?.classList.contains("bg-secondary")).toBe(true);
      expect(section?.classList.contains("text-[#082E30]")).toBe(true);
      expect(list?.classList.contains("grid-cols-1")).toBe(true);
      expect(list?.classList.contains("sm:grid-cols-2")).toBe(true);
      expect(list?.classList.contains("lg:grid-cols-4")).toBe(true);
      expect(list?.classList.contains("lg:gap-x-8")).toBe(true);
      expect(list?.classList.contains("xl:gap-x-16")).toBe(false);
    },
  );
});
