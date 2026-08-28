"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { ImageUploadTile } from "@/components/ui/ImageUploadTile";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"];
}

async function uploadXsedImage(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("feature", "xsed");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

export function XsedIdentityStep({ form, onChange, copy }: Props) {
  const isActive = form.status === "ACTIVE";
  const [countryCode, setCountryCode] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);

  async function handleHeroSelect(file: File) {
    setHeroUploading(true);
    try {
      const url = await uploadXsedImage(file);
      if (url) onChange({ heroImage: url });
    } finally {
      setHeroUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <FormField
        id="xsed-titleInternal"
        label={copy.titleInternal}
        placeholder={copy.titleInternalPlaceholder}
        type="text"
        value={form.titleInternal}
        onChange={(e) => onChange({ titleInternal: e.target.value })}
      />

      <div className="space-y-2">
        <label className="block font-normal text-gray-600 text-base">
          {copy.heroImage}
        </label>
        <ImageUploadTile
          alt={copy.heroImage}
          copyrightHint={copy.copyrightHint}
          minHeight={720}
          minWidth={1280}
          onRemove={() => onChange({ heroImage: "" })}
          onSelect={handleHeroSelect}
          sizeHint={copy.heroImageSizeHint}
          tooSmallLabel={copy.imageTooSmall}
          uploadLabel={copy.uploadImage}
          uploading={heroUploading}
          value={form.heroImage}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="xsed-tripDate"
          label={copy.tripDate}
          type="date"
          value={form.tripDate}
          onChange={(e) => onChange({ tripDate: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-2">
          <label className="block font-normal text-gray-600 text-base">
            {copy.destinationCountry}
          </label>
          <CountrySelector
            value={form.destinationCountry}
            onChange={(name, code) => {
              setCountryCode(code);
              onChange({ destinationCountry: name, destinationCity: "" });
            }}
            placeholder={copy.destinationCountryPlaceholder}
            size="lg"
            className="bg-gray-100 border-0 rounded-xl placeholder:text-gray-400 text-gray-900"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label className="block font-normal text-gray-600 text-base">
            {copy.destinationCity}
          </label>
          <CitySelector
            value={form.destinationCity}
            countryCode={countryCode}
            onChange={(city) => onChange({ destinationCity: city })}
            placeholder={copy.destinationCityPlaceholder}
            size="lg"
            className="bg-gray-100 border-0 rounded-xl placeholder:text-gray-400 text-gray-900"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-400 -mt-3">
        {copy.destinationHiddenHint}
      </p>

      <div className="flex items-center justify-between">
        <span className="block font-normal text-gray-600 text-base">{copy.status}</span>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() =>
            onChange({ status: isActive ? "DRAFT" : "ACTIVE" })
          }
          className="flex items-center gap-2 group"
        >
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              isActive ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                isActive ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </span>
          <span
            className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}
          >
            {isActive ? copy.statusActive : copy.statusDraft}
          </span>
        </button>
      </div>
    </div>
  );
}
