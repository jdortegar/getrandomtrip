import { Text, View } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";
interface Props {
  children: string;
}
/** Plain-text only: leading bullets and short colon labels, never HTML/Markdown. */
export function PdfRichText({ children }: Props) {
  return (
    <View>
      {children
        .split("\n")
        .filter(Boolean)
        .map((line, index) => {
          const bullet = /^[•]\s*/.test(line);
          const content = line.replace(/^[•]\s*/, "");
          const label = /^([^:]{1,60}:)(?:\s|$)/.exec(content)?.[1];
          return (
            <View
              key={index}
              style={{ flexDirection: "row", gap: 6, marginBottom: 3 }}
            >
              {bullet && <Text style={{ color: colors.cyan }}>•</Text>}
              <Text
                orphans={2}
                style={{ flex: 1, fontSize: 7.7, lineHeight: 1.4 }}
                widows={2}
              >
                {label ? (
                  <>
                    <Text style={{ fontWeight: 700 }}>{label}</Text>
                    {content.slice(label.length)}
                  </>
                ) : (
                  content
                )}
              </Text>
            </View>
          );
        })}
    </View>
  );
}
