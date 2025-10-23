import { useState, useRef } from 'react';
import { useStore } from '@/store/store';

interface SaveTripResponse {
  tripRequest: {
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveTrip = async (tripId?: string) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // If already loading, don't start another save
    if (isLoading) {
      console.log('⏳ Save already in progress, skipping...');
      return;
    }

    console.log('🚀 useSaveTrip: Starting save trip...', { tripId });
    setIsLoading(true);
    setError(null);

    try {
      const { from, type, level, logistics, filters, addons } = store;

      console.log('📦 Store data:', {
        type,
        level,
        originCountry: logistics.country,
        originCity: logistics.city,
      });

      // Note: Pricing will be calculated when a package is assigned to this trip request

      const payload = {
        id: tripId,
        from,
        type,
        level,
        originCountry: logistics.country,
        originCity: logistics.city,
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
        status: tripId ? 'SAVED' : 'DRAFT',
      };

      console.log('📤 Sending to API:', payload);

      const response = await fetch('/api/trip-requests', {
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

      const data = await response.json();
      console.log('✅ Trip saved successfully:', data.tripRequest);
      return data.tripRequest;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save trip';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSaveTrip = (tripId?: string, delay = 1000) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveTrip(tripId);
    }, delay);
  };

  return {
    saveTrip,
    debouncedSaveTrip,
    isLoading,
    error,
  };
}
