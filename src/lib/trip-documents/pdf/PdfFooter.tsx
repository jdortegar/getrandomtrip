import { Text, View } from "@react-pdf/renderer";
import { pdfStyles as s } from "./pdfStyles";
interface Props {
  label: string;
  pagination: string;
  farewell?: string;
}
export function PdfFooter({ label, pagination, farewell }: Props) {
  return (
    <View
      fixed
      render={({
        pageNumber,
        totalPages,
      }: {
        pageNumber: number;
        totalPages?: number;
      }) => (
        <Text
          style={{
            fontSize: 6.5,
            lineHeight: 1.3,
            textAlign: farewell ? "center" : "left",
          }}
        >{`${farewell ? `${farewell}\n` : ""}${label} · Randomtrip\n${pagination} | ${pageNumber} / ${totalPages}`}</Text>
      )}
      style={[s.footer, { bottom: 8, height: 27 }]}
    />
  );
}
