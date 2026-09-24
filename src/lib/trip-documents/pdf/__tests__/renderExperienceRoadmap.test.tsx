// @vitest-environment node
import { isValidElement, type ReactNode } from "react";
import { expect, it, vi } from "vitest";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import { renderExperienceRoadmap } from "../renderExperienceRoadmap";
import { ExperienceRoadmapPdf } from "../ExperienceRoadmapPdf";
const document: ExperienceRoadmapDocument = {
  template: "experience-roadmap",
  templateVersion: 1,
  label: "Río y café",
  country: "AR",
  locale: "es",
  data: {
    origin: "Buenos Aires",
    destination: "San Antonio de Areco",
    startDate: "2026-10-02",
    endDate: "2026-10-03",
    duration: "2 horas",
    heading: "Un recorrido tranquilo",
    mapUrl: "https://example.com/map",
    activities: [
      {
        id: "walk",
        title: "Paseo por el río",
        description: "Caminar y tomar café",
        date: "2026-10-02",
        time: "10:30",
      },
    ],
  },
};
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node))
    return text(node.props.children);
  return typeof node === "string" || typeof node === "number"
    ? String(node)
    : "";
}
it.each(["en", "es"] as const)(
  "renders real %s PDF without fetching map links",
  async (locale) => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("network forbidden"));
    try {
      const result = await renderExperienceRoadmap({ ...document, locale });
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
      expect(
        fetch.mock.calls.filter(([url]) => /^https?:/.test(String(url))),
      ).toHaveLength(0);
    } finally {
      fetch.mockRestore();
    }
  },
);
it("renders all authored fields and localized suggested itinerary headings", () => {
  const result = text(ExperienceRoadmapPdf({ document }));
  for (const value of [
    "Buenos Aires",
    "San Antonio de Areco",
    "2 horas",
    "Un recorrido tranquilo",
    "Paseo por el río",
    "Caminar y tomar café",
    "10:30",
    "AR",
  ])
    expect(result).toContain(value);
  expect(result).not.toContain("Reserva confirmada");
  expect(
    text(ExperienceRoadmapPdf({ document: { ...document, locale: "en" } })),
  ).toContain("Suggested activities");
});
it("allows activities without invented dates, times or map", async () => {
  const input = {
    ...document,
    data: {
      ...document.data,
      mapUrl: undefined,
      activities: [
        {
          id: "free",
          title: "Paseo libre",
          description: "Elegir el recorrido",
        },
      ],
    },
  };
  delete input.data.mapUrl;
  const result = await renderExperienceRoadmap(
    input,
    vi.fn().mockResolvedValue(Buffer.from("%PDF")),
  );
  expect(result.ok).toBe(true);
  expect(text(ExperienceRoadmapPdf({ document: input }))).not.toContain(
    "10:30",
  );
});
it.each([
  { ...document, locale: "fr" },
  { ...document, data: { ...document.data, activities: [] } },
  { ...document, data: { ...document.data, endDate: "2026-01-01" } },
  { ...document, data: { ...document.data, mapUrl: "http://unsafe" } },
])("rejects invalid generation input before rendering", async (input) => {
  const render = vi.fn();
  expect((await renderExperienceRoadmap(input, render)).ok).toBe(false);
  expect(render).not.toHaveBeenCalled();
});
it("bounds PDF bytes and propagates renderer failure", async () => {
  await expect(
    renderExperienceRoadmap(
      document,
      vi.fn().mockResolvedValue(Buffer.alloc(4 * 1024 * 1024 + 1)),
    ),
  ).rejects.toThrow("DOCUMENT_PDF_TOO_LARGE");
  expect(
    (
      await renderExperienceRoadmap(
        document,
        vi.fn().mockResolvedValue(Buffer.alloc(4 * 1024 * 1024)),
      )
    ).ok,
  ).toBe(true);
  await expect(
    renderExperienceRoadmap(
      document,
      vi.fn().mockRejectedValue(new Error("render failed")),
    ),
  ).rejects.toThrow("render failed");
});

it("passes locally generated QR bytes for the supplied optional URL to the template", async () => {
  const render = vi.fn().mockResolvedValue(Buffer.from("%PDF-test"));
  await renderExperienceRoadmap(document, render);
  const images = render.mock.calls[0][0].props.qrImages;
  const url = document.data.mapUrl;
  expect(images[url!].subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
});
