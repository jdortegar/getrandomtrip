import type { HotelVoucherPdfCopy } from "@/lib/types/dictionary";
import type { VoucherDetails, VoucherProvider } from "@/lib/types/VoucherData";
import type { PdfDetailRow } from "./PdfDetailsCard";
import { pdfDate } from "./pdfStyles";
export function reservationRows(
  data: VoucherDetails,
  copy: HotelVoucherPdfCopy,
  locale: string,
): PdfDetailRow[] {
  return [
    { label: copy.holder, value: data.holder },
    { label: copy.payment, value: data.paymentWording },
    {
      label: copy.issued,
      value: data.issueDate && pdfDate(data.issueDate, locale),
    },
  ];
}
export function providerRows(
  provider: VoucherProvider,
  country: string,
  copy: HotelVoucherPdfCopy,
): PdfDetailRow[] {
  return [
    { label: copy.locality, value: provider.locality },
    { label: copy.address, value: provider.address, url: provider.locationUrl },
    {
      label: provider.region ? copy.region : copy.country,
      value: provider.region ? `${provider.region} · ${country}` : country,
    },
    { label: copy.contact, value: provider.contact },
    { label: copy.email, value: provider.email },
  ];
}
