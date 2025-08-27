'use client';
import { useEffect, useRef } from 'react';
import { useJourneyStore } from '@/store/journeyStore';
import { loadGoogleMapsPlaces } from '@/lib/loadGoogle';

declare global { interface Window { google: any } }

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está definida');
  return key || '';
}

export function CountryAutocomplete() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { logistics, setPartial } = useJourneyStore();

  useEffect(() => {
    let destroyed = false;
    const key = getApiKey();
    if (!key || !inputRef.current) return;

    loadGoogleMapsPlaces(key, 'es')
      .then(() => {
        if (destroyed || !inputRef.current) return;
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['(regions)'],
          fields: ['address_components', 'name'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const comps = place?.address_components || [];
          const countryComp = comps.find((c: any) => c.types.includes('country'));
          const code = countryComp?.short_name;
          const name = countryComp?.long_name || place?.name || '';
          setPartial({ logistics: { ...logistics, country: { name, code } } });
          if (inputRef.current) inputRef.current.value = name;
        });
      })
      .catch((e) => console.error(e));

    return () => { destroyed = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={inputRef}
      className="input input-bordered w-full"
      placeholder="País de salida"
      aria-label="País de salida"
    />
  );
}

export function CityAutocomplete() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { logistics, setPartial } = useJourneyStore();
  const countryCode = logistics.country?.code;

  useEffect(() => {
    let destroyed = false;
    const key = getApiKey();
    if (!key || !inputRef.current) return;

    loadGoogleMapsPlaces(key, 'es')
      .then(() => {
        if (destroyed || !inputRef.current) return;
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['(cities)'],
          fields: ['place_id', 'name', 'address_components'],
          componentRestrictions: countryCode ? { country: countryCode } : undefined,
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const name = place?.name || '';
          const placeId = place?.place_id || '';
          setPartial({ logistics: { ...logistics, city: { name, placeId } } });
          if (inputRef.current) inputRef.current.value = name;
        });
      })
      .catch((e) => console.error(e));

    return () => { destroyed = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  return (
    <input
      ref={inputRef}
      className="input input-bordered w-full"
      placeholder="Ciudad de salida"
      aria-label="Ciudad de salida"
    />
  );
}
