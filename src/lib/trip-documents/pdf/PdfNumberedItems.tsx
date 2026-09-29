import { Text, View } from "@react-pdf/renderer";
import type { VoucherItem } from "@/lib/types/VoucherData";
import { PdfSectionTitle } from "./PdfSectionTitle";
import { colors, pdfStyles as s } from "./pdfStyles";
interface Props {
  items: VoucherItem[];
  title: string;
}
export function PdfNumberedItems({ items, title }: Props) {
  if (!items.length) return null;
  return (
    <View style={s.card}>
      <PdfSectionTitle icon="dinner">{title}</PdfSectionTitle>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={{ flexDirection: "row", gap: 10, marginBottom: 9 }}
        >
          <Text
            style={{
              backgroundColor: colors.pale,
              borderRadius: 11,
              color: colors.cyan,
              fontWeight: 700,
              height: 22,
              paddingTop: 5,
              textAlign: "center",
              width: 22,
            }}
          >
            {index + 1}
          </Text>
          <View
            style={{
              borderBottom: `0.6 solid ${colors.border}`,
              flex: 1,
              paddingBottom: 8,
            }}
          >
            <Text
              minPresenceAhead={16}
              style={{ fontSize: 8.5, fontWeight: 700, marginBottom: 5 }}
            >
              {item.title}
            </Text>
            {item.description && (
              <Text orphans={2} style={s.muted} widows={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
