import { useState } from 'react';
import { useStore } from '@/store/store';

interface SaveTripResponse {
  trip: {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface SaveTripError {
  error: string;
}

export function useSaveTrip() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useStore();

  const saveTrip = async (tripId?: string) => {
    console.log('🚀 useSaveTrip: Starting save trip...', { tripId });
    setIsLoading(true);
    setError(null);

    try {
      const {
        from,
        type,
        level,
        logistics,
        filters,
        addons,
        basePriceUsd,
        displayPrice,
        filtersCostUsd,
        addonsCostUsd,
        totalPerPaxUsd,
      } = store;

      console.log('📦 Store data:', {
        type,
        level,
        country: logistics.country,
        city: logistics.city,
      });

      // Calculate total trip cost
      const totalTripUsd = totalPerPaxUsd * logistics.pax;

      const payload = {
        id: tripId,
        from,
        type,
        level,
        country: logistics.country,
        city: logistics.city,
        startDate: logistics.startDate
          ? logistics.startDate instanceof Date
            ? logistics.startDate.toISOString()
            : new Date(logistics.startDate).toISOString()
          : null,
        endDate: logistics.endDate
          ? logistics.endDate instanceof Date
            ? logistics.endDate.toISOString()
            : new Date(logistics.endDate).toISOString()
          : null,
        nights: logistics.nights,
        pax: logistics.pax,
        transport: filters.transport,
        climate: filters.climate,
        maxTravelTime: filters.maxTravelTime,
        departPref: filters.departPref,
        arrivePref: filters.arrivePref,
        avoidDestinations: filters.avoidDestinations,
        addons: addons.selected,
        basePriceUsd,
        displayPrice,
        filtersCostUsd,
        addonsCostUsd,
        totalPerPaxUsd,
        totalTripUsd,
        status: tripId ? 'SAVED' : 'DRAFT',
      };

      console.log('📤 Sending to API:', payload);

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 API Response status:', response.status);

      if (!response.ok) {
        const errorData: SaveTripError = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to save trip');
      }

      const data: SaveTripResponse = await response.json();
      console.log('✅ Trip saved successfully:', data.trip);
      return data.trip;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save trip';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveTrip,
    isLoading,
    error,
  };
}
