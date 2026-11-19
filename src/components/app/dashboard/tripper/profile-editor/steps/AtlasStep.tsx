"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { ProfileCountryOptions } from "@/components/app/dashboard/tripper/profile-editor/ProfileCountryOptions";
import { ProfileEditorCard } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorCard";
import { AtlasPlaceList } from "@/components/app/dashboard/tripper/profile-editor/steps/AtlasPlaceList";
import { TRIPPER_PROFILE_TEXT_LIMITS } from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { createProfileItemId, hasProfilePlace } from "@/lib/helpers/tripperProfileEditor";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfilePlace, TripperProfileStoryOption } from "@/types/tripper";

interface AtlasStepProps {
  commonCopy: TripperProfileEditorDict["common"];
  copy: TripperProfileEditorDict["atlas"];
  locale: string;
  onChange: (places: TripperProfilePlace[]) => void;
  places: TripperProfilePlace[];
  stories: TripperProfileStoryOption[];
}

export function AtlasStep({ commonCopy, copy, locale, onChange, places, stories }: AtlasStepProps) {
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [isLocalExpert, setIsLocalExpert] = useState(false);

  const trimmedCity = city.trim();
  const isDuplicate = !!countryCode && hasProfilePlace(places, countryCode, trimmedCity);

  function handleAdd() {
    if (!countryCode || isDuplicate) return;
    const place: TripperProfilePlace = {
      countryCode,
      id: createProfileItemId("place"),
      isLocalExpert,
      ...(trimmedCity ? { city: trimmedCity } : {}),
    };
    onChange([...places, place]);
    setCity("");
    setIsLocalExpert(false);
  }

  function handlePlaceChange(id: string, patch: Partial<TripperProfilePlace>) {
    onChange(places.map((place) => (place.id === id ? { ...place, ...patch } : place)));
  }

  return (
    <div className="flex flex-col gap-6" data-component="AtlasStep">
      <section className="rounded-2xl bg-secondary/20 p-5 ring-1 ring-secondary/60 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.timelineEyebrow}
        </p>
        <h3 className="mt-2 font-barlow-condensed text-2xl font-bold leading-tight text-ink">
          {copy.timelineTitle}
        </h3>
        <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {copy.timeline.map((item, index) => (
            <li className="flex gap-3" key={item.title}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary ring-1 ring-primary/30">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-sm text-neutral-600">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs text-neutral-600">{copy.timelineFootnote}</p>
      </section>

      <ProfileEditorCard meta={copy.addMeta} title={copy.addTitle}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormSelectField
            id="atlas-country"
            label={copy.country.label}
            onChange={(e) => setCountryCode(e.target.value)}
            value={countryCode}
          >
            <ProfileCountryOptions locale={locale} placeholder={copy.country.placeholder} selected={countryCode} />
          </FormSelectField>
          <FormField
            disabled={!countryCode}
            hint={copy.city.hint}
            id="atlas-city"
            label={copy.city.label}
            maxLength={TRIPPER_PROFILE_TEXT_LIMITS.city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={countryCode ? undefined : copy.city.placeholder}
            value={city}
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3" htmlFor="atlas-local-expert">
          <input
            checked={isLocalExpert}
            className="mt-1 h-5 w-5 shrink-0 accent-primary"
            id="atlas-local-expert"
            onChange={(e) => setIsLocalExpert(e.target.checked)}
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-medium text-ink">{copy.localExpert.label}</span>
            <span className="block text-xs text-neutral-500">{copy.localExpert.hint}</span>
          </span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-xs text-red-700">
            {isDuplicate ? copy.duplicate : null}
          </p>
          <Button
            disabled={!countryCode || isDuplicate}
            onClick={handleAdd}
            size="md"
            type="button"
            variant="secondary"
          >
            {copy.addCta}
            <Plus aria-hidden />
          </Button>
        </div>
      </ProfileEditorCard>

      <ProfileEditorCard meta={String(places.length)} title={copy.listTitle}>
        <AtlasPlaceList
          commonCopy={commonCopy}
          copy={copy}
          locale={locale}
          onChange={handlePlaceChange}
          onRemove={(id) => onChange(places.filter((place) => place.id !== id))}
          places={places}
          stories={stories}
        />
      </ProfileEditorCard>
    </div>
  );
}
