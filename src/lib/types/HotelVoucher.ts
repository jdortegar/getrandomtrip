import type { DocumentMetadata } from "@/lib/types/DocumentMetadata";
import type {
  VoucherDetails,
  VoucherItem,
  VoucherProvider,
} from "@/lib/types/VoucherData";

export interface HotelVoucherData extends VoucherDetails {
  holder: string;
  guests: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  property: VoucherProvider;
  inclusions: VoucherItem[];
  instructions?: string;
}

export interface HotelVoucherDocument extends DocumentMetadata {
  template: "hotel-voucher";
  templateVersion: 1;
  data: HotelVoucherData;
}
