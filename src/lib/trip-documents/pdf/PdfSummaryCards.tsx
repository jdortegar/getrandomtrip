import { Text, View } from "@react-pdf/renderer";
import { PdfIcon } from "./PdfIcon";
import { colors, pdfStyles as s } from "./pdfStyles";
interface Props {
  cards: { label: string; value: string; detail?: string }[];
  arrow?: boolean;
}
export function PdfSummaryCards({ cards, arrow }: Props) {
  return (
    <View style={[s.row, { gap: arrow ? 0 : 16 }]} wrap={false}>
      {cards.map((card, index) => (
        <View key={card.label} style={{ flex: 1, flexDirection: "row" }}>
          {arrow && index > 0 && (
            <View style={{ width: 33, padding: 9 }}>
              <PdfIcon name="arrow" size={15} />
            </View>
          )}
          <View style={[s.card, { flex: 1, minHeight: 67, padding: 11 }]}>
            <Text style={[s.label, { marginBottom: 8 }]}>{card.label}</Text>
            <View
              style={{ borderLeft: `2.5 solid ${colors.cyan}`, paddingLeft: 8 }}
            >
              <Text
                style={{
                  fontSize: cards.length === 3 ? 9 : 10.5,
                  fontWeight: 700,
                }}
              >
                {card.value}
              </Text>
              {card.detail && (
                <Text style={[s.muted, { marginTop: 4 }]}>{card.detail}</Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
