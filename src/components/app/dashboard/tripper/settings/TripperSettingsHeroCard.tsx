"use client";

import { Camera, MapPin, Pencil, Shield, Star } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Img from "@/components/common/Img";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import {
  TRIPPER_TIER_ORDER,
  type TripperSettingsFormState,
  type TripperSettingsStats,
  type TripperTierCopy,
  type TripperTierLevel,
} from "@/types/tripper";

interface TripperSettingsHeroCardProps {
  copy: TripperDashboardDict["settingsProfile"]["hero"];
  tierLabels: TripperTierCopy;
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
  const tierKey = (
    TRIPPER_TIER_ORDER.includes(formData.tierLevel as TripperTierLevel)
      ? formData.tierLevel
      : "wanderer"
  ) as TripperTierLevel;
  const ratingDisplay =
    stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—";

  const statCells = [
    {
      key: "experiences",
      label: copy.statsExperiences,
      value: stats.totalExperiences,
      sub: null as string | null,
    },
    {
      key: "bookings",
      label: copy.statsBookings,
      value: stats.totalBookings,
      sub: null as string | null,
    },
    {
      key: "rating",
      label: copy.statsRating,
      value: ratingDisplay,
      sub:
        stats.totalReviews > 0
          ? `${stats.totalReviews} ${copy.reviewsSuffix}`
          : null,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="relative h-[380px] md:h-72">
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
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #0f2a36 0%, #1a4a62 40%, #2d6a8f 70%, #4f96b6 100%)",
              }}
            >
              <Img
                alt=""
                className="opacity-[0.28]"
                height={130}
                priority
                src="/assets/logos/iso-randomtrip.svg"
                style={{ filter: "brightness(0) invert(1)" }}
                width={130}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
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
            <Button
              aria-label={copy.editProfile}
              className="px-2.5 sm:px-6"
              onClick={onEdit}
              size="sm"
              type="button"
              variant="white"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">{copy.editProfile}</span>
            </Button>
          ) : (
            <>
              <Button
                className="px-3 sm:px-6"
                onClick={onCancel}
                size="sm"
                type="button"
                variant="outline"
              >
                {copy.cancel}
              </Button>
              <Button
                className="border-gray-900 bg-gray-900 px-3 hover:border-gray-800 hover:bg-gray-800 sm:px-6"
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

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 p-6 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-end md:gap-4">
            <div className="shrink-0 rounded-full ring-4 ring-white/20">
              <UserAvatar height={80} width={80} />
            </div>
            <div className="flex flex-col items-center gap-2 md:items-start">
              {isEditing ? (
                <>
                  <input
                    className="w-full max-w-xs border-b-2 border-white/40 bg-transparent text-center font-barlow-condensed text-3xl font-extrabold uppercase text-white outline-none placeholder:text-white/50 focus:border-white md:text-left"
                    onChange={(e) =>
                      onChange({ ...formData, nickname: e.target.value })
                    }
                    placeholder={formData.name || copy.namePlaceholder}
                    type="text"
                    value={formData.nickname}
                  />
                  <p className="text-xs text-white/70">{copy.nicknameHint}</p>
                </>
              ) : (
                <h2 className="font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-white">
                  {formData.nickname || formData.name || copy.nameFallback}
                </h2>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
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

          <div className="flex w-full justify-around gap-4 md:hidden">
            {statCells.map(({ key, label, value }) => (
              <div className="text-white" key={key}>
                <p className="flex items-center justify-center gap-1 font-barlow-condensed text-3xl font-extrabold leading-none">
                  {value}
                  {key === "rating" && (
                    <Star className="h-5 w-5 fill-white text-white" />
                  )}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  {label}
                </p>
              </div>
            ))}
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
    </div>
  );
}
