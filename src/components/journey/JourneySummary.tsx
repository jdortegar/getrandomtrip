'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Img from '@/components/common/Img';

interface JourneySummaryProps {
  className?: string;
  selectedDetails?: string[];
  selectedExcuse?: string;
  selectedExperience?: {
    label: string;
    price: string;
    nights?: string;
  };
  selectedTravelType?: {
    label: string;
    image?: string;
    price: string;
    rating?: number;
    reviews?: number;
  };
  totalPrice?: string;
  onDetailRemove?: (detail: string) => void;
  onEdit?: (section: string) => void;
}

export default function JourneySummary({
  className,
  selectedDetails = [],
  selectedExcuse,
  selectedExperience,
  selectedTravelType,
  totalPrice = '780 USD',
  onDetailRemove,
  onEdit,
}: JourneySummaryProps) {
  return (
    <aside
      className={cn(
        'w-full md:w-80 flex-shrink-0 bg-white rounded-lg shadow-sm p-6 space-y-6 lg:sticky lg:top-8 lg:self-start',
        className,
      )}
    >
      <h2 className="text-xl font-medium font-barlow text-gray-900">Resumen del viaje</h2>

      {/* Type of Trip Section */}
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {selectedTravelType?.image && (
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                <Img
                  alt={selectedTravelType.label}
                  className="w-full h-full object-cover"
                  height={48}
                  src={selectedTravelType.image}
                  width={48}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase mb-1">
                Tipo de viaje | {selectedTravelType?.label || 'Viajo solo'}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                Precio base tope por persona
              </p>
              <p className="text-lg font-bold text-gray-900">
                {selectedTravelType?.price || 'USD 780'}
              </p>
              {selectedTravelType?.rating && (
                <p className="text-xs text-gray-600 mt-1">
                  Favorito entre viajeros ★{selectedTravelType.rating.toFixed(1)}
                  {selectedTravelType.reviews && ` (${selectedTravelType.reviews})`}
                </p>
              )}
            </div>
          </div>
          <button
            className="text-sm text-[#4F96B6] hover:underline flex-shrink-0"
            onClick={() => onEdit?.('travel-type')}
            type="button"
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* Experience Section */}
      <div className="space-y-2 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Experiencia</p>
            <p className="text-sm font-semibold text-gray-900">
              {selectedExperience?.label || 'Modo Explora +'}
            </p>
            {selectedExperience?.price && (
              <p className="text-sm text-gray-600">
                {selectedExperience.price}
                {selectedExperience.nights && ` | ${selectedExperience.nights}`}
              </p>
            )}
          </div>
          <button
            className="text-sm text-[#4F96B6] hover:underline"
            onClick={() => onEdit?.('experience')}
            type="button"
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* Excuse Section */}
      {selectedExcuse && (
        <div className="space-y-2 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Excusa</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedExcuse}
              </p>
            </div>
            <button
              className="text-sm text-[#4F96B6] hover:underline"
              onClick={() => onEdit?.('excuse')}
              type="button"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Refine Details Section */}
      {selectedDetails.length > 0 && (
        <div className="space-y-3 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase">Afinar detalles</p>
            <button
              className="text-sm text-[#4F96B6] hover:underline"
              onClick={() => onEdit?.('details')}
              type="button"
            >
              Editar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDetails.map((detail) => (
              <div
                key={detail}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
              >
                <span>{detail}</span>
                {onDetailRemove && (
                  <button
                    className="hover:text-gray-900"
                    onClick={() => onDetailRemove(detail)}
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Price */}
      <div className="space-y-1">
        <p className="text-sm font-bold text-gray-900">Total USD</p>
        <p className="text-xs text-gray-500">Por persona</p>
        <p className="text-xl font-bold text-gray-900">{totalPrice}</p>
      </div>

      {/* Bottom Banner */}
      <div className="bg-[#4F96B6] text-white p-4 rounded-lg text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-lg">💎</span>
        </div>
        <p className="text-sm font-medium">
          ¡Mensaje de oportunidad única, u otro!
        </p>
      </div>
    </aside>
  );
}
