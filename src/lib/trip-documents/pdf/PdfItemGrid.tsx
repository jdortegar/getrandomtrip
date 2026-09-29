import { Text, View } from "@react-pdf/renderer";
import type { VoucherItem } from "@/lib/types/VoucherData";
import { PdfIcon, type PdfIconProps } from "./PdfIcon";
import { PdfSectionTitle } from "./PdfSectionTitle";
import { colors, pdfStyles as s } from "./pdfStyles";
import { estimatedPdfLines } from "./pdfTextLayout";
interface Props {
  items: VoucherItem[];
  title: string;
}
function itemIcon(title: string): PdfIconProps["name"] {
  if (/breakfast|desayuno|coffee|café/i.test(title)) return "coffee";
  if (/internet|wi.?fi/i.test(title)) return "wifi";
  if (/parking|estacionamiento/i.test(title)) return "parking";
  if (/water|agua|sauna|pool|piscina/i.test(title)) return "water";
  if (/massage|masaje/i.test(title)) return "massage";
  if (/lunch|almuerzo|merienda|food/i.test(title)) return "food";
  if (/towel|toalla|blancos|equipment|equipamiento/i.test(title))
    return "towel";
  if (/facilities|instalaciones/i.test(title)) return "puzzle";
  return "sparkle";
}
export function PdfItemGrid({ items, title }: Props) {
  if (!items.length) return null;
  const compact = items.every(
    (item) =>
      estimatedPdfLines(item.title, 30) +
        estimatedPdfLines(item.description || "", 45) <=
      8,
  );
  return (
    <View style={[s.card, s.section]}>
      <PdfSectionTitle>{title}</PdfSectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              s.card,
              {
                flexDirection: "row",
                gap: 8,
                minHeight: 40,
                padding: 8,
                width: compact ? "49%" : "100%",
              },
            ]}
          >
            <View
              style={{ ...s.iconPuck, borderRadius: 15, height: 26, width: 26 }}
            >
              <PdfIcon name={itemIcon(item.title)} size={15} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                minPresenceAhead={16}
                style={{ fontWeight: 700, marginBottom: 4 }}
              >
                {item.title}
              </Text>
              {item.description && (
                <Text style={s.muted}>{item.description}</Text>
              )}
            </View>
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.cyan,
                borderRadius: 9,
                height: 15,
                justifyContent: "center",
                width: 15,
              }}
            >
              <PdfIcon color="white" name="check" size={9} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
