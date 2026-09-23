import type { DocumentMetadata } from "@/lib/types/DocumentMetadata";
import type {
  VoucherDetails,
  VoucherItem,
  VoucherProvider,
} from "@/lib/types/VoucherData";

export interface DinnerVoucherData extends VoucherDetails {
  guests: string;
  restaurant: VoucherProvider;
  date: string;
  time: string;
  service: string;
  menuItems: VoucherItem[];
  conditions?: string;
}

export interface DinnerVoucherDocument extends DocumentMetadata {
  template: "dinner-voucher";
  templateVersion: 1;
  data: DinnerVoucherData;
}
