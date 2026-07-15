"use client";

import { MapPin, Search } from "lucide-react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { AccommodationEntry, XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"]["accommodation"];
}

const STAR_OPTIONS = [1, 2, 3, 4, 5];

// XSED drops are single-night — always exactly one accommodation entry, no
// add/remove repeater like the tripper experience form has.
export function XsedAccommodationStep({ form, onChange, copy }: Props) {
  function updateEntry(index: number, key: keyof AccommodationEntry, value: string) {
    const updated = form.hotels.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry,
    );
    onChange({ hotels: updated });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {form.hotels.map((entry, index) => (
          <div key={index} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id={`xsed-hotel-name-${index}`}
                label={copy.hotelName}
                placeholder={copy.hotelNamePlaceholder}
                value={entry.hotelName}
                onChange={(e) => updateEntry(index, "hotelName", e.target.value)}
              />

              <div className="flex flex-col gap-2">
                <FormSelectField
                  id={`xsed-hotel-stars-${index}`}
                  label={copy.hotelStars}
                  value={entry.hotelStars}
                  onChange={(e) => updateEntry(index, "hotelStars", e.target.value)}
                >
                  <option value="">{copy.hotelStarsPlaceholder}</option>
                  {STAR_OPTIONS.map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? copy.hotelStarsSingular : copy.hotelStarsPlural}
                    </option>
                  ))}
                </FormSelectField>
                <p className="text-xs text-neutral-400">{copy.hotelStarsHint}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  className="block font-normal text-gray-600 text-base"
                  htmlFor={`xsed-hotel-location-${index}`}
                >
                  {copy.hotelLocation}
                </label>
                <div className="relative">
                  <input
                    id={`xsed-hotel-location-${index}`}
                    className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 pr-16 rounded-xl text-gray-900 w-full text-base"
                    placeholder={copy.hotelLocationPlaceholder}
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
                label={copy.hotelDays}
                placeholder={copy.hotelDaysPlaceholder}
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
    </div>
  );
}
