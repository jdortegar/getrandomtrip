import type { MercadoPagoCheckoutReturnParams } from '@/lib/types/MercadoPagoCheckoutReturnParams';

function singleParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === '') return null;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
  return trimmed;
}

function recordFromUrlSearchParams(
  searchParams: URLSearchParams,
): Record<string, string | string[] | undefined> {
  const o: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    o[key] = value;
  });
  return o;
}

/**
 * Parses Mercado Pago redirect query string (same keys on success, pending, and failure URLs).
 * Accepts Next.js `searchParams` or the browser `URLSearchParams` from `useSearchParams()`.
 */
export function parseMercadoPagoCheckoutReturnParams(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>,
): MercadoPagoCheckoutReturnParams {
  const record =
    searchParams instanceof URLSearchParams
      ? recordFromUrlSearchParams(searchParams)
      : searchParams;

  return {
    collectionId: singleParam(record.collection_id),
    collectionStatus: singleParam(record.collection_status),
    externalReference: singleParam(record.external_reference),
    merchantAccountId: singleParam(record.merchant_account_id),
    merchantOrderId: singleParam(record.merchant_order_id),
    paymentId: singleParam(record.payment_id),
    paymentType: singleParam(record.payment_type),
    preferenceId: singleParam(record.preference_id),
    processingMode: singleParam(record.processing_mode),
    siteId: singleParam(record.site_id),
    status: singleParam(record.status),
  };
}
