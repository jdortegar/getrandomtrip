"use client";

import { Briefcase, Calendar, Camera, MapPin, Pencil, Shield, Star } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import type {
  TripperSettingsFormState,
  TripperSettingsStats,
} from "@/types/tripper";

interface TripperSettingsHeroCardProps {
  copy: TripperDashboardDict["settingsProfile"]["hero"];
  tierLabels: { rookie: string; pro: string; elite: string };
  formData: TripperSettingsFormState;
  stats: TripperSettingsStats;
  isEditing: boolean;
  isSaving: boolean;
  isUploadingHeroImage: boolean;
  onChange: (next: TripperSettingsFormState) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onUploadHeroImage: (file: File) => Promise<void>;
}

export function TripperSettingsHeroCard({
  copy,
  tierLabels,
  formData,
  stats,
  isEditing,
  isSaving,
  isUploadingHeroImage,
  onChange,
  onEdit,
  onCancel,
  onSave,
  onUploadHeroImage,
}: TripperSettingsHeroCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasHeroImage = formData.heroImage.trim().length > 0;
  const initial = (formData.name || copy.nameFallback).charAt(0).toUpperCase();
  const tierKey = (
    ["rookie", "pro", "elite"].includes(formData.tierLevel)
      ? formData.tierLevel
      : "rookie"
  ) as "rookie" | "pro" | "elite";
  const ratingDisplay =
    stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—";

  const statCells = [
    {
      key: "experiences",
      label: copy.statsExperiences,
      value: stats.totalExperiences,
      Icon: Briefcase,
      sub: null as string | null,
    },
    {
      key: "bookings",
      label: copy.statsBookings,
      value: stats.totalBookings,
      Icon: Calendar,
      sub: null as string | null,
    },
    {
      key: "rating",
      label: copy.statsRating,
      value: ratingDisplay,
      Icon: Star,
      sub:
        stats.totalReviews > 0
          ? `${stats.totalReviews} ${copy.reviewsSuffix}`
          : null,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="relative h-64 sm:h-72">
        <button
          aria-label={copy.uploadHint}
          className="absolute inset-0 h-full w-full disabled:cursor-default"
          disabled={!isEditing || isUploadingHeroImage}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {hasHeroImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${formData.heroImage})` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700">
              <Camera className="h-16 w-16 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
              <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white">
                <Camera className="h-4 w-4" />
                {isUploadingHeroImage ? copy.saving : copy.uploadHint}
              </span>
            </div>
          )}
        </button>
        <input
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUploadHeroImage(file);
            e.currentTarget.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />

        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {!isEditing ? (
            <Button onClick={onEdit} size="sm" type="button" variant="white">
              <Pencil className="h-4 w-4" />
              {copy.editProfile}
            </Button>
          ) : (
            <>
              <Button
                onClick={onCancel}
                size="sm"
                type="button"
                variant="outline"
              >
                {copy.cancel}
              </Button>
              <Button
                className="border-gray-900 bg-gray-900 hover:bg-gray-800 hover:border-gray-800"
                disabled={isSaving}
                onClick={onSave}
                size="sm"
                type="button"
              >
                {isSaving ? copy.saving : copy.save}
              </Button>
            </>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-light-blue text-3xl font-bold text-white ring-4 ring-white/20">
              {initial}
            </div>
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <input
                  className="w-full max-w-xs border-b-2 border-white/40 bg-transparent font-barlow-condensed text-3xl font-extrabold uppercase text-white outline-none placeholder:text-white/50 focus:border-white"
                  onChange={(e) =>
                    onChange({ ...formData, name: e.target.value })
                  }
                  placeholder={copy.namePlaceholder}
                  type="text"
                  value={formData.name}
                />
              ) : (
                <h2 className="font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-white">
                  {formData.name || copy.nameFallback}
                </h2>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  <Shield className="h-3.5 w-3.5" />
                  {tierLabels[tierKey]}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {isEditing ? (
                    <input
                      className="w-40 border-b border-white/40 bg-transparent text-sm text-white outline-none placeholder:text-white/50 focus:border-white"
                      onChange={(e) =>
                        onChange({ ...formData, location: e.target.value })
                      }
                      placeholder={copy.locationPlaceholder}
                      type="text"
                      value={formData.location}
                    />
                  ) : (
                    <span>{formData.location || copy.noLocation}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 gap-8 md:flex">
            {statCells.map(({ key, label, value, sub }) => (
              <div className="text-right text-white" key={key}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  {label}
                </p>
                <p className="font-barlow-condensed text-3xl font-extrabold leading-none">
                  {value}
                </p>
                {sub && <p className="mt-0.5 text-xs text-white/60">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200 bg-white md:hidden">
        {statCells.map(({ key, label, value, Icon, sub }) => (
          <div
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-4 text-center",
            )}
            key={key}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                key === "rating" ? "text-yellow-500" : "text-light-blue",
              )}
            />
            <span className="font-barlow-condensed text-2xl font-extrabold text-gray-900">
              {value}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              {label}
            </span>
            {sub && <span className="text-[10px] text-neutral-400">{sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
