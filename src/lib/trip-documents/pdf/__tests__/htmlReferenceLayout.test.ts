// @vitest-environment node
import { afterAll, beforeAll, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import puppeteer, { type Browser } from "puppeteer-core";
import { prepareHtmlDocument } from "../html/prepareHtmlDocument";
import { localChromiumPath } from "../html/localChromiumPath";
import { blockPdfRequest } from "../html/renderHtmlPdf";
import { paginateHtmlDocument } from "../html/paginateHtmlDocument";
import {
  activityFixture,
  dinnerFixture,
  hotelFixture,
  referenceFixtures,
} from "./referenceFixtures";
let browser: Browser;
beforeAll(async () => {
  const executablePath = await localChromiumPath();
  if (executablePath)
    browser = await puppeteer.launch({ executablePath, headless: "shell" });
  else {
    const { default: chromium } = await import("@sparticuz/chromium");
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: "shell",
    });
  }
});
afterAll(async () => {
  await browser?.close();
});
async function layout(input: (typeof referenceFixtures)[number]) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    void blockPdfRequest(request);
  });
  await page.setViewport({ width: 1200, height: 1740 });
  const html = await prepareHtmlDocument(input);
  await page.setContent(html.html);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.evaluate(
    `{ const __name = fn => fn; (${paginateHtmlDocument.toString()})(); }`,
  );
  return page;
}
for (const input of referenceFixtures) {
  it(`${input.template} keeps reference header, card geometry and footer clear`, async () => {
    const page = await layout(input);
    try {
      const result = await page.evaluate(() => {
        const sheet = document.querySelector<HTMLElement>(".sheet")!;
        const zoom = Number(getComputedStyle(sheet).zoom);
        const boxes = Array.from(
          document.querySelectorAll<HTMLElement>(".unit"),
        ).map((element) => ({
          className: element.className,
          x:
            (element.getBoundingClientRect().left -
              sheet.getBoundingClientRect().left) /
            zoom,
          y: element.offsetTop,
          height: element.offsetHeight,
        }));
        return { pages: document.querySelectorAll(".sheet").length, boxes };
      });
      expect(result.pages).toBe(1);
      const roadmap = input.template.endsWith("roadmap");
      expect(result.boxes[0].height).toBe(roadmap ? 220 : 213);
      if (roadmap) {
        expect(
          result.boxes.find((b) => b.className.includes("summary-row"))!.y,
        ).toBe(248);
        expect(
          result.boxes.find((b) => b.className.includes("itinerary-card"))!.y,
        ).toBe(490);
        expect(
          Math.abs(
            result.boxes.find((b) => b.className.includes("map-panel"))!.y -
              1477,
          ),
        ).toBeLessThanOrEqual(1);
      }
      if (input.template === "hotel-voucher") {
        expect(result.boxes.find((b) => b.className.includes("items"))!.y).toBe(
          784,
        );
        expect(
          Math.abs(
            result.boxes.find((b) => b.className.includes("hotel-policy"))!.y -
              1422,
          ),
        ).toBeLessThanOrEqual(1);
      }
    } finally {
      await page.close();
    }
  });
}
for (const locale of ["en", "es"] as const) {
  it(`keeps the ${locale} dinner footer below the complete terms border`, async () => {
    const input = structuredClone(dinnerFixture);
    input.locale = locale;
    const page = await layout(input);
    try {
      const result = await page.evaluate(() => {
        const terms = document.querySelector(".dinner-terms")!;
        const footer = document.querySelector(".footer")!;
        return {
          pages: document.querySelectorAll(".sheet").length,
          clearance:
            footer.getBoundingClientRect().top -
            terms.getBoundingClientRect().bottom,
        };
      });
      expect(result.pages).toBe(1);
      expect(result.clearance).toBeGreaterThanOrEqual(8);
    } finally {
      await page.close();
    }
  });
}
it("escapes malicious text without authoring active markup or scripts", async () => {
  const input = structuredClone(hotelFixture);
  input.data.property.name =
    '<img src="https://example.com/steal" onerror="alert(1)">';
  const result = await prepareHtmlDocument(input);
  expect(result.html).toContain("&lt;img src=&quot;");
  expect(result.html).not.toContain("<img");
  expect(result.html).not.toContain("<script");
  expect(result.html).toContain("default-src 'none'");
});
it("does not invent spa services, confirmation, or payment for a sparse cultural outing", async () => {
  const input = structuredClone(activityFixture);
  delete input.data.supplierConfirmation;
  delete input.data.paymentWording;
  input.data.program = [{ id: "history", title: "Local history walk" }];
  const result = await prepareHtmlDocument(input);
  // Icon definitions live only in used inline assets, not a global symbol sheet.
  expect(result.html).not.toContain('data-icon="voucher-pool-sauna"');
  expect(result.html).not.toContain("RESERVA CONFIRMADA");
  expect(result.html).not.toContain("Confirmado / Incluido");
});
it("preserves linked long addresses, provider links and QR through pagination", async () => {
  const input = structuredClone(hotelFixture);
  input.data.property.name = "Synthetic Provider\n".repeat(120);
  input.data.property.address = "Synthetic address\n".repeat(120);
  input.data.property.providerUrl = "https://example.com/provider";
  const page = await layout(input);
  try {
    const result = await page.evaluate(() => ({
      hrefs: Array.from(document.querySelectorAll("a")).map((a) => a.href),
      qr: document.querySelectorAll(".qr-image").length,
      footers: Array.from(
        document.querySelectorAll<HTMLElement>(".footer"),
      ).map((f) => f.offsetHeight),
    }));
    expect(result.hrefs).toContain(input.data.property.locationUrl);
    expect(result.hrefs).toContain(input.data.property.providerUrl);
    expect(result.hrefs).toContain(input.data.supplierConfirmationUrl);
    expect(result.qr).toBeGreaterThan(0);
    expect(Math.max(...result.footers)).toBeLessThanOrEqual(20);
    if (process.env.PDF_QA_OUTPUT_DIR) {
      await mkdir(process.env.PDF_QA_OUTPUT_DIR, { recursive: true });
      await writeFile(
        join(
          process.env.PDF_QA_OUTPUT_DIR,
          "hotel-voucher-linked-overflow.pdf",
        ),
        await page.pdf({
          format: "A4",
          scale: 0.666415439,
          printBackground: true,
          preferCSSPageSize: true,
        }),
      );
    }
  } finally {
    await page.close();
  }
});
