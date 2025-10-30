'use client';

import { useStore } from '@/store/store';

/**
 * Hook to clear form state after successful purchase
 * This should be called after a successful payment/booking
 */
export function useClearFormAfterPurchase() {
  const clearFormAfterPurchase = useStore((s) => s.clearFormAfterPurchase);

  const clearForm = () => {
    clearFormAfterPurchase();
  };

  return { clearForm };
}
