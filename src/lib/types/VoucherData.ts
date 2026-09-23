export interface VoucherProvider {
  name: string;
  address: string;
  contact?: string;
  locationUrl?: string;
  providerUrl?: string;
}

export interface VoucherItem {
  id: string;
  title: string;
  description?: string;
}

export interface VoucherDetails {
  holder?: string;
  issueDate?: string;
  reservationReference?: string;
  paymentWording?: string;
  supplierConfirmation?: string;
}
