import { PdfQrLink } from "./PdfQrLink";
import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const styles = StyleSheet.create({
  page: {
    color: "#17333d",
    fontFamily: "Barlow",
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
  logo: { height: 27, width: 27 },
  eyebrow: {
    width: "47%",
    color: "#2999bc",
    fontSize: 9,
    marginBottom: 6,
  },
  title: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 22,
    lineHeight: 1.25,
    marginBottom: 8,
  },
  dates: { flexDirection: "row", gap: 14, marginBottom: 16 },
  card: { border: "1 solid #d4e6ec", borderRadius: 8, flex: 1, padding: 14 },
  row: {
    width: "47%",
    borderBottom: "1 solid #d4e6ec",
    marginBottom: 8,
    paddingBottom: 8,
  },
  label: { color: "#237f9e", fontSize: 9, marginBottom: 3 },
  section: { marginBottom: 10 },
  inclusion: {
    borderLeft: "2 solid #2999bc",
    marginBottom: 9,
    paddingLeft: 10,
  },
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

interface HotelVoucherPdfProps {
  document: HotelVoucherDocument;
  logo?: Buffer;
  qrImages?: Record<string, Buffer>;
}
export function HotelVoucherPdf({
  document,
  logo,
  qrImages,
}: HotelVoucherPdfProps) {
  const { data, locale } = document;
  const copy = (locale === "en" ? en : es).hotelVoucherPdf;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
  const details = [
    [copy.holder, data.holder],
    [copy.guests, data.guests],
    [copy.country, document.country],
    [copy.address, data.property.address],
    [copy.contact, data.property.contact],
    [copy.reference, data.reservationReference],
    [copy.issued, data.issueDate && date(data.issueDate)],
    [copy.payment, data.paymentWording],
    [copy.confirmation, data.supplierConfirmation],
  ];
  return (
    <Document language={locale} title={document.label}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {logo && (
              <PdfImage
                src={{ data: logo, format: "png" }}
                style={styles.logo}
              />
            )}
            <Text
              style={{ fontFamily: "Barlow", fontWeight: 700, fontSize: 16 }}
            >
              RANDOMTRIP
            </Text>
          </View>
          <Text style={styles.eyebrow}>{copy.title}</Text>
          <Text style={styles.title}>{data.property.name}</Text>
          <Text>{document.label}</Text>
        </View>
        <View style={styles.dates} wrap={false}>
          {[
            [copy.checkIn, data.checkInDate, data.checkInTime],
            [copy.checkOut, data.checkOutDate, data.checkOutTime],
          ].map(([label, day, time]) => (
            <View key={label} style={styles.card}>
              <Text style={styles.label}>{label}</Text>
              <Text>{date(day!)}</Text>
              {time && <Text>{time}</Text>}
            </View>
          ))}
        </View>
        <View
          style={[
            styles.section,
            { flexDirection: "row", flexWrap: "wrap", gap: 6 },
          ]}
        >
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text>{value}</Text>
              </View>
            ))}
          {data.property.locationUrl && (
            <PdfQrLink images={qrImages} src={data.property.locationUrl}>
              {copy.location}
            </PdfQrLink>
          )}
          {data.property.providerUrl && (
            <PdfQrLink images={qrImages} src={data.property.providerUrl}>
              {copy.provider}
            </PdfQrLink>
          )}
        </View>
        {data.inclusions.length > 0 && (
          <View style={styles.section}>
            <Text minPresenceAhead={30} style={styles.label}>
              {copy.inclusions}
            </Text>
            {data.inclusions.map((item) => (
              <View key={item.id} style={styles.inclusion}>
                <Text style={{ fontFamily: "Barlow", fontWeight: 700 }}>
                  {item.title}
                </Text>
                {item.description && <Text>{item.description}</Text>}
              </View>
            ))}
          </View>
        )}
        {data.instructions && (
          <View style={styles.section}>
            <Text minPresenceAhead={30} style={styles.label}>
              {copy.instructions}
            </Text>
            <Text>{data.instructions}</Text>
          </View>
        )}
        <View fixed style={styles.footer}>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${copy.preview} | ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
