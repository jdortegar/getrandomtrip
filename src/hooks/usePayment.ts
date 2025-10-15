import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ADDONS } from '@/data/addons-catalog';
import { computeFiltersCostPerTrip } from '@/lib/pricing';
import type {
  Logistics,
  Filters,
  AddonSelection,
} from '@/store/slices/journeyStore';

interface PaymentData {
  basePriceUsd: number;
  logistics: Logistics;
  filters: Filters;
  addons: { selected: AddonSelection[] };
}

interface PaymentTotals {
  basePerPax: number;
  filtersPerPax: number;
  addonsPerPax: number;
  cancelInsurancePerPax: number;
  totalPerPax: number;
  totalTrip: number;
}

/**
 * Custom hook for payment calculations and MercadoPago integration
 * Follows Single Responsibility Principle - handles only payment logic
 */
export function usePayment(paymentData: PaymentData) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: session } = useSession();

  const { basePriceUsd, logistics, filters, addons } = paymentData;
  const pax = logistics.pax || 1;

  /**
   * Calculate payment totals following DRY principle
   * Centralized pricing logic that can be reused
   */
  const calculateTotals = (): PaymentTotals => {
    const basePerPax = basePriceUsd || 0;

    // Calculate filters cost (total trip cost, not per person)
    const filtersTripTotal = computeFiltersCostPerTrip(filters, pax);
    const filtersPerPax = filtersTripTotal / pax;

    // Calculate addons cost per person (excluding cancellation insurance)
    let addonsPerPax = 0;
    const hasCancelInsurance = addons.selected.some(
      (s) => s.id === 'cancel-ins',
    );

    addons.selected.forEach((s) => {
      const a = ADDONS.find((x) => x.id === s.id);
      if (!a || a.id === 'cancel-ins') return; // Skip cancel-ins for now

      const qty = s.qty || 1;
      const totalPrice = a.price * qty;

      if (a.type === 'perPax') {
        // For perPax, show individual price (total / qty)
        addonsPerPax += totalPrice / qty;
      } else {
        // For perTrip, divide by number of passengers
        addonsPerPax += totalPrice / pax;
      }
    });

    // Calculate subtotal before cancellation insurance
    const subtotalPerPax = basePerPax + filtersPerPax + addonsPerPax;

    // Calculate cancellation insurance as 15% of subtotal
    const cancelInsurancePerPax = hasCancelInsurance
      ? subtotalPerPax * 0.15
      : 0;

    // Calculate totals
    const totalAddonsPerPax = addonsPerPax + cancelInsurancePerPax;
    const totalPerPax = basePerPax + filtersPerPax + totalAddonsPerPax;
    const totalTrip = totalPerPax * pax;

    return {
      basePerPax,
      filtersPerPax,
      addonsPerPax,
      cancelInsurancePerPax,
      totalPerPax,
      totalTrip,
    };
  };

  /**
   * Initiate MercadoPago payment
   * Single responsibility - handles only payment initiation
   */
  const initiatePayment = async (tripId?: string): Promise<void> => {
    setIsProcessing(true);

    try {
      const totals = calculateTotals();

      const response = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total: totals.totalTrip,
          tripId: tripId || `trip-${Date.now()}`,
          userEmail: session?.user?.email || 'cliente@example.com',
          userName: session?.user?.name || 'Cliente',
          userId: session?.user?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment preference');
      }

      const { init_point } = await response.json();
      window.location.href = init_point;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error al procesar el pago. Intenta nuevamente.');
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    calculateTotals,
    initiatePayment,
  };
}
