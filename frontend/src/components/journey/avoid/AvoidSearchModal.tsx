
'use client';
import { useEffect, useRef, useState } from 'react';
import { useJourneyStore } from '@/store/journeyStore';

declare global { interface Window { google: any } }

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script'); s.src = src; s.async = true; s.defer = true;
    s.onload = () => resolve(); s.onerror = (e) => reject(e); document.head.appendChild(s);
  });
}

interface AvoidSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AvoidSearchModal({ isOpen, onClose }: AvoidSearchModalProps) {
  const ref = useRef<HTMLInputElement>(null);
  const { logistics, filters, setPartial } = useJourneyStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    loadScript(`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`).then(() => {
      const ac = new window.google.maps.places.Autocomplete(ref.current!, {
        types: ['(cities)'],
        fields: ['name'],
        componentRestrictions: logistics.country?.code ? { country: logistics.country.code } : undefined,
      });

      ac.addListener('place_changed', () => {
        const p = ac.getPlace();
        if (p.name) {
          const newAvoidList = [...new Set([...filters.avoidDestinations, p.name])];
          if (newAvoidList.length <= 15) {
            setPartial({ filters: { ...filters, avoidDestinations: newAvoidList } });
          }
          setInputValue('');
          onClose();
        }
      });
    });
  }, [isOpen, logistics.country?.code]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900">Buscar destino a evitar</h3>
        <div className="mt-4">
          <input
            ref={ref}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Buscar ciudad..."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="btn">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
