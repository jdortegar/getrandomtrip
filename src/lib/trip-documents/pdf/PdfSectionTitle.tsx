import { Text, View } from "@react-pdf/renderer";
import { PdfIcon, type PdfIconProps } from "./PdfIcon";
import { pdfStyles as s } from "./pdfStyles";
interface Props {
  children: string;
  icon?: PdfIconProps["name"];
}
export function PdfSectionTitle({ children, icon = "sparkle" }: Props) {
  return (
    <View minPresenceAhead={20} style={s.sectionHeading} wrap={false}>
      <View style={s.iconPuck}>
        <PdfIcon name={icon} size={14} />
      </View>
      <Text style={s.label}>{children}</Text>
    </View>
  );
}
