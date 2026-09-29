import { PdfRichText } from "./PdfRichText";
import { Text, View } from "@react-pdf/renderer";
import { colors, pdfStyles as s } from "./pdfStyles";
interface Props {
  number: number;
  title: string;
  description: string;
  time?: string;
  date?: string;
  timeLabel?: string;
}
export function PdfItineraryCard({
  number,
  title,
  description,
  time,
  date,
  timeLabel,
}: Props) {
  return (
    <View style={[s.card, { marginBottom: 9, padding: 11 }]}>
      <View
        minPresenceAhead={40}
        style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}
      >
        <Text
          style={{
            backgroundColor: colors.pale,
            borderRadius: 12,
            color: colors.cyan,
            fontSize: 8,
            fontWeight: 700,
            height: 22,
            paddingTop: 5,
            textAlign: "center",
            width: 22,
          }}
        >
          {number}
        </Text>
        <Text style={{ flex: 1, fontSize: 10, fontWeight: 700, paddingTop: 2 }}>
          {title}
        </Text>
        {(time || date) && (
          <View style={{ maxWidth: 120, textAlign: "right" }}>
            {date && <Text style={s.label}>{date}</Text>}
            {time && (
              <Text style={s.label}>
                {timeLabel
                  ? `${timeLabel}
`
                  : ""}
                {time}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={{ paddingLeft: 30 }}>
        <PdfRichText>{description}</PdfRichText>
      </View>
    </View>
  );
}
