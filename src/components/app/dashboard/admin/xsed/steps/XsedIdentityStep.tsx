"use client";

import { useRef, useState } from "react";
import { Loader2, X, ImagePlus } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import Img from "@/components/common/Img";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"];
}

function HeroImageUpload({
  label,
  hint,
  value,
  uploadLabel,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  value: string;
  uploadLabel: string;
  onAdd: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("feature", "xsed");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string };
      if (data.url) onAdd(data.url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base">
        {label}
      </label>

      {value ? (
        <div className="relative w-full h-52 rounded-xl overflow-hidden border border-gray-200 group">
          <Img
            src={value}
            alt={label}
            width={900}
            height={208}
            className="object-cover w-full h-full"
            unoptimized
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-full h-52 rounded-xl border-2 border-dashed border-gray-300 text-neutral-400 hover:border-gray-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <span className="text-sm">{uploading ? "…" : uploadLabel}</span>
        </button>
      )}

      {hint && <p className="text-xs text-neutral-400">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

export function XsedIdentityStep({ form, onChange, copy }: Props) {
  const isActive = form.status === "ACTIVE";
  const [countryCode, setCountryCode] = useState("");

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

      <HeroImageUpload
        label={copy.heroImage}
        uploadLabel={copy.uploadImage}
        value={form.heroImage}
        onAdd={(url) => onChange({ heroImage: url })}
        onRemove={() => onChange({ heroImage: "" })}
      />

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
