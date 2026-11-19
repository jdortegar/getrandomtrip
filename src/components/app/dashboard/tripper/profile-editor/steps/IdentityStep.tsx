"use client";

import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { ProfileCountryOptions } from "@/components/app/dashboard/tripper/profile-editor/ProfileCountryOptions";
import { ProfileEditorCard } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorCard";
import { ProfileImagePicker } from "@/components/app/dashboard/tripper/profile-editor/ProfileImagePicker";
import {
  TRIPPER_PROFILE_IMAGE_SIZES,
  TRIPPER_PROFILE_TEXT_LIMITS,
} from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { isValidProfileSlug, toProfileSlug } from "@/lib/helpers/tripperProfileEditor";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileIdentity } from "@/types/tripper";

interface IdentityStepProps {
  commonCopy: TripperProfileEditorDict["common"];
  copy: TripperProfileEditorDict["identity"];
  identity: TripperProfileIdentity;
  locale: string;
  onChange: (patch: Partial<TripperProfileIdentity>) => void;
  onImageSelect: (field: "coverUrl" | "portraitUrl", file: File) => void;
}

const LIMITS = TRIPPER_PROFILE_TEXT_LIMITS;

/** Keeps typing fluid (trailing hyphens allowed) while dropping invalid characters. */
function sanitizeSlugInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-");
}

function OverLimit({ label, max, value }: { label: string; max: number; value: string }) {
  if (value.length <= max) return null;
  return <span className="block text-red-700">{label}</span>;
}

export function IdentityStep({
  commonCopy,
  copy,
  identity,
  locale,
  onChange,
  onImageSelect,
}: IdentityStepProps) {
  const showSlugError = identity.slug.length > 0 && !isValidProfileSlug(identity.slug);
  const sizeHint = (size: { height: number; width: number }) =>
    interpolateTemplate(commonCopy.idealSize, {
      height: size.height.toLocaleString(locale),
      width: size.width.toLocaleString(locale),
    });

  return (
    <div className="flex flex-col gap-6" data-component="IdentityStep">
      <ProfileEditorCard meta={commonCopy.requiredHint} title={copy.presentationTitle}>
        <FormField
          autoComplete="name"
          hint={
            <>
              {copy.name.hint}
              <OverLimit label={commonCopy.overLimit} max={LIMITS.name} value={identity.name} />
            </>
          }
          id="profile-name"
          label={copy.name.label}
          maxLength={LIMITS.name}
          onChange={(e) => onChange({ name: e.target.value })}
          showCount
          value={identity.name}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormSelectField
            id="profile-country"
            label={copy.country.label}
            onChange={(e) => onChange({ countryCode: e.target.value })}
            value={identity.countryCode}
          >
            <ProfileCountryOptions locale={locale} placeholder={copy.country.placeholder} selected={identity.countryCode} />
          </FormSelectField>
          <FormField
            autoComplete="address-level2"
            hint={copy.city.hint}
            id="profile-city"
            label={copy.city.label}
            maxLength={LIMITS.city}
            onChange={(e) => onChange({ city: e.target.value })}
            showCount
            value={identity.city}
          />
        </div>
        <FormField
          aria-invalid={showSlugError || undefined}
          hint={
            <>
              <span className="block font-medium text-ink">
                {copy.slug.prefix}
                <span className="text-primary">{identity.slug}</span>
              </span>
              <span className="block">{showSlugError ? copy.slug.invalid : copy.slug.rules}</span>
            </>
          }
          id="profile-slug"
          label={copy.slug.label}
          maxLength={LIMITS.slug}
          onBlur={(e) => onChange({ slug: toProfileSlug(e.target.value) })}
          onChange={(e) => onChange({ slug: sanitizeSlugInput(e.target.value) })}
          showCount
          spellCheck={false}
          value={identity.slug}
        />
        <TextAreaInput
          className="min-h-[120px]"
          hint={copy.headline.hint}
          id="profile-headline"
          label={copy.headline.label}
          maxLength={LIMITS.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          value={identity.headline}
        />
      </ProfileEditorCard>

      <ProfileEditorCard meta={commonCopy.imageFormats} title={copy.imagesTitle}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[2fr_3fr]">
          <ProfileImagePicker
            alt={identity.name}
            aspectClassName="aspect-[4/5]"
            changeLabel={copy.portrait.change}
            hint={`${sizeHint(TRIPPER_PROFILE_IMAGE_SIZES.portrait)} ${copy.portrait.hint}`}
            id="profile-portrait"
            onSelect={(file) => onImageSelect("portraitUrl", file)}
            uploadLabel={copy.portrait.upload}
            value={identity.portraitUrl}
          />
          <ProfileImagePicker
            alt={identity.coverAlt}
            aspectClassName="aspect-[9/5]"
            changeLabel={copy.cover.change}
            hint={`${sizeHint(TRIPPER_PROFILE_IMAGE_SIZES.cover)} ${copy.cover.hint}`}
            id="profile-cover"
            onSelect={(file) => onImageSelect("coverUrl", file)}
            uploadLabel={copy.cover.upload}
            value={identity.coverUrl}
          />
        </div>
        <FormField
          hint={copy.coverCaption.hint}
          id="profile-cover-caption"
          label={copy.coverCaption.label}
          maxLength={LIMITS.coverCaption}
          onChange={(e) => onChange({ coverCaption: e.target.value })}
          showCount
          value={identity.coverCaption}
        />
        <TextAreaInput
          className="min-h-[100px]"
          hint={
            <>
              <span className="block">{copy.coverAlt.hint}</span>
              <span className="block">{copy.coverAlt.help}</span>
            </>
          }
          id="profile-cover-alt"
          label={copy.coverAlt.label}
          maxLength={LIMITS.coverAlt}
          onChange={(e) => onChange({ coverAlt: e.target.value })}
          value={identity.coverAlt}
        />
      </ProfileEditorCard>
    </div>
  );
}
