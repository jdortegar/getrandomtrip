import { PdfQrLink } from "./PdfQrLink";
import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const styles = StyleSheet.create({
  page: {
    color: "#17333d",
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 28,
    paddingBottom: 45,
  },
  header: {
    backgroundColor: "#17333d",
    color: "white",
    margin: -28,
    marginBottom: 18,
    padding: 24,
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    lineHeight: 1.25,
    marginBottom: 8,
  },
  label: { color: "#237f9e", fontSize: 9, marginBottom: 4 },
  row: {
    borderBottom: "1 solid #d4e6ec",
    marginBottom: 8,
    paddingBottom: 8,
    width: "47%",
  },
  item: { borderLeft: "2 solid #2999bc", marginBottom: 9, paddingLeft: 10 },
  footer: {
    bottom: 22,
    color: "#237f9e",
    fontSize: 8,
    height: 18,
    left: 32,
    position: "absolute",
    right: 32,
  },
});
interface ExperienceRoadmapPdfProps {
  document: ExperienceRoadmapDocument;
  logo?: Buffer;
  qrImages?: Record<string, Buffer>;
}
export function ExperienceRoadmapPdf({
  document,
  logo,
  qrImages,
}: ExperienceRoadmapPdfProps) {
  const { data, locale } = document;
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.experienceRoadmapPdf;
  const common = dictionary.hotelVoucherPdf;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
  const details = [
    [copy.origin, data.origin],
    [copy.destination, data.destination],
    [copy.startDate, date(data.startDate)],
    [copy.endDate, date(data.endDate)],
    [copy.duration, data.duration],
    [common.country, document.country],
  ];
  return (
    <Document language={locale} title={document.label}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {logo && (
              <PdfImage
                src={{ data: logo, format: "png" }}
                style={{ height: 27, width: 27 }}
              />
            )}
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 16 }}>
              RANDOMTRIP
            </Text>
          </View>
          <Text style={{ color: "#2999bc", fontSize: 9, marginBottom: 6 }}>
            {copy.title}
          </Text>
          <Text style={styles.title}>{data.heading}</Text>
          <Text>{document.label}</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text>{value}</Text>
              </View>
            ))}
        </View>
        <Text minPresenceAhead={40} style={styles.label}>
          {copy.activities}
        </Text>
        {data.activities.map((item, index) => (
          <View key={item.id} style={styles.item}>
            <Text orphans={4} widows={2}>
              <Text
                style={{ fontFamily: "Helvetica-Bold" }}
              >{`${index + 1}. ${item.title}`}</Text>
              {item.date ? `\n${copy.date}: ${date(item.date)}` : ""}
              {item.time ? `\n${copy.time}: ${item.time}` : ""}
              {`\n${item.description}`}
            </Text>
          </View>
        ))}
        {data.mapUrl && (
          <PdfQrLink images={qrImages} src={data.mapUrl}>
            {copy.map}
          </PdfQrLink>
        )}
        <View fixed style={styles.footer}>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${common.preview} | ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
