import type { DocumentMetadata } from "@/lib/types/DocumentMetadata";
import type {
  VoucherDetails,
  VoucherItem,
  VoucherProvider,
} from "@/lib/types/VoucherData";

export interface ActivityVoucherData extends VoucherDetails {
  participants: string;
  provider: VoucherProvider;
  date: string;
  time: string;
  program: VoucherItem[];
  inclusions?: VoucherItem[];
  recommendations?: string;
}

export interface ActivityVoucherDocument extends DocumentMetadata {
  template: "activity-voucher";
  templateVersion: 1;
  data: ActivityVoucherData;
}
