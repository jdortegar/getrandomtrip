// @vitest-environment node
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import {
  Document,
  Font,
  Page,
  Text,
  renderToBuffer,
} from "@react-pdf/renderer";
import { expect, it, vi } from "vitest";
import { registerPdfFonts } from "../pdfFonts";
it("registers licensed local regular/bold assets once and renders accents without remote fetch", async () => {
  const register = vi.spyOn(Font, "register");
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("network forbidden"));
  try {
    registerPdfFonts();
    registerPdfFonts();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith({
      family: "Barlow",
      fonts: [
        {
          src: `${process.cwd()}/public/assets/fonts/barlow/Barlow-Regular.ttf`,
          fontWeight: 400,
        },
        {
          src: `${process.cwd()}/public/assets/fonts/barlow/Barlow-Bold.ttf`,
          fontWeight: 700,
        },
      ],
    });
    const pdf = await renderToBuffer(
      <Document>
        <Page>
          <Text style={{ fontFamily: "Barlow" }}>Córdoba, Ñandú, café</Text>
          <Text style={{ fontFamily: "Barlow", fontWeight: 700 }}>
            José — bold
          </Text>
        </Page>
      </Document>,
    );
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(
      fetch.mock.calls.filter(([url]) => /^https?:/.test(String(url))),
    ).toEqual([]);
    const license = await readFile(
      "public/assets/fonts/barlow/OFL.txt",
      "utf8",
    );
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(license).toContain("The Barlow Project Authors");
  } finally {
    register.mockRestore();
    fetch.mockRestore();
  }
});
it("explicitly traces local fonts/license/logo for five preview routes and persistent render only", async () => {
  const configModule = {
    exports: {} as {
      outputFileTracingIncludes: Record<string, string[]>;
      transpilePackages: string[];
    },
  };
  runInNewContext(await readFile("next.config.js", "utf8"), {
    module: configModule,
    process: { env: {} },
    require: () => ({ withSentryConfig: (config: unknown) => config }),
  });
  const traces = configModule.exports.outputFileTracingIncludes;
  const routes = [
    "hotel-voucher-preview",
    "activity-voucher-preview",
    "dinner-voucher-preview",
    "experience-roadmap-preview",
    "xsed-roadmap-preview",
    "document-drafts/*/render",
  ];
  expect(Object.keys(traces)).toHaveLength(6);
  for (const route of routes) {
    expect(traces[`/api/admin/trip-requests/*/${route}`]).toEqual([
      "./public/assets/fonts/barlow/Barlow-Regular.ttf",
      "./public/assets/fonts/barlow/Barlow-Bold.ttf",
      "./public/assets/fonts/barlow/OFL.txt",
      "./public/assets/icons/isologo.png",
    ]);
    for (const path of traces[`/api/admin/trip-requests/*/${route}`])
      expect((await readFile(path)).length).toBeGreaterThan(0);
  }
  expect(configModule.exports.transpilePackages).toEqual(["@tinymce/tinymce-react"]);
});
