// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { referenceFixtures, activityFixture } from "./referenceFixtures";
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
async function extract(buffer: Buffer, bodyOnly = false) {
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: false,
    standardFontDataUrl: join(
      process.cwd(),
      "node_modules/pdfjs-dist/standard_fonts/",
    ),
  }).promise;
  try {
    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, index) => {
        const page = await pdf.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items
          .filter(
            (item) =>
              !bodyOnly || ("transform" in item && item.transform[5] > 40),
          )
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ");
      }),
    );
    return pages;
  } finally {
    await pdf.destroy();
  }
}
async function record(name: string, buffer: Buffer) {
  if (!process.env.PDF_QA_OUTPUT_DIR) return;
  await mkdir(process.env.PDF_QA_OUTPUT_DIR, { recursive: true });
  await writeFile(join(process.env.PDF_QA_OUTPUT_DIR, `${name}.pdf`), buffer);
}
for (const fixture of referenceFixtures) {
  it(`renders the complete ${fixture.template} reference-shaped fixture offline`, async () => {
    const result = await renderers[fixture.template](fixture);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(result.buffer.toString("latin1")).toContain(
      "/URI (https://example.com/",
    );
    await record(fixture.template, result.buffer);
    const pages = await extract(result.buffer);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain("Documento de viaje | 1 / 1");
    expect(pages[0]).toContain("DEMO-2026-89413");
    await record(fixture.template, result.buffer);
  });
  it(`renders ${fixture.template} with English panels and footer`, async () => {
    const result = await renderers[fixture.template]({
      ...fixture,
      locale: "en",
    });
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const pages = await extract(result.buffer);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain("Travel document | 1 / 1");
    await record(`${fixture.template}-en`, result.buffer);
  });
  it(`paginates long ${fixture.template} content without losing the final authored marker`, async () => {
    const input = structuredClone(fixture);
    const longText =
      "Long authored detail. ".repeat(100) + " FINAL_CONTENT_MARKER";
    if (input.template === "hotel-voucher") input.data.instructions = longText;
    if (input.template === "dinner-voucher")
      input.data.menuItems = Array.from({ length: 9 }, (_, i) => ({
        id: `item-${i}`,
        title: `Menu ${i}`,
        description: longText,
      }));
    if (input.template === "activity-voucher")
      input.data.program = Array.from({ length: 9 }, (_, i) => ({
        id: `item-${i}`,
        title: `Program ${i}`,
        description: longText,
      }));
    if (input.template === "xsed-roadmap")
      input.data.stops = Array.from({ length: 9 }, (_, i) => ({
        id: `item-${i}`,
        title: `Stop ${i}`,
        directions: longText,
      }));
    if (input.template === "experience-roadmap")
      input.data.activities = Array.from({ length: 9 }, (_, i) => ({
        id: `item-${i}`,
        title: `Activity ${i}`,
        description: longText,
      }));
    const result = await renderers[input.template](input);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(
      result.buffer.toString("latin1").match(/\/Type \/Page\b/g)!.length,
    ).toBeGreaterThan(1);
    await record(`${fixture.template}-long`, result.buffer);
    const pages = await extract(result.buffer);
    const expectedCount = input.template === "hotel-voucher" ? 1 : 9;
    expect(
      pages
        .join(" ")
        .replace(/-\s+/g, "")
        .replace(/\s+/g, "")
        .match(/FINAL_CONTENT_MARKER/g),
    ).toHaveLength(expectedCount);
    const bodyPages = await extract(result.buffer, true);
    const normalizedText = bodyPages
      .join(" ")
      .replace(/-\s+/g, "")
      .replace(/\s+/g, "");
    expect(normalizedText.match(/Longauthoreddetail\./g)).toHaveLength(
      expectedCount * 100,
    );
    for (const page of bodyPages) expect(page.length).toBeGreaterThan(30);
    for (const [index, page] of pages.entries())
      expect(page).toContain(
        `Documento de viaje | ${index + 1} / ${pages.length}`,
      );
    await record(`${fixture.template}-long`, result.buffer);
  }, 30000);
}
it("renders a sparse honest cultural outing with no spa or confirmation data", async () => {
  const input = {
    ...activityFixture,
    data: {
      participants: "2",
      provider: {
        name: "Example Cultural Center",
        address: "Example Street",
        providerUrl: "https://example.com/culture",
      },
      date: "2026-09-29",
      time: "15:00",
      program: [
        {
          id: "walk",
          title: "Local history walk",
          description: "An outdoor cultural visit.",
        },
      ],
    },
  };
  const result = await renderActivityVoucher(input);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
  await record("activity-honest", result.buffer);
});
