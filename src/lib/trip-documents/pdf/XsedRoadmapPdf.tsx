import { Document, Page, View } from "@react-pdf/renderer";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { PdfHeader } from "./PdfHeader";
import { PdfSummaryCards } from "./PdfSummaryCards";
import { PdfSectionTitle } from "./PdfSectionTitle";
import { PdfItineraryCard } from "./PdfItineraryCard";
import { PdfMapPanel } from "./PdfMapPanel";
import { PdfFooter } from "./PdfFooter";
import { pdfDate, pdfStyles as s } from "./pdfStyles";
interface Props {
  document: XsedRoadmapDocument;
  logo?: Buffer;
  qrImages?: Record<string, Buffer>;
}
export function XsedRoadmapPdf({ document, logo }: Props) {
  const { data, locale } = document;
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.xsedRoadmapPdf;
  const common = dictionary.hotelVoucherPdf;
  const layout = dictionary.pdfLayout;
  return (
    <Document language={locale} title={document.label}>
      <Page size="A4" style={s.page}>
        <PdfHeader
          eyebrow={layout.itineraryEyebrow}
          logo={logo}
          reference={data.reservationReference}
          referenceLabel={common.reference}
          roadmap
          route={`${data.origin} - ${data.destination}`}
          status={layout.roadmap}
          subtitle={`${data.origin} - ${data.destination} · ${document.country}`}
          title={layout.xsedTitle}
          xsed={layout.xsedTagline}
        />
        <PdfSummaryCards
          cards={[
            {
              label: layout.scheduledDate,
              value: pdfDate(data.departureDate, locale, true),
              detail: copy.origin + ": " + data.origin,
            },
            {
              label: copy.departureTime,
              value: data.departureTime,
              detail: copy.destination + ": " + data.destination,
            },
            { label: copy.drivingDuration, value: data.drivingDuration },
          ]}
        />
        <View style={{ marginTop: 12, marginBottom: 2 }}>
          <PdfSectionTitle icon="car">{layout.itinerary}</PdfSectionTitle>
        </View>
        {data.stops.map((item, index) => (
          <PdfItineraryCard
            date={item.date && pdfDate(item.date, locale)}
            description={item.directions}
            key={item.id}
            number={index + 1}
            time={item.time}
            title={item.title}
          />
        ))}
        <PdfMapPanel
          button={layout.mapButton}
          description={layout.mapDescription}
          farewell={layout.farewell}
          title={layout.mapTitle}
          unavailable={layout.mapUnavailable}
          url={data.mapUrl}
        />
        <PdfFooter
          label={`${copy.title} · ${data.origin} - ${data.destination} · ${document.label}`}
          pagination={common.preview}
        />
      </Page>
    </Document>
  );
}
