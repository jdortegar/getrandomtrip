import { Text, View } from "@react-pdf/renderer";
import { PdfSectionTitle } from "./PdfSectionTitle";
import { colors, pdfStyles as s } from "./pdfStyles";
import { compactPdfPolicy } from "./pdfTextLayout";
interface Props {
  title: string;
  paragraphs: string[];
  tone?: "dark" | "outline" | "light";
  fullBleed?: boolean;
  warning?: boolean;
  dividers?: boolean;
  emphasize?: boolean;
  fill?: boolean;
}
export function PdfPolicyPanel({
  title,
  paragraphs,
  tone = "light",
  fullBleed,
  warning,
  dividers,
  emphasize,
  fill,
}: Props) {
  return (
    <View
      wrap={!compactPdfPolicy(paragraphs.join("\n"))}
      style={[
        s.card,
        s.section,
        {
          backgroundColor: tone === "dark" ? colors.dark : "white",
          borderColor:
            tone === "outline"
              ? colors.cyan
              : tone === "dark"
                ? colors.dark
                : colors.border,
          borderWidth: tone === "outline" ? 1.5 : 1,
          ...(fill ? { flexGrow: 1, marginBottom: 0 } : {}),
          ...(fullBleed
            ? {
                borderRadius: 0,
                marginBottom: 0,
                marginHorizontal: -30,
                paddingHorizontal: 37,
              }
            : {}),
        },
      ]}
    >
      <PdfSectionTitle
        icon={tone === "outline" || warning ? "warning" : "info"}
      >
        {title}
      </PdfSectionTitle>
      {paragraphs
        .filter(Boolean)
        .flatMap((value) => value.split("\n").filter(Boolean))
        .map((paragraph, index, all) => (
          <View
            key={index}
            style={{
              borderBottomColor: tone === "dark" ? "#365660" : colors.border,
              borderBottomWidth: dividers && index < all.length - 1 ? 0.6 : 0,
              flexDirection: "row",
              gap: 8,
              marginBottom: 5,
              paddingBottom: dividers ? 3 : 0,
            }}
          >
            <Text style={{ color: colors.cyan }}>›</Text>
            <Text
              orphans={2}
              style={{
                color: tone === "dark" ? "#d7e4e9" : colors.ink,
                flex: 1,
                fontSize: emphasize ? 9 : 7.5,
                fontWeight: emphasize ? 700 : 400,
              }}
              widows={2}
            >
              {paragraph}
            </Text>
          </View>
        ))}
    </View>
  );
}
