import { Link, Text, View } from "@react-pdf/renderer";
import { PdfIcon } from "./PdfIcon";
import { colors, pdfStyles as s } from "./pdfStyles";
interface Props {
  url?: string;
  title: string;
  description: string;
  button: string;
  farewell: string;
  unavailable: string;
}
export function PdfMapPanel({
  url,
  title,
  description,
  button,
  farewell,
  unavailable,
}: Props) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.dark,
          borderColor: colors.dark,
          flexDirection: "row",
          gap: 10,
          marginTop: 3,
          minHeight: 81,
          padding: 15,
        },
      ]}
      wrap={false}
    >
      <View style={{ ...s.iconPuck, backgroundColor: "#205164" }}>
        <PdfIcon name="pin" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.label, { marginBottom: 5 }]}>{title}</Text>
        <Text style={{ color: "#d7e4e9", fontSize: 7.5, marginBottom: 9 }}>
          {url ? description : unavailable}
        </Text>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {url && (
            <Link
              src={url}
              style={{
                backgroundColor: colors.cyan,
                borderRadius: 4,
                color: "white",
                fontSize: 8,
                fontWeight: 700,
                paddingHorizontal: 22,
                paddingVertical: 5,
                textDecoration: "none",
              }}
            >
              {button}
            </Link>
          )}
          <Text style={{ color: "#b9d0da", fontSize: 7 }}>{farewell}</Text>
        </View>
      </View>
    </View>
  );
}
