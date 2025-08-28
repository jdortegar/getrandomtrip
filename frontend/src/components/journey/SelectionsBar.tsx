'use client';
import { useJourneyStore } from '@/store/journeyStore';

export default function SelectionsBar() {
  const { type, level, displayPrice } = useJourneyStore();
  const prettyType  = { couple:'En Pareja', solo:'Solo', family:'Familia', group:'Grupo', honeymoon:'Honeymoon', paws:'Mascotas' }[type] || type;
  const prettyLevel = { 'essenza':'Essenza', 'modo-explora':'Modo Explora', 'explora-plus':'Explora+', 'bivouac':'Bivouac', 'atelier-getaway':'Atelier Getaway' }[level] || level;
  const Chip = ({label}:{label:string}) => (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 border border-neutral-200">{label}</span>
  );
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Chip label={`By Traveller: ${prettyType}`} />
      <Chip label={`Nivel: ${prettyLevel}`} />
      {displayPrice && <Chip label={`Precio base: ${displayPrice}`} />}
    </div>
  );
}