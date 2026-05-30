"use client";

import { useState } from "react";
import { FormSelectField } from "@/components/ui/FormField";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";
import {
  CLIMATE_OPTIONS,
  getExcuseOptionsForType,
} from "@/lib/constants/packages";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const req = <span className="text-red-500 ml-0.5">*</span>;

const selectorClassName = "bg-gray-100 border-0 pr-6 py-4 h-auto rounded-xl";
const labelClassName = "block font-normal text-gray-600 text-base";

export function AboutDestinationStep({ copy, form, onChange }: Props) {
  const [countryCode, setCountryCode] = useState("");
  const excuseOptions = getExcuseOptionsForType(form.type);

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[0]?.substeps[1]?.description}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClassName}>
            {copy.fields.country}
            {req}
          </label>
          <CountrySelector
            className={selectorClassName}
            placeholder="Ej: Argentina"
            value={form.destinationCountry}
            onChange={(name, code) => {
              onChange("destinationCountry", name);
              onChange("destinationCity", "");
              setCountryCode(code);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClassName}>
            {copy.fields.city}
            {req}
          </label>
          <CitySelector
            className={selectorClassName}
            countryCode={countryCode}
            placeholder="Ej: Buenos Aires"
            value={form.destinationCity}
            onChange={(value) => onChange("destinationCity", value)}
          />
        </div>
      </div>

      <FormSelectField
        id="dest-excuse"
        label={
          <>
            {copy.fields.excuseKey}
            {req}
          </>
        }
        value={form.excuseKey}
        onChange={(e) => onChange("excuseKey", e.target.value)}
      >
        <option value="" disabled>
          {copy.fields.excuseKey}
        </option>
        {excuseOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </FormSelectField>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          id="dest-climate"
          label={copy.fields.climate}
          value={form.climate}
          onChange={(e) => onChange("climate", e.target.value)}
        >
          {CLIMATE_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </FormSelectField>
      </div>

      {copy.fields.excuseKeyHint && (
        <p className="text-sm text-neutral-400">{copy.fields.excuseKeyHint}</p>
      )}
    </div>
  );
}
