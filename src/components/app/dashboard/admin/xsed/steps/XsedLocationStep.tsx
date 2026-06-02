"use client";

import { useState } from "react";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

export function XsedLocationStep({ form, onChange }: Props) {
  const [countryCode, setCountryCode] = useState("");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <label className="block font-normal text-gray-600 text-base">
          Destination country
        </label>
        <CountrySelector
          value={form.destinationCountry}
          onChange={(name, code) => {
            setCountryCode(code);
            onChange({ destinationCountry: name, destinationCity: "" });
          }}
          placeholder="Search country..."
          size="lg"
          className="bg-gray-100 border-0 rounded-xl placeholder:text-gray-400 text-gray-900"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="block font-normal text-gray-600 text-base">
          Destination city
        </label>
        <CitySelector
          value={form.destinationCity}
          countryCode={countryCode}
          onChange={(city) => onChange({ destinationCity: city })}
          placeholder="Search city..."
          size="lg"
          className="bg-gray-100 border-0 rounded-xl placeholder:text-gray-400 text-gray-900"
        />
      </div>

      <p className="text-xs text-neutral-400">
        Hidden from clients until reveal.
      </p>
    </div>
  );
}
