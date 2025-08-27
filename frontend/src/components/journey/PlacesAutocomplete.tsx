'use client';
import { useEffect, useRef } from 'react';
import { useJourneyStore } from '@/store/journeyStore';
declare global { interface Window { google: any } }

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script'); s.src = src; s.async = true; s.defer = true;
    s.onload = () => resolve(); s.onerror = (e) => reject(e); document.head.appendChild(s);
  });
}

export function CountryAutocomplete() {
  const ref = useRef<HTMLInputElement>(null);
  const { logistics, setPartial } = useJourneyStore();
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    loadScript(`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`).then(() => {
      const ac = new window.google.maps.places.Autocomplete(ref.current!, { types: ['(regions)'], fields: ['address_components','name'] });
      ac.addListener('place_changed', () => {
        const p = ac.getPlace(); const comp = (p.address_components||[]).find((c:any)=>c.types.includes('country'));
        const code = comp?.short_name; const name = comp?.long_name || p.name;
        setPartial({ logistics: { ...logistics, country: { name, code } } }); ref.current!.value = name || '';
      });
    });
  }, []);
  return <input ref={ref} className="input input-bordered w-full" placeholder="País de salida" />;
}

export function CityAutocomplete() {
  const ref = useRef<HTMLInputElement>(null);
  const { logistics, setPartial } = useJourneyStore();
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    loadScript(`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`).then(() => {
      const ac = new window.google.maps.places.Autocomplete(ref.current!, {
        types: ['(cities)'], fields: ['place_id','name','address_components'],
        componentRestrictions: logistics.country?.code ? { country: logistics.country.code } : undefined,
      });
      ac.addListener('place_changed', () => {
        const p = ac.getPlace();
        setPartial({ logistics: { ...logistics, city: { name: p.name, placeId: p.place_id } } });
        ref.current!.value = p.name || '';
      });
    });
  }, [logistics.country?.code]);
  return <input ref={ref} className="input input-bordered w-full" placeholder="Ciudad de salida" />;
}