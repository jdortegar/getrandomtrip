import { Document, Page, View } from "@react-pdf/renderer";
import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { PdfHeader } from "./PdfHeader";
import { PdfSummaryCards } from "./PdfSummaryCards";
import { PdfDetailsCard } from "./PdfDetailsCard";
import { PdfNumberedItems } from "./PdfNumberedItems";
import { PdfPolicyPanel } from "./PdfPolicyPanel";
import { PdfVoucherLinks } from "./PdfVoucherLinks";
import { PdfFooter } from "./PdfFooter";
import { pdfDate, pdfStyles as s } from "./pdfStyles";
import { providerRows, reservationRows } from "./pdfVoucherRows";
import { estimatedPdfLines } from "./pdfTextLayout";
interface Props {
  document: DinnerVoucherDocument;
  logo?: Buffer;
  qrImages?: Record<string, Buffer>;
}
export function DinnerVoucherPdf({ document, logo, qrImages }: Props) {
  const { data, locale } = document;
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.dinnerVoucherPdf;
  const common = dictionary.hotelVoucherPdf;
  const layout = dictionary.pdfLayout;
  const details = reservationRows(data, common, locale);
  details.splice(
    1,
    0,
    { label: copy.guests, value: data.guests },
    { label: copy.service, value: data.service },
  );
  const compactMenu =
    data.menuItems.length <= 6 &&
    data.menuItems.reduce(
      (total, item) =>
        total +
        estimatedPdfLines(item.title, 40) +
        estimatedPdfLines(item.description || "", 65) +
        3,
      0,
    ) <= 24;
  const hasLinks = Boolean(
    data.supplierConfirmationUrl ||
    data.restaurant.providerUrl ||
    data.restaurant.locationUrl,
  );
  return (
    <Document language={locale} title={document.label}>
      <Page size="A4" style={s.page}>
        <PdfHeader
          eyebrow={layout.dinnerTitle}
          icon="dinner"
          logo={logo}
          reference={data.reservationReference}
          referenceLabel={common.reference}
          status={data.supplierConfirmation || layout.voucher}
          subtitle={[data.restaurant.locality, document.label]
            .filter(Boolean)
            .join(" · ")}
          title={data.restaurant.name}
        />
        <PdfSummaryCards
          cards={[
            {
              label: layout.dinnerDate,
              value: pdfDate(data.date, locale, true),
              detail: data.service,
            },
            { label: layout.dinnerTime, value: data.time, detail: copy.time },
          ]}
        />
        <View style={s.row}>
          <PdfDetailsCard rows={details} title={layout.reservationDetails} />
          <PdfDetailsCard
            icon="pin"
            rows={providerRows(data.restaurant, document.country, common)}
            title={layout.locationContact}
          />
        </View>
        {(data.menuItems.length > 0 || hasLinks) && (
          <View
            style={[s.row, { flexDirection: compactMenu ? "row" : "column" }]}
            wrap={!compactMenu}
          >
            {data.menuItems.length > 0 && (
              <View style={compactMenu ? { flex: 1.8 } : { width: "100%" }}>
                <PdfNumberedItems items={data.menuItems} title={copy.menu} />
              </View>
            )}
            {hasLinks && (
              <View
                style={[
                  s.card,
                  compactMenu
                    ? { flex: 1, justifyContent: "center" }
                    : { alignSelf: "flex-end", width: 175 },
                ]}
                wrap={false}
              >
                <PdfVoucherLinks
                  confirmationHint={layout.dinnerQrHint}
                  copy={common}
                  data={data}
                  images={qrImages}
                  layout={layout}
                  provider={data.restaurant}
                  providerLabel={copy.provider}
                />
              </View>
            )}
          </View>
        )}
        <PdfPolicyPanel
          paragraphs={[layout.dinnerGuidance]}
          title={layout.dinnerPresentation}
          warning
          tone="dark"
        />
        <PdfPolicyPanel
          dividers
          paragraphs={[data.conditions || layout.dinnerTerms]}
          title={layout.terms}
        />
        <PdfFooter
          farewell={layout.dinnerFarewell}
          label={`${data.restaurant.name} · ${data.restaurant.locality || document.label}`}
          pagination={common.preview}
        />
      </Page>
    </Document>
  );
}
