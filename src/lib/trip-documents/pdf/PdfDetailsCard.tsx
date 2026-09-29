import { Link, Text, View } from "@react-pdf/renderer";
import { PdfSectionTitle } from "./PdfSectionTitle";
import type { PdfIconProps } from "./PdfIcon";
import { colors, pdfStyles as s } from "./pdfStyles";
export interface PdfDetailRow {
  label: string;
  value?: string;
  url?: string;
}
interface Props {
  title: string;
  rows: PdfDetailRow[];
  icon?: PdfIconProps["name"];
}
export function PdfDetailsCard({ title, rows, icon = "calendar" }: Props) {
  return (
    <View style={[s.card, { flex: 1 }]}>
      <PdfSectionTitle icon={icon}>{title}</PdfSectionTitle>
      {rows
        .filter((row) => row.value)
        .map((row) => (
          <View
            key={row.label}
            style={{
              alignItems: "center",
              borderBottom: `0.6 solid ${colors.border}`,
              flexDirection: "row",
              gap: 5,
              minHeight: 23,
              paddingVertical: 6,
            }}
          >
            <Text style={[s.label, { flexBasis: "39%", fontSize: 6.5 }]}>
              {row.label}
            </Text>
            {row.url ? (
              <Link
                src={row.url}
                style={{
                  color: colors.ink,
                  flex: 1,
                  fontSize: 8,
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                {row.value}
              </Link>
            ) : (
              <Text
                style={{
                  flex: 1,
                  fontSize: 8,
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                {row.value}
              </Text>
            )}
          </View>
        ))}
    </View>
  );
}
