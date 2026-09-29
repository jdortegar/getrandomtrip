import { Text, View } from "@react-pdf/renderer";
import { PdfIcon } from "./PdfIcon";
import { PdfSectionTitle } from "./PdfSectionTitle";
import { colors, pdfStyles as s } from "./pdfStyles";
interface Props {
  title: string;
  children: string;
}
export function PdfLocalActivities({ title, children }: Props) {
  return (
    <View style={s.card}>
      <PdfSectionTitle>{title}</PdfSectionTitle>
      {children
        .split("\n")
        .filter(Boolean)
        .map((line, index) => (
          <View
            key={index}
            style={{ flexDirection: "row", gap: 7, marginBottom: 6 }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.cyan,
                borderRadius: 8,
                height: 14,
                justifyContent: "center",
                width: 14,
              }}
            >
              <PdfIcon color="white" name="check" size={9} />
            </View>
            <Text
              orphans={2}
              style={{
                borderBottom: `0.6 solid ${colors.border}`,
                flex: 1,
                fontSize: 7.3,
                paddingBottom: 7,
              }}
              widows={2}
            >
              {line}
            </Text>
          </View>
        ))}
    </View>
  );
}
