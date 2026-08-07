"use client";

import { Camera, MapPin, MoveHorizontal, Pencil, RotateCcw, Shield, Star } from "lucide-react";
import { useRef, useState } from "react";
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
  onCancel: () => void;
  onEdit: () => void;
  onSave: () => void;
  onUploadHeroImage: (file: File) => Promise<void>;
}

interface DragState {
  active: boolean;
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
  containerWidth: number;
  containerHeight: number;
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
  onCancel,
  onEdit,
  onSave,
  onUploadHeroImage,
}: TripperSettingsHeroCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    startY: 0,
    startPosX: 50,
    startPosY: 50,
    containerWidth: 1,
    containerHeight: 1,
  });

  const [isDragging, setIsDragging] = useState(false);

  const hasHeroImage = formData.heroImage.trim().length > 0;
  const posX = formData.heroImagePositionX;
  const posY = formData.heroImagePositionY;

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

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isEditing || !hasHeroImage || isUploadingHeroImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: posX,
      startPosY: posY,
      // Capture dimensions once so pointer move never triggers layout reads
      containerWidth: rect.width || 1,
      containerHeight: rect.height || 1,
    };
    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const { startX, startY, startPosX, startPosY, containerWidth, containerHeight } =
      dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    // Invert: dragging right shifts the focal point left (image pans right)
    const newX = Math.min(100, Math.max(0, startPosX - (dx / containerWidth) * 100));
    const newY = Math.min(100, Math.max(0, startPosY - (dy / containerHeight) * 100));
    onChange({ ...formData, heroImagePositionX: newX, heroImagePositionY: newY });
  }

  function handlePointerUp() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
  }

  function stopPropagation(e: React.PointerEvent) {
    e.stopPropagation();
  }

  function handleResetPosition() {
    onChange({ ...formData, heroImagePositionX: 50, heroImagePositionY: 50 });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="relative h-95 md:h-72">
        {/* Draggable image surface */}
        <div
          className="absolute inset-0"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            cursor: isEditing && hasHeroImage
              ? isDragging
                ? "grabbing"
                : "grab"
              : "default",
          }}
        >
          {hasHeroImage ? (
            <div
              className="absolute inset-0 bg-cover bg-no-repeat"
              style={{
                backgroundImage: `url(${formData.heroImage})`,
                backgroundPosition: `${posX}% ${posY}%`,
              }}
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

          {/* Drag-to-reposition hint pill */}
          {isEditing && hasHeroImage && !isDragging && (
            <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 md:bottom-16">
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                <MoveHorizontal className="h-3.5 w-3.5" />
                {copy.dragToReposition}
              </span>
            </div>
          )}
        </div>

        {/* Hidden file input */}
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

        {/* Edit-mode overlay buttons: Change photo + Reset */}
        {isEditing && hasHeroImage && (
          <div className="absolute left-3 top-3 z-10 flex gap-2">
            <button
              aria-label={copy.changePhoto}
              className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-50"
              disabled={isUploadingHeroImage}
              onClick={() => fileInputRef.current?.click()}
              onPointerDown={stopPropagation}
              type="button"
            >
              <Camera className="h-3.5 w-3.5" />
              {isUploadingHeroImage ? copy.saving : copy.changePhoto}
            </button>
            <button
              aria-label={copy.resetPosition}
              className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              onClick={handleResetPosition}
              onPointerDown={stopPropagation}
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {copy.resetPosition}
            </button>
          </div>
        )}

        {/* Edit-mode upload hint when no image */}
        {isEditing && !hasHeroImage && (
          <button
            aria-label={copy.uploadHint}
            className="absolute inset-0 z-10 flex items-center justify-center"
            disabled={isUploadingHeroImage}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white">
              <Camera className="h-4 w-4" />
              {isUploadingHeroImage ? copy.saving : copy.uploadHint}
            </span>
          </button>
        )}

        {/* Edit / Save / Cancel buttons */}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {!isEditing ? (
            <Button
              aria-label={copy.editProfile}
              className="px-2.5 sm:px-6"
              onClick={onEdit}
              onPointerDown={stopPropagation}
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
                onPointerDown={stopPropagation}
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
                onPointerDown={stopPropagation}
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
