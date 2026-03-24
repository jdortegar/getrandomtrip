/**
 * Mercado Pago appends this query shape when redirecting users back after checkout.
 * The **same** keys are used for `checkout/success`, `checkout/pending`, and `checkout/failure`.
 *
 * **Persist for support/reconciliation:** `paymentId`, `externalReference` (trip id),
 * `preferenceId`, `status` / `collectionStatus`, `merchantOrderId`; optional: `paymentType`, `siteId`.
 */
export interface MercadoPagoCheckoutReturnParams {
  collectionId: string | null;
  collectionStatus: string | null;
  externalReference: string | null;
  merchantAccountId: string | null;
  merchantOrderId: string | null;
  paymentId: string | null;
  paymentType: string | null;
  preferenceId: string | null;
  processingMode: string | null;
  siteId: string | null;
  status: string | null;
}
