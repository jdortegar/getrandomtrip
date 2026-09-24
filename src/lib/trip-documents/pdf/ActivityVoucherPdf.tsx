import {
  Document,
  Image as PdfImage,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
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
interface ActivityVoucherPdfProps {
  document: ActivityVoucherDocument;
  logo?: Buffer;
}
export function ActivityVoucherPdf({
  document,
  logo,
}: ActivityVoucherPdfProps) {
  const { data, locale } = document;
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.activityVoucherPdf;
  const common = dictionary.hotelVoucherPdf;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
  const details = [
    [copy.date, date(data.date)],
    [copy.time, data.time],
    [copy.participants, data.participants],
    [common.holder, data.holder],
    [common.country, document.country],
    [common.address, data.provider.address],
    [common.contact, data.provider.contact],
    [common.reference, data.reservationReference],
    [common.issued, data.issueDate && date(data.issueDate)],
    [common.payment, data.paymentWording],
    [common.confirmation, data.supplierConfirmation],
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
          <Text style={styles.title}>{data.provider.name}</Text>
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
          {data.provider.locationUrl && (
            <Link src={data.provider.locationUrl}>{common.location}</Link>
          )}
          {data.provider.providerUrl && (
            <Link src={data.provider.providerUrl}>{copy.provider}</Link>
          )}
        </View>
        {[
          { label: copy.program, items: data.program },
          { label: common.inclusions, items: data.inclusions ?? [] },
        ]
          .filter((section) => section.items.length)
          .map((section) => (
            <View key={section.label} style={{ marginBottom: 10 }}>
              <Text minPresenceAhead={30} style={styles.label}>
                {section.label}
              </Text>
              {section.items.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Text
                    minPresenceAhead={20}
                    style={{ fontFamily: "Helvetica-Bold" }}
                  >
                    {item.title}
                  </Text>
                  {item.description && <Text>{item.description}</Text>}
                </View>
              ))}
            </View>
          ))}
        {data.recommendations && (
          <View>
            <Text minPresenceAhead={30} style={styles.label}>
              {copy.recommendations}
            </Text>
            <Text>{data.recommendations}</Text>
          </View>
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
