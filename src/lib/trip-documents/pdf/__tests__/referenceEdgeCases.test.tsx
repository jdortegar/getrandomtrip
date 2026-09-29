// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { expect, it } from "vitest";
import { experienceFixture, referenceFixtures } from "./referenceFixtures";
import { renderHotelVoucher } from "../renderHotelVoucher";
import { renderDinnerVoucher } from "../renderDinnerVoucher";
import { renderActivityVoucher } from "../renderActivityVoucher";
import { renderXsedRoadmap } from "../renderXsedRoadmap";
import { renderExperienceRoadmap } from "../renderExperienceRoadmap";
const renderers = {
  "hotel-voucher": renderHotelVoucher,
  "dinner-voucher": renderDinnerVoucher,
  "activity-voucher": renderActivityVoucher,
  "xsed-roadmap": renderXsedRoadmap,
  "experience-roadmap": renderExperienceRoadmap,
};
async function render(
  input: (typeof referenceFixtures)[number],
  variant: string,
) {
  const result = await renderers[input.template](input);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  if (process.env.PDF_QA_OUTPUT_DIR) {
    await mkdir(process.env.PDF_QA_OUTPUT_DIR, { recursive: true });
    await writeFile(
      join(process.env.PDF_QA_OUTPUT_DIR, `${input.template}-${variant}.pdf`),
      result.buffer,
    );
  }
  const pdf = await getDocument({
    data: new Uint8Array(result.buffer),
    standardFontDataUrl: join(
      process.cwd(),
      "node_modules/pdfjs-dist/standard_fonts/",
    ),
  }).promise;
  try {
    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, index) => {
        const content = await (await pdf.getPage(index + 1)).getTextContent();
        return content.items.flatMap((item) =>
          "str" in item
            ? [
                {
                  text: item.str,
                  x: item.transform[4],
                  y: item.transform[5],
                  width: item.width,
                  height: item.height,
                },
              ]
            : [],
        );
      }),
    );
    return pages;
  } finally {
    await pdf.destroy();
  }
}
const rules = Array.from(
  { length: 80 },
  (_, index) => `Rule ${index + 1}`,
).join("\n");
it("keeps compact header route metadata separate from a long heading", async () => {
  const input = structuredClone(experienceFixture);
  delete input.data.travelerLabel;
  delete input.data.experienceLabel;
  input.data.origin = "Ciudad Autónoma de Buenos Aires";
  input.data.destination = "San Antonio de Areco, provincia de Buenos Aires";
  input.data.heading =
    "Nuestra escapada de fin de semana a San Antonio de Areco";
  const pages = await render(input, "header-columns");
  const headerItems = pages[0].filter(
    (item) => item.y > 700 && item.text.trim(),
  );
  const headings = headerItems.filter((item) => item.height >= 15);
  const metadata = headerItems.filter((item) => item.height < 7);
  for (const heading of headings)
    for (const item of metadata) {
      const overlapsX =
        heading.x < item.x + item.width && item.x < heading.x + heading.width;
      const overlapsY =
        heading.y < item.y + item.height && item.y < heading.y + heading.height;
      expect(overlapsX && overlapsY).toBe(false);
    }
});
for (const fixture of referenceFixtures) {
  if (fixture.template.endsWith("voucher")) {
    it(`preserves short multiline card content in ${fixture.template}`, async () => {
      const input = structuredClone(fixture);
      if (input.template === "hotel-voucher")
        input.data.localActivities = rules;
      if (input.template === "dinner-voucher")
        input.data.menuItems = [
          { id: "lines", title: "Menu", description: rules },
        ];
      if (input.template === "activity-voucher")
        input.data.program = [
          { id: "lines", title: "Program", description: rules },
        ];
      const pages = await render(input, "multiline-cards");
      const items = pages.flat().filter((item) => /^Rule \d+$/.test(item.text));
      expect(items).toHaveLength(80);
      for (const item of items) expect(item.y).toBeGreaterThan(40);
    });
    it(`preserves long supplier wording in flowing content in ${fixture.template}`, async () => {
      const input = structuredClone(fixture);
      if ("supplierConfirmation" in input.data)
        input.data.supplierConfirmation = rules;
      const pages = await render(input, "status");
      const items = pages.flat().filter((item) => /^Rule \d+$/.test(item.text));
      expect(items).toHaveLength(80);
      for (const item of items) expect(item.y).toBeGreaterThan(40);
    });
    it(`preserves all short policy lines in ${fixture.template}`, async () => {
      const input = structuredClone(fixture);
      if (input.template === "hotel-voucher") input.data.instructions = rules;
      if (input.template === "dinner-voucher") input.data.conditions = rules;
      if (input.template === "activity-voucher")
        input.data.recommendations = rules;
      const pages = await render(input, "multiline");
      expect(pages.length).toBeGreaterThan(1);
      const items = pages.flat().filter((item) => /^Rule \d+$/.test(item.text));
      expect(items).toHaveLength(80);
      for (const item of items) expect(item.y).toBeGreaterThan(40);
    });
    it(`keeps the authored visible label with locality in ${fixture.template}`, async () => {
      const pages = await render(
        { ...fixture, label: "TEST / NOT FOR TRAVEL" },
        "label",
      );
      expect(
        pages
          .flat()
          .map((item) => item.text)
          .join(" "),
      ).toContain("TEST / NOT FOR TRAVEL");
    });
  }
  it(`flows multiline reference before the summary in ${fixture.template}`, async () => {
    const input = structuredClone(fixture);
    input.data.reservationReference = Array.from(
      { length: 20 },
      (_, index) => `Confirmation ref ${index}`,
    ).join("\n");
    const pages = await render(input, "reference");
    const items = pages.flatMap((page, pageIndex) =>
      page.map((item) => ({ ...item, pageIndex })),
    );
    const finalReference = items.find((item) =>
      item.text.includes("Confirmation ref 19"),
    );
    const firstDate = items.find((item) => /agosto/i.test(item.text));
    expect(finalReference).toBeDefined();
    expect(firstDate).toBeDefined();
    expect(
      finalReference!.pageIndex < firstDate!.pageIndex ||
        (finalReference!.pageIndex === firstDate!.pageIndex &&
          finalReference!.y > firstDate!.y),
    ).toBe(true);
  });
}
