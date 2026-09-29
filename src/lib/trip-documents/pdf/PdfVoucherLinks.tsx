import { Link, View } from "@react-pdf/renderer";
import type {
  HotelVoucherPdfCopy,
  PdfLayoutCopy,
} from "@/lib/types/dictionary";
import type { VoucherDetails, VoucherProvider } from "@/lib/types/VoucherData";
import { PdfLinkPanel } from "./PdfLinkPanel";
import { colors } from "./pdfStyles";
interface Props {
  data: VoucherDetails;
  provider: VoucherProvider;
  copy: HotelVoucherPdfCopy;
  layout: PdfLayoutCopy;
  providerLabel: string;
  images?: Record<string, Buffer>;
  confirmationHint: string;
}
export function PdfVoucherLinks({
  data,
  provider,
  copy,
  layout,
  providerLabel,
  images,
  confirmationHint,
}: Props) {
  const links = [
    { url: data.supplierConfirmationUrl, label: copy.confirmationUrl },
    { url: provider.providerUrl, label: providerLabel },
    { url: provider.locationUrl, label: copy.location },
  ].filter((link): link is { url: string; label: string } => Boolean(link.url));
  if (!links.length) return null;
  return (
    <View style={{ flexShrink: 0 }} wrap={false}>
      <PdfLinkPanel
        hint={data.supplierConfirmationUrl ? confirmationHint : layout.qrHint}
        linkHint={layout.linkHint}
        images={images}
        label={links[0].label}
        qrLabel={layout.qr}
        secondaryLabel={links[1]?.label ?? ""}
        secondaryUrl={
          links[1]?.url === provider.locationUrl ? undefined : links[1]?.url
        }
        url={links[0].url}
      />
      {links.slice(2).map((link) => (
        <Link
          key={link.url}
          src={link.url}
          style={{ color: colors.ink, fontSize: 7, marginTop: 6 }}
        >
          {link.label}
        </Link>
      ))}
    </View>
  );
}
