// @vitest-environment node
import { isValidElement, type ReactNode } from "react";
import { expect, it } from "vitest";
import { HotelVoucherPdf } from "../HotelVoucherPdf";
import { DinnerVoucherPdf } from "../DinnerVoucherPdf";
import { ActivityVoucherPdf } from "../ActivityVoucherPdf";
import { XsedRoadmapPdf } from "../XsedRoadmapPdf";
import { ExperienceRoadmapPdf } from "../ExperienceRoadmapPdf";
import { parseHotelVoucher } from "../../parsers/hotelVoucher";

function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (typeof node.type === "function")
      return text((node.type as (props: object) => ReactNode)(node.props));
    return text(node.props.children);
  }
  return typeof node === "string" || typeof node === "number"
    ? String(node)
    : "";
}
const metadata = {
  templateVersion: 1 as const,
  locale: "es" as const,
  country: "AR",
  label: "Offline example",
};
const provider = {
  name: "Example venue",
  address: "Example street",
  providerUrl: "https://example.com",
};
const hotel = {
  ...metadata,
  template: "hotel-voucher" as const,
  data: {
    holder: "Example traveler",
    guests: "2",
    property: provider,
    checkInDate: "2026-08-15",
    checkOutDate: "2026-08-16",
    inclusions: [],
    localActivities: "A walk around the town",
  },
};
it("restores hotel reservation/contact, local-activities and check-in guidance panels", () => {
  const output = text(HotelVoucherPdf({ document: hotel }));
  for (const label of [
    "DETALLES DE LA RESERVA",
    "UBICACIÓN Y CONTACTO",
    "ENTORNO Y ACTIVIDADES LOCALES",
    "INFORMACIÓN IMPORTANTE PARA EL CHECK-IN",
    "A walk around the town",
  ])
    expect(output).toContain(label);
  expect(output).not.toContain("RESERVA CONFIRMADA");
});
it("accepts optional local activities without breaking legacy version-one hotel drafts", () => {
  expect(parseHotelVoucher(hotel, "generation").ok).toBe(true);
  const legacy = structuredClone(hotel);
  delete (legacy.data as { localActivities?: string }).localActivities;
  expect(parseHotelVoucher(legacy, "generation").ok).toBe(true);
  expect(
    parseHotelVoucher(
      { ...hotel, data: { ...hotel.data, localActivities: 1 } },
      "generation",
    ).ok,
  ).toBe(false);
});
it.each(["es", "en"] as const)(
  "restores separate localized dinner presentation and terms panels (%s)",
  (locale) => {
    const output = text(
      DinnerVoucherPdf({
        document: {
          ...metadata,
          locale,
          template: "dinner-voucher",
          data: {
            restaurant: provider,
            date: "2026-08-15",
            time: "20:30",
            guests: "2",
            service: "Dinner",
            menuItems: [],
          },
        },
      }),
    );
    expect(output).toContain(
      locale === "es"
        ? "REQUISITO OBLIGATORIO DE PRESENTACIÓN"
        : "VOUCHER PRESENTATION REQUIREMENT",
    );
    expect(output).toContain(
      locale === "es"
        ? "TÉRMINOS Y RECOMENDACIONES"
        : "TERMS AND RECOMMENDATIONS",
    );
    expect(output).not.toMatch(/15 minutos|15 minutes|Confirmed|Confirmado/);
  },
);
it("restores activity presentation and information panels without injecting SPA-only policies", () => {
  const output = text(
    ActivityVoucherPdf({
      document: {
        ...metadata,
        template: "activity-voucher",
        data: {
          provider,
          date: "2026-08-15",
          time: "10:00",
          participants: "2",
          program: [{ id: "walk", title: "Cultural walk" }],
        },
      },
    }),
  );
  expect(output).toContain("PRESENTACIÓN DEL VOUCHER");
  expect(output).toContain("INFORMACIÓN Y RECOMENDACIONES");
  expect(output).not.toMatch(/traje de baño|masajes|Spa|SPA/);
});
it("restores both roadmap map panels and confines XSED lockup to XSED", () => {
  const shared = {
    origin: "Origin",
    destination: "Destination",
    mapUrl: "https://example.com/map",
  };
  const xsed = text(
    XsedRoadmapPdf({
      document: {
        ...metadata,
        template: "xsed-roadmap",
        data: {
          ...shared,
          departureDate: "2026-08-15",
          departureTime: "10:00",
          drivingDuration: "2 hours",
          stops: [{ id: "one", title: "Stop", directions: "Keep going" }],
        },
      },
    }),
  );
  const experience = text(
    ExperienceRoadmapPdf({
      document: {
        ...metadata,
        template: "experience-roadmap",
        data: {
          ...shared,
          startDate: "2026-08-15",
          endDate: "2026-08-16",
          duration: "2 hours",
          heading: "Journey",
          activities: [{ id: "one", title: "Walk", description: "Explore" }],
        },
      },
    }),
  );
  for (const output of [xsed, experience])
    for (const label of [
      "MAPA DEL RECORRIDO EN TIEMPO REAL",
      "VER MAPA INTERACTIVO",
      "Buen viaje",
    ])
      expect(output).toContain(label);
  expect(xsed).toContain("XSED");
  expect(experience).not.toContain("XSED");
});

it("uses truthful clickable-only wording when QR bytes are deliberately absent", async () => {
  const { PdfLinkPanel } = await import("../PdfLinkPanel");
  const output = text(
    PdfLinkPanel({
      url: "https://example.com/" + "x".repeat(2100),
      label: "Provider website",
      secondaryLabel: "",
      qrLabel: "QR code",
      hint: "Scan to open",
      linkHint: "Open the link",
    }),
  );
  expect(output).toContain("Open the link");
  expect(output).not.toContain("Scan to open");
  expect(output).not.toContain("QR code");
});
it("does not turn free-text supplier wording into a verified green status", async () => {
  const { PdfHeader } = await import("../PdfHeader");
  function styles(node: ReactNode): string {
    if (Array.isArray(node)) return node.map(styles).join(" ");
    if (!isValidElement<{ children?: ReactNode; style?: unknown }>(node))
      return "";
    return JSON.stringify(node.props.style) + styles(node.props.children);
  }
  const props = {
    eyebrow: "Voucher",
    title: "Example",
    status: "TEST / NOT CONFIRMED",
    referenceLabel: "Reference",
  };
  expect(styles(PdfHeader(props))).not.toContain("#174a42");
  expect(
    styles(PdfHeader({ ...props, status: "ROADMAP", roadmap: true })),
  ).toContain("#174a42");
});
