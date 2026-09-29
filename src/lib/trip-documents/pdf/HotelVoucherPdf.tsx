import { Document, Page, View } from "@react-pdf/renderer";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { PdfLocalActivities } from "./PdfLocalActivities";
import { PdfHeader } from "./PdfHeader";
import { PdfSummaryCards } from "./PdfSummaryCards";
import { PdfDetailsCard } from "./PdfDetailsCard";
import { PdfItemGrid } from "./PdfItemGrid";
import { PdfPolicyPanel } from "./PdfPolicyPanel";
import { PdfVoucherLinks } from "./PdfVoucherLinks";
import { PdfFooter } from "./PdfFooter";
import { pdfDate, pdfStyles as s } from "./pdfStyles";
import { providerRows, reservationRows } from "./pdfVoucherRows";
import { compactPdfPolicy } from "./pdfTextLayout";
interface Props {
  document: HotelVoucherDocument;
  logo?: Buffer;
  qrImages?: Record<string, Buffer>;
}
export function HotelVoucherPdf({ document, logo, qrImages }: Props) {
  const { data, locale } = document;
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.hotelVoucherPdf;
  const layout = dictionary.pdfLayout;
  const nights = Math.round(
    (Date.parse(data.checkOutDate) - Date.parse(data.checkInDate)) / 86400000,
  );
  const details = reservationRows(data, copy, locale);
  details.splice(
    1,
    0,
    { label: copy.guests, value: data.guests },
    {
      label: layout.duration,
      value: layout.nights.replace("{count}", String(nights)),
    },
  );
  const compactActivities = compactPdfPolicy(data.localActivities || "");
  const hasLinks = Boolean(
    data.supplierConfirmationUrl ||
    data.property.providerUrl ||
    data.property.locationUrl,
  );
  return (
    <Document language={locale} title={document.label}>
      <Page size="A4" style={s.page}>
        <PdfHeader
          eyebrow={layout.hotelTitle}
          icon="bed"
          logo={logo}
          reference={data.reservationReference}
          referenceLabel={copy.reference}
          status={data.supplierConfirmation || layout.voucher}
          subtitle={[data.property.locality, document.label]
            .filter(Boolean)
            .join(" · ")}
          title={data.property.name}
        />
        <PdfSummaryCards
          arrow
          cards={[
            {
              label: layout.checkIn,
              value: pdfDate(data.checkInDate, locale, true),
              detail:
                data.checkInTime &&
                layout.fromTime.replace("{time}", data.checkInTime),
            },
            {
              label: layout.checkOut,
              value: pdfDate(data.checkOutDate, locale, true),
              detail:
                data.checkOutTime &&
                layout.untilTime.replace("{time}", data.checkOutTime),
            },
          ]}
        />
        <View style={s.row}>
          <PdfDetailsCard rows={details} title={layout.reservationDetails} />
          <PdfDetailsCard
            icon="pin"
            rows={providerRows(data.property, document.country, copy)}
            title={layout.locationContact}
          />
        </View>
        <PdfItemGrid items={data.inclusions} title={layout.services} />
        {(data.localActivities || hasLinks) && (
          <View
            style={[
              s.row,
              { flexDirection: compactActivities ? "row" : "column" },
            ]}
            wrap={!compactActivities}
          >
            {data.localActivities && (
              <View style={compactActivities ? { flex: 2 } : { width: "100%" }}>
                <PdfLocalActivities title={layout.localActivities}>
                  {data.localActivities}
                </PdfLocalActivities>
              </View>
            )}
            {hasLinks && (
              <View
                style={[
                  s.card,
                  compactActivities
                    ? { flex: 1, justifyContent: "center" }
                    : { alignSelf: "flex-end", width: 175 },
                ]}
                wrap={false}
              >
                <PdfVoucherLinks
                  confirmationHint={layout.hotelQrHint}
                  copy={copy}
                  data={data}
                  images={qrImages}
                  layout={layout}
                  provider={data.property}
                  providerLabel={copy.provider}
                />
              </View>
            )}
          </View>
        )}
        <PdfPolicyPanel
          fullBleed
          paragraphs={[
            layout.hotelGuidance,
            layout.hotelArrival,
            layout.hotelRules,
            data.instructions || "",
          ]}
          title={layout.hotelInformation}
          tone="dark"
        />
        <PdfFooter
          label={`${data.property.name} · ${data.property.locality || document.label}`}
          pagination={copy.preview}
        />
      </Page>
    </Document>
  );
}
