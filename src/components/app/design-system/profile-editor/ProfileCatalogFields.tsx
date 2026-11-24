"use client";

import { useState } from "react";
import { ProfileCountryOptions } from "@/components/app/dashboard/tripper/profile-editor/ProfileCountryOptions";
import type { ProfileCatalogExampleProps } from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { FieldMeta } from "@/components/ui/FieldMeta";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TRIPPER_PROFILE_TEXT_LIMITS } from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { cn } from "@/lib/utils";

export function ProfileCatalogFields({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [name, setName] = useState("Nico Aranda");
  const [country, setCountry] = useState("AR");

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("grid grid-cols-1 gap-6", "md:grid-cols-2")}>
        <GalleryPanel className="min-w-0" title={catalog.panels.fieldMeta}>
          <FieldMeta count={{ length: 11, max: TRIPPER_PROFILE_TEXT_LIMITS.name }} hint={catalog.sampleHint} />
        </GalleryPanel>
        <GalleryPanel className="min-w-0" title={catalog.panels.fieldMetaOver}>
          <FieldMeta
            count={{ length: 186, max: TRIPPER_PROFILE_TEXT_LIMITS.headline }}
            hint={<span className="text-red-700">{copy.common.overLimit}</span>}
          />
        </GalleryPanel>
        <GalleryPanel className="min-w-0" title={catalog.panels.fieldCounter}>
          <FormField
            hint={copy.identity.name.hint}
            id="catalog-name"
            label={copy.identity.name.label}
            maxLength={TRIPPER_PROFILE_TEXT_LIMITS.name}
            onChange={(e) => setName(e.target.value)}
            showCount
            value={name}
          />
        </GalleryPanel>
        <GalleryPanel className="min-w-0" title={catalog.panels.countrySelect}>
          <FormSelectField
            id="catalog-country"
            label={copy.identity.country.label}
            onChange={(e) => setCountry(e.target.value)}
            value={country}
          >
            <ProfileCountryOptions locale={locale} placeholder={copy.identity.country.placeholder} selected={country} />
          </FormSelectField>
        </GalleryPanel>
      </div>
      <UsageExample
        code={`<FormField hint={copy.name.hint} id="name" label={copy.name.label} maxLength={40} onChange={handleChange} showCount value={name} />
<TextAreaInput hint={copy.headline.hint} id="headline" label={copy.headline.label} maxLength={170} onChange={handleChange} value={headline} />
<FormSelectField id="country" label={copy.country.label} onChange={handleChange} value={country}>
  <ProfileCountryOptions locale={locale} placeholder={copy.country.placeholder} selected={country} />
</FormSelectField>`}
        label={catalog.panels.fieldCounter}
      />
    </div>
  );
}
