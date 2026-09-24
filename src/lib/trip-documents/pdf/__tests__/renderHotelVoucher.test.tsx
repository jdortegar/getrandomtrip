// @vitest-environment node
import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHotelVoucher } from "../renderHotelVoucher";
import { HotelVoucherPdf } from "../HotelVoucherPdf";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";

const document: HotelVoucherDocument = {
  template: "hotel-voucher",
  templateVersion: 1,
  label: "Hotel Ñandú",
  locale: "es",
  country: "AR",
  data: {
    holder: "Ana Pérez",
    guests: "Ana y José",
    checkInDate: "2026-09-23",
    checkOutDate: "2026-09-25",
    property: {
      name: "Hotel Río",
      address: "Calle 12",
      locationUrl: "https://example.com/map",
    },
    inclusions: [
      { id: "breakfast", title: "Desayuno", description: "Café incluido" },
    ],
    instructions: "Traer identificación",
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
describe("hotel voucher PDF", () => {
  it("renders validated Spanish content to real PDF bytes without fetching links", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("network forbidden"));
    try {
      const result = await renderHotelVoucher(document);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("unexpected validation error");
      expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
      expect(result.buffer.subarray(-20).toString()).toContain("%%EOF");
      expect(
        fetch.mock.calls.filter(([url]) => /^https?:/.test(String(url))),
      ).toEqual([]);
    } finally {
      fetch.mockRestore();
    }
  });
  it.each([
    ["es", "Comprobante de alojamiento"],
    ["en", "Hotel voucher"],
  ] as const)(
    "includes all authored fields with %s standard copy",
    (locale, title) => {
      const full = {
        ...document,
        locale,
        data: {
          ...document.data,
          checkInTime: "15:00",
          checkOutTime: "11:00",
          issueDate: "2026-09-20",
          reservationReference: "REF-42",
          paymentWording: "Paid to supplier",
          supplierConfirmation: "Confirmed by hotel",
          property: {
            ...document.data.property,
            contact: "Reception +54",
            providerUrl: "https://example.com",
          },
        },
      };
      const output = text(HotelVoucherPdf({ document: full }));
      for (const value of [
        title,
        full.label,
        ..."AR|Ana Pérez|Ana y José|Hotel Río|Calle 12|Café incluido|Traer identificación|15:00|11:00|REF-42|Paid to supplier|Confirmed by hotel|Reception +54".split(
          "|",
        ),
      ])
        expect(output).toContain(value);
    },
  );
  it("does not invent payment or confirmation claims", () => {
    const output = text(HotelVoucherPdf({ document }));
    expect(output).not.toContain("Estado de pago");
    expect(output).not.toContain("Confirmación del proveedor");
  });
  it("rejects invalid generations before rendering", async () => {
    const render = vi.fn();
    const invalid = structuredClone(document);
    invalid.data.property.providerUrl = "http://unsafe.test";
    const result = await renderHotelVoucher(invalid, render);
    expect(result).toMatchObject({
      ok: false,
      errors: [{ path: "data.property.providerUrl", code: "invalid_url" }],
    });
    expect(render).not.toHaveBeenCalled();
  });
  it.each([4194304, 4194305])("enforces PDF output bound %s", async (bytes) => {
    const render = vi.fn().mockResolvedValue(Buffer.alloc(bytes));
    if (bytes === 4194304)
      expect(await renderHotelVoucher(document, render)).toMatchObject({
        ok: true,
      });
    else
      await expect(
        renderHotelVoucher(document, render).then((result) => result.ok),
      ).rejects.toThrow("DOCUMENT_PDF_TOO_LARGE");
  });
});

it("passes locally generated QR bytes for the supplied optional URL to the template", async () => {
  const render = vi.fn().mockResolvedValue(Buffer.from("%PDF-test"));
  await renderHotelVoucher(document, render);
  const images = render.mock.calls[0][0].props.qrImages;
  const url = document.data.property.locationUrl;
  expect(images[url!].subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
});
it("renders a valid oversized QR destination as clickable-only without failing PDF generation", async () => {
  const url = "https://example.com/" + "é".repeat(1000);
  const input = {
    ...document,
    data: {
      ...document.data,
      property: { ...document.data.property, locationUrl: url },
    },
  };
  const result = await renderHotelVoucher(input);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
});
