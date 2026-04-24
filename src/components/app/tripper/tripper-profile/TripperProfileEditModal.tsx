'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import type { TripperProfilePageDict } from '@/lib/types/dictionary';

export interface TripperProfileFormState {
  availableTypes: string[];
  bio: string;
  commission: number;
  destinations: string[];
  email: string;
  heroImage: string;
  location: string;
  name: string;
  tierLevel: string;
  tripperSlug: string;
}

interface TripperProfileEditModalProps {
  formData: TripperProfileFormState;
  isSaving: boolean;
  onChange: (next: TripperProfileFormState) => void;
  onClose: () => void;
  onSave: () => void;
  t: TripperProfilePageDict['modal'];
}

export function TripperProfileEditModal({
  formData,
  isSaving,
  onChange,
  onClose,
  onSave,
  t,
}: TripperProfileEditModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white">
          <div className="flex-1 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-neutral-900">
              {t.title}
            </h3>
          </div>
          <button
            aria-label={t.closeAria}
            className="p-6 text-neutral-500 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900" htmlFor="tripper-bio">
                {t.bio}
              </label>
              <textarea
                className="h-24 w-full resize-none rounded-md border border-neutral-200 px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                id="tripper-bio"
                onChange={(e) => onChange({ ...formData, bio: e.target.value })}
                placeholder={t.bioPlaceholder}
                value={formData.bio}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900" htmlFor="tripper-hero">
                {t.heroImage}
              </label>
              <Input
                id="tripper-hero"
                onChange={(e) => onChange({ ...formData, heroImage: e.target.value })}
                placeholder={t.heroImagePlaceholder}
                type="url"
                value={formData.heroImage}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900" htmlFor="tripper-location">
                {t.location}
              </label>
              <Input
                id="tripper-location"
                onChange={(e) => onChange({ ...formData, location: e.target.value })}
                placeholder={t.locationPlaceholder}
                type="text"
                value={formData.location}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900" htmlFor="tripper-tier">
                {t.tier}
              </label>
              <select
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                id="tripper-tier"
                onChange={(e) => onChange({ ...formData, tierLevel: e.target.value })}
                value={formData.tierLevel}
              >
                <option value="">{t.tierSelectPlaceholder}</option>
                <option value="rookie">{t.tierRookie}</option>
                <option value="pro">{t.tierPro}</option>
                <option value="elite">{t.tierElite}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-neutral-900"
                htmlFor="tripper-destinations"
              >
                {t.destinations}
              </label>
              <Input
                id="tripper-destinations"
                onChange={(e) =>
                  onChange({
                    ...formData,
                    destinations: e.target.value
                      .split(',')
                      .map((d) => d.trim())
                      .filter((d) => d !== ''),
                  })
                }
                placeholder={t.destinationsPlaceholder}
                type="text"
                value={formData.destinations.filter((d) => d).join(', ')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900" htmlFor="tripper-slug">
                {t.slug}
              </label>
              <Input
                id="tripper-slug"
                onChange={(e) => onChange({ ...formData, tripperSlug: e.target.value })}
                placeholder={t.slugPlaceholder}
                type="text"
                value={formData.tripperSlug}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-neutral-900"
                htmlFor="tripper-commission"
              >
                {t.commission}
              </label>
              <Input
                id="tripper-commission"
                max={1}
                min={0}
                onChange={(e) =>
                  onChange({ ...formData, commission: parseFloat(e.target.value) || 0 })
                }
                placeholder={t.commissionPlaceholder}
                step="0.01"
                type="number"
                value={formData.commission}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900" htmlFor="tripper-types">
                {t.availableTypes}
              </label>
              <Input
                id="tripper-types"
                onChange={(e) =>
                  onChange({
                    ...formData,
                    availableTypes: e.target.value
                      .split(',')
                      .map((x) => x.trim())
                      .filter((x) => x !== ''),
                  })
                }
                placeholder={t.availableTypesPlaceholder}
                type="text"
                value={formData.availableTypes.filter((x) => x).join(', ')}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-neutral-200 bg-white p-6">
          <Button
            className="flex-1"
            disabled={isSaving}
            onClick={onClose}
            type="button"
            variant="outline"
          >
            {t.cancel}
          </Button>
          <Button
            className="flex-1"
            disabled={isSaving}
            onClick={onSave}
            type="button"
            variant="default"
          >
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
