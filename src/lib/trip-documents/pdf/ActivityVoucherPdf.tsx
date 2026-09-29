import { Document, Page, View } from "@react-pdf/renderer";
import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
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
  document: ActivityVoucherDocument;
  logo?: Buffer;
  qrImages?: Record<string, Buffer>;
}
export function ActivityVoucherPdf({ document, logo, qrImages }: Props) {
  const { data, locale } = document;
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.activityVoucherPdf;
  const common = dictionary.hotelVoucherPdf;
  const layout = dictionary.pdfLayout;
  const details = reservationRows(data, common, locale);
  details.splice(
    1,
    0,
    { label: copy.participants, value: data.participants },
    { label: copy.program, value: data.service },
  );
  const compactRecommendations = compactPdfPolicy(
    data.recommendations || layout.activityTerms,
  );
  const hasLinks = Boolean(
    data.supplierConfirmationUrl ||
    data.provider.providerUrl ||
    data.provider.locationUrl,
  );
  return (
    <Document language={locale} title={document.label}>
      <Page size="A4" style={s.page}>
        <PdfHeader
          eyebrow={layout.activityTitle}
          icon="puzzle"
          logo={logo}
          reference={data.reservationReference}
          referenceLabel={common.reference}
          status={data.supplierConfirmation || layout.voucher}
          subtitle={[data.provider.locality, document.label]
            .filter(Boolean)
            .join(" · ")}
          title={data.provider.name}
        />
        <PdfSummaryCards
          cards={[
            {
              label: layout.activityDate,
              value: pdfDate(data.date, locale, true),
            },
            {
              label: layout.activityTime,
              value: [data.time, data.endTime].filter(Boolean).join(" - "),
              detail: data.service,
            },
          ]}
        />
        <View style={s.row}>
          <PdfDetailsCard rows={details} title={layout.reservationDetails} />
          <PdfDetailsCard
            icon="pin"
            rows={providerRows(data.provider, document.country, common)}
            title={layout.locationContact}
          />
        </View>
        <PdfItemGrid
          items={data.program}
          title={data.inclusions?.length ? copy.program : layout.services}
        />
        <PdfItemGrid items={data.inclusions ?? []} title={layout.services} />
        <PdfPolicyPanel
          emphasize
          paragraphs={[layout.activityGuidance]}
          title={layout.presentation}
          tone="outline"
        />
        <View
          style={[
            s.row,
            { flexDirection: compactRecommendations ? "row" : "column" },
          ]}
          wrap={!compactRecommendations}
        >
          <View
            style={compactRecommendations ? { flex: 2.5 } : { width: "100%" }}
          >
            <PdfPolicyPanel
              dividers
              fill={compactRecommendations}
              paragraphs={[data.recommendations || layout.activityTerms]}
              title={layout.information}
              tone="dark"
            />
          </View>
          {hasLinks && (
            <View
              style={[
                s.card,
                compactRecommendations
                  ? { flex: 1, justifyContent: "center" }
                  : { alignSelf: "flex-end", width: 175 },
              ]}
              wrap={false}
            >
              <PdfVoucherLinks
                confirmationHint={layout.activityQrHint}
                copy={common}
                data={data}
                images={qrImages}
                layout={layout}
                provider={data.provider}
                providerLabel={copy.provider}
              />
            </View>
          )}
        </View>
        <PdfFooter
          farewell={layout.activityFarewell}
          label={`${data.provider.name} · ${data.provider.locality || document.label}`}
          pagination={common.preview}
        />
      </Page>
    </Document>
  );
}
