"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { ImageUploadTile } from "@/components/ui/ImageUploadTile";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";
import { cn } from "@/lib/utils";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  copy: AdminXsedDict["form"]["fields"];
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

async function uploadXsedImage(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("feature", "xsed");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

export function XsedIdentityStep({ copy, form, onChange }: Props) {
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
        onChange={(e) => onChange({ titleInternal: e.target.value })}
        placeholder={copy.titleInternalPlaceholder}
        type="text"
        value={form.titleInternal}
      />

      <div className="space-y-2">
        <label className="block font-normal text-base text-gray-600">
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

      <div className="gap-4 grid grid-cols-2">
        <FormField
          id="xsed-tripDate"
          label={copy.tripDate}
          onChange={(e) => onChange({ tripDate: e.target.value })}
          type="date"
          value={form.tripDate}
        />
      </div>

      <div className={cn("flex flex-col gap-4", "sm:flex-row")}>
        <div className="flex flex-1 flex-col gap-2">
          <label className="block font-normal text-base text-gray-600">
            {copy.destinationCountry}
          </label>
          <CountrySelector
            className={cn(
              "bg-gray-100 border-0 rounded-xl text-ink",
              "placeholder:text-gray-400",
            )}
            onChange={(name, code) => {
              setCountryCode(code);
              onChange({ destinationCountry: name, destinationCity: "" });
            }}
            placeholder={copy.destinationCountryPlaceholder}
            size="lg"
            value={form.destinationCountry}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label className="block font-normal text-base text-gray-600">
            {copy.destinationCity}
          </label>
          <CitySelector
            className={cn(
              "bg-gray-100 border-0 rounded-xl text-ink",
              "placeholder:text-gray-400",
            )}
            countryCode={countryCode}
            onChange={(city) => onChange({ destinationCity: city })}
            placeholder={copy.destinationCityPlaceholder}
            size="lg"
            value={form.destinationCity}
          />
        </div>
      </div>
      <p className="-mt-3 text-neutral-400 text-xs">{copy.destinationHiddenHint}</p>
    </div>
  );
}
