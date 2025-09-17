'use client';
import { useStore } from '@/store/store';

export default function SelectionsBar() {
  const { displayPrice } = useStore();

  // Si no hay precio para mostrar, no renderizamos nada.
  if (!displayPrice) return null;

  const Chip = ({ label }: { label: string }) => (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 border border-neutral-200">
      {label}
    </span>
  );
}
