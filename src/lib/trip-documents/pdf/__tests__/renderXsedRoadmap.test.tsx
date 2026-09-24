// @vitest-environment node
import * as fonts from "../pdfFonts";
import { isValidElement, type ReactNode } from "react";
import { expect, it, vi } from "vitest";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import { renderXsedRoadmap } from "../renderXsedRoadmap";
import { XsedRoadmapPdf } from "../XsedRoadmapPdf";
const document: XsedRoadmapDocument = {
  template: "xsed-roadmap",
  templateVersion: 1,
  label: "Río y café",
  country: "AR",
  locale: "es",
  data: {
    origin: "Buenos Aires",
    destination: "San Antonio de Areco",
    departureDate: "2026-10-02",
    departureTime: "09:00",
    drivingDuration: "2 horas",
    mapUrl: "https://example.com/map",
    stops: [
      {
        id: "walk",
        title: "Paseo por el río",
        directions: "Caminar y tomar café",
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
      const result = await renderXsedRoadmap({ ...document, locale });
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
  const result = text(XsedRoadmapPdf({ document }));
  for (const value of [
    "Buenos Aires",
    "San Antonio de Areco",
    "2 horas",
    "09:00",
    "Paseo por el río",
    "Caminar y tomar café",
    "10:30",
    "AR",
  ])
    expect(result).toContain(value);
  expect(result).toContain("Buenos Aires - San Antonio de Areco");
  expect(result).not.toContain("Reserva confirmada");
  expect(
    text(XsedRoadmapPdf({ document: { ...document, locale: "en" } })),
  ).toContain("Step-by-step itinerary");
});
it("allows activities without invented dates, times or map", async () => {
  const input = {
    ...document,
    data: {
      ...document.data,
      mapUrl: undefined,
      stops: [
        {
          id: "free",
          title: "Paseo libre",
          directions: "Elegir el recorrido",
        },
      ],
    },
  };
  delete input.data.mapUrl;
  const result = await renderXsedRoadmap(
    input,
    vi.fn().mockResolvedValue(Buffer.from("%PDF")),
  );
  expect(result.ok).toBe(true);
  expect(text(XsedRoadmapPdf({ document: input }))).not.toContain("10:30");
});
it.each([
  { ...document, locale: "fr" },
  { ...document, data: { ...document.data, stops: [] } },
  { ...document, data: { ...document.data, departureTime: "24:00" } },
  { ...document, data: { ...document.data, mapUrl: "http://unsafe" } },
])("rejects invalid generation input before rendering", async (input) => {
  const render = vi.fn();
  expect((await renderXsedRoadmap(input, render)).ok).toBe(false);
  expect(render).not.toHaveBeenCalled();
});
it("bounds PDF bytes and propagates renderer failure", async () => {
  await expect(
    renderXsedRoadmap(
      document,
      vi.fn().mockResolvedValue(Buffer.alloc(4 * 1024 * 1024 + 1)),
    ),
  ).rejects.toThrow("DOCUMENT_PDF_TOO_LARGE");
  expect(
    (
      await renderXsedRoadmap(
        document,
        vi.fn().mockResolvedValue(Buffer.alloc(4 * 1024 * 1024)),
      )
    ).ok,
  ).toBe(true);
  await expect(
    renderXsedRoadmap(
      document,
      vi.fn().mockRejectedValue(new Error("render failed")),
    ),
  ).rejects.toThrow("render failed");
});

it("passes locally generated QR bytes for the supplied optional URL to the template", async () => {
  const render = vi.fn().mockResolvedValue(Buffer.from("%PDF-test"));
  await renderXsedRoadmap(document, render);
  const images = render.mock.calls[0][0].props.qrImages;
  const url = document.data.mapUrl;
  expect(images[url!].subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
});

it("prepares local fonts only after generation validation", async () => {
  const prepare = vi.spyOn(fonts, "registerPdfFonts");
  const render = vi.fn().mockResolvedValue(Buffer.from("%PDF-test"));
  try {
    await renderXsedRoadmap({}, render);
    expect(prepare).not.toHaveBeenCalled();
    await renderXsedRoadmap(document, render);
    expect(prepare).toHaveBeenCalledOnce();
  } finally {
    prepare.mockRestore();
  }
});
it.each(["en", "es"] as const)(
  "uses publication-neutral %s footer",
  (locale) => {
    const root = XsedRoadmapPdf({ document: { ...document, locale } });
    function rendered(node: ReactNode): string {
      if (Array.isArray(node)) return node.map(rendered).join(" ");
      if (
        !isValidElement<{
          children?: ReactNode;
          render?: (props: {
            pageNumber: number;
            totalPages: number;
          }) => string;
        }>(node)
      )
        return "";
      return (
        (node.props.render?.({ pageNumber: 1, totalPages: 2 }) ?? "") +
        rendered(node.props.children)
      );
    }
    expect(rendered(root)).toContain(
      locale === "en"
        ? "Travel document | 1 / 2"
        : "Documento de viaje | 1 / 2",
    );
    expect(rendered(root)).not.toMatch(
      /not attached|no adjunta|Preview|Vista previa/,
    );
  },
);

it("embeds Barlow regular and bold in actual PDF bytes", async () => {
  const result = await renderXsedRoadmap(document);
  if (!result.ok) throw new Error("invalid fixture");
  expect(result.buffer.toString("latin1")).toContain("Barlow-Regular");
  expect(result.buffer.toString("latin1")).toContain("Barlow-Bold");
});
