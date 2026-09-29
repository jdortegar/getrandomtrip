import { Document, Page, View } from "@react-pdf/renderer";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
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
  document: ExperienceRoadmapDocument;
  logo?: Buffer;
  qrImages?: Record<string, Buffer>;
}
export function ExperienceRoadmapPdf({ document, logo }: Props) {
  const { data, locale } = document;
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.experienceRoadmapPdf;
  const common = dictionary.hotelVoucherPdf;
  const layout = dictionary.pdfLayout;
  return (
    <Document language={locale} title={document.label}>
      <Page size="A4" style={s.page}>
        <PdfHeader
          eyebrow={layout.itineraryEyebrow}
          experience={data.experienceLabel}
          experienceLabel={layout.experience}
          getLost={layout.getLost}
          logo={logo}
          reference={data.reservationReference}
          referenceLabel={common.reference}
          roadmap
          route={`${data.origin} - ${data.destination}`}
          status={layout.roadmap}
          subtitle={`${data.origin} - ${data.destination} · ${document.country}`}
          title={data.heading}
          traveler={data.travelerLabel}
        />
        <PdfSummaryCards
          cards={[
            {
              label: copy.startDate,
              value: pdfDate(data.startDate, locale, true),
              detail: copy.origin + ": " + data.origin,
            },
            {
              label: copy.endDate,
              value: pdfDate(data.endDate, locale, true),
              detail: copy.destination + ": " + data.destination,
            },
            { label: copy.duration, value: data.duration },
          ]}
        />
        <View style={{ marginTop: 12, marginBottom: 2 }}>
          <PdfSectionTitle icon="car">{copy.activities}</PdfSectionTitle>
        </View>
        {data.activities.map((item, index) => (
          <PdfItineraryCard
            date={item.date && pdfDate(item.date, locale)}
            description={item.description}
            key={item.id}
            number={index + 1}
            time={item.time}
            timeLabel={layout.suggestedTimes}
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
