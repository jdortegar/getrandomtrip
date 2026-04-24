"use client";

import type { TripperProfilePageDict } from "@/lib/types/dictionary";
import Img from "@/components/common/Img";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import type { TripperProfileFormState } from "./TripperProfileEditModal";

interface TripperProfileOverviewSectionProps {
  copy: TripperProfilePageDict;
  formData: TripperProfileFormState;
  isEditing: boolean;
  onChange: (next: TripperProfileFormState) => void;
  onUploadHeroImage: (file: File) => Promise<void>;
  uploadingHeroImage: boolean;
}

export function TripperProfileOverviewSection({
  copy,
  formData,
  isEditing,
  onChange,
  onUploadHeroImage,
  uploadingHeroImage,
}: TripperProfileOverviewSectionProps) {
  const heroPreviewUrl = formData.heroImage.trim();
  const hasHeroPreview = heroPreviewUrl.length > 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold leading-none tracking-tight text-neutral-900">
        {copy.sections.profileDetails}
      </h2>
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <label className="sr-only" htmlFor="tripper-hero-upload">
              {copy.modal.uploadImage}
            </label>
            <input
              accept="image/*"
              className="hidden"
              id="tripper-hero-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUploadHeroImage(file);
                e.currentTarget.value = "";
              }}
              type="file"
            />
            <button
              className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              disabled={uploadingHeroImage}
              onClick={() => {
                const input = document.getElementById("tripper-hero-upload");
                if (input instanceof HTMLInputElement) input.click();
              }}
              type="button"
            >
              {uploadingHeroImage
                ? copy.modal.uploadingImage
                : copy.modal.uploadImage}
            </button>
            {hasHeroPreview ? (
              <Img
                alt={copy.details.heroPreviewAlt}
                className="h-40 w-full rounded-xl border border-neutral-200 object-cover"
                height={320}
                src={heroPreviewUrl}
                width={640}
              />
            ) : null}
          </div>
        ) : null}
        <FormField
          id="tripper-bio-inline"
          label={copy.modal.bio}
          onChange={(e) => onChange({ ...formData, bio: e.target.value })}
          placeholder={copy.modal.bioPlaceholder}
          readOnly={!isEditing}
          type="text"
          value={formData.bio}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="tripper-location-inline"
            label={copy.modal.location}
            onChange={(e) =>
              onChange({ ...formData, location: e.target.value })
            }
            placeholder={copy.modal.locationPlaceholder}
            readOnly={!isEditing}
            type="text"
            value={formData.location}
          />
          <FormSelectField
            disabled={!isEditing}
            id="tripper-tier-inline"
            label={copy.modal.tier}
            onChange={(e) =>
              onChange({ ...formData, tierLevel: e.target.value })
            }
            value={formData.tierLevel}
          >
            <option value="">{copy.modal.tierSelectPlaceholder}</option>
            <option value="rookie">{copy.modal.tierRookie}</option>
            <option value="pro">{copy.modal.tierPro}</option>
            <option value="elite">{copy.modal.tierElite}</option>
          </FormSelectField>
        </div>
        <FormField
          id="tripper-destinations-inline"
          label={copy.modal.destinations}
          onChange={(e) =>
            onChange({
              ...formData,
              destinations: [e.target.value],
            })
          }
          placeholder={copy.modal.destinationsPlaceholder}
          readOnly={!isEditing}
          type="text"
          value={formData.destinations.join(", ")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="tripper-slug-inline"
            label={copy.modal.slug}
            onChange={(e) =>
              onChange({ ...formData, tripperSlug: e.target.value })
            }
            placeholder={copy.modal.slugPlaceholder}
            readOnly={!isEditing}
            type="text"
            value={formData.tripperSlug}
          />
          <FormField
            id="tripper-commission-inline"
            label={copy.modal.commission}
            max={1}
            min={0}
            onChange={(e) =>
              onChange({
                ...formData,
                commission: parseFloat(e.target.value) || 0,
              })
            }
            placeholder={copy.modal.commissionPlaceholder}
            readOnly={!isEditing}
            step="0.01"
            type="number"
            value={formData.commission}
          />
        </div>
        <FormField
          id="tripper-types-inline"
          label={copy.modal.availableTypes}
          onChange={(e) =>
            onChange({
              ...formData,
              availableTypes: [e.target.value],
            })
          }
          placeholder={copy.modal.availableTypesPlaceholder}
          readOnly={!isEditing}
          type="text"
          value={formData.availableTypes.join(", ")}
        />
      </div>
    </div>
  );
}
