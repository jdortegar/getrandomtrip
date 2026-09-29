import { Image as PdfImage, Link, Text, View } from "@react-pdf/renderer";
import { colors, pdfStyles as s } from "./pdfStyles";
interface Props {
  url?: string;
  secondaryUrl?: string;
  label: string;
  secondaryLabel: string;
  qrLabel: string;
  hint: string;
  linkHint: string;
  images?: Record<string, Buffer>;
}
export function PdfLinkPanel({
  url,
  secondaryUrl,
  label,
  secondaryLabel,
  qrLabel,
  hint,
  linkHint,
  images,
}: Props) {
  if (!url && !secondaryUrl) return null;
  const destination = url || secondaryUrl!;
  const caption = url ? label : secondaryLabel;
  const image = images?.[destination];
  return (
    <View style={{ flexShrink: 0, justifyContent: "center" }} wrap={false}>
      <Link
        src={destination}
        style={[s.label, { marginBottom: 6, textDecoration: "none" }]}
      >
        {caption}
      </Link>
      <View
        style={{
          borderLeft: `2.5 solid ${colors.cyan}`,
          marginBottom: 8,
          paddingLeft: 7,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: 700 }}>
          {image ? qrLabel : caption}
        </Text>
        <Text style={s.muted}>{image ? hint : linkHint}</Text>
      </View>
      {image && (
        <Link
          src={destination}
          style={{ alignSelf: "center", flexShrink: 0, height: 78, width: 78 }}
        >
          <PdfImage
            src={{ data: image, format: "png" }}
            style={{ alignSelf: "center", height: 78, width: 78 }}
          />
        </Link>
      )}
      {url && secondaryUrl && secondaryUrl !== url && (
        <Link
          src={secondaryUrl}
          style={{ color: colors.ink, fontSize: 7, marginTop: 6 }}
        >
          {secondaryLabel}
        </Link>
      )}
    </View>
  );
}
