"use client";

import { MapPin, Search, X } from "lucide-react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { ACCOMMODATION_TYPES } from "@/lib/constants/packages";
import type { AccommodationEntry, XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

const STAR_OPTIONS = [1, 2, 3, 4, 5];
const EMPTY_ENTRY: AccommodationEntry = {
  hotelName: "",
  hotelStars: "",
  hotelLocation: "",
  hotelDays: "",
};

export function XsedAccommodationStep({ form, onChange }: Props) {
  function updateEntry(index: number, key: keyof AccommodationEntry, value: string) {
    const updated = form.hotels.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry,
    );
    onChange({ hotels: updated });
  }

  function addEntry() {
    onChange({ hotels: [...form.hotels, { ...EMPTY_ENTRY }] });
  }

  function removeEntry(index: number) {
    onChange({ hotels: form.hotels.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 mb-2">
        <FormSelectField
          id="xsed-acc-type"
          label="Tipo de alojamiento"
          value={form.accommodationType ?? "any"}
          onChange={(e) => onChange({ accommodationType: e.target.value })}
        >
          {ACCOMMODATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </FormSelectField>
      </div>

      <div className="space-y-4">
        {form.hotels.map((entry, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  Alojamiento {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                id={`xsed-hotel-name-${index}`}
                label="Nombre del hotel *"
                placeholder="Ej: Boutique..."
                value={entry.hotelName}
                onChange={(e) => updateEntry(index, "hotelName", e.target.value)}
              />

              <div className="flex flex-col gap-2">
                <FormSelectField
                  id={`xsed-hotel-stars-${index}`}
                  label="Estrellas *"
                  value={entry.hotelStars}
                  onChange={(e) => updateEntry(index, "hotelStars", e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {STAR_OPTIONS.map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? "estrella" : "estrellas"}
                    </option>
                  ))}
                </FormSelectField>
                <p className="text-xs text-neutral-400">Categoría del alojamiento</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  className="block font-normal text-gray-600 text-base"
                  htmlFor={`xsed-hotel-location-${index}`}
                >
                  Ubicación *
                </label>
                <div className="relative">
                  <input
                    id={`xsed-hotel-location-${index}`}
                    className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 pr-16 rounded-xl text-gray-900 w-full text-base"
                    placeholder="Buscar location..."
                    value={entry.hotelLocation}
                    onChange={(e) => updateEntry(index, "hotelLocation", e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                    <MapPin className="h-4 w-4 text-teal-500" />
                  </div>
                </div>
              </div>

              <FormField
                id={`xsed-hotel-days-${index}`}
                label="Noches"
                placeholder="Ej: 1"
                type="text"
                inputMode="numeric"
                value={entry.hotelDays}
                onChange={(e) =>
                  updateEntry(index, "hotelDays", e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 hover:border-gray-400 hover:text-neutral-700 transition-colors"
      >
        + Agregar alojamiento
      </button>
    </div>
  );
}
