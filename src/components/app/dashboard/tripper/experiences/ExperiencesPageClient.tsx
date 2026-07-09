// src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx
"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { ExperienceTypePills } from "@/components/common/ExperienceTypePills";
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  EXPERIENCE_LEVELS,
  EXPERIENCE_STATUSES,
  getExperienceTypes,
} from "@/lib/constants/packages";
import type { ExperienceListItem } from "@/types/tripper";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";

const SELECT_CLASS =
  "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";

/** Splits a "...{{title}}..." template and renders the interpolated part in bold. */
function renderBoldTitleMessage(template: string, title: string) {
  const [before, after] = template.split("{{title}}");
  return (
    <>
      {before}
      <strong className="font-semibold text-gray-900">{title}</strong>
      {after}
    </>
  );
}

interface ExperiencesPageClientProps {
  experiences: ExperienceListItem[];
  dict: TripperExperiencesDict;
  locale: string;
}

export default function ExperiencesPageClient({
  experiences,
  dict: copy,
  locale,
}: ExperiencesPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTravelType, setSelectedTravelType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Holds the id of the experience the user wants to delete. null = modal closed.
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const scrollToFilters = useCallback(() => {
    filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hasActiveFilters =
    selectedStatus !== "all" ||
    selectedTravelType !== "all" ||
    selectedLevel !== "all";

  function clearFilters() {
    setSelectedStatus("all");
    setSelectedTravelType("all");
    setSelectedLevel("all");
  }

  const filtered = experiences.filter((experience) => {
    const travelTypeMatch =
      selectedTravelType === "all" ||
      experience.type.includes(selectedTravelType);
    const statusMatch =
      selectedStatus === "all" || experience.status === selectedStatus;
    const levelMatch =
      selectedLevel === "all" || experience.level === selectedLevel;
    return travelTypeMatch && statusMatch && levelMatch;
  });

  const basePath = `/${locale}/dashboard/tripper/experiences`;
  const deleteTargetExperience = experiences.find(
    (e) => e.id === deleteTargetId,
  );

  function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tripper/experiences/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.refresh();
        }
      } finally {
        setDeletingId(null);
      }
    });
  }

  function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tripper/experiences/${id}`, {
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
          body: JSON.stringify({ isActive: !current }),
        });
        if (res.ok) {
          router.refresh();
        }
      } finally {
        setTogglingId(null);
      }
    });
  }

  return (
    <div className="space-y-6 text-left">
      {/* Section header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
            {copy.title}
          </h2>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-sm border-2 border-gray-900 bg-gray-900 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-gray-800"
        >
          <Link href={`${basePath}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.newExperience}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div
        ref={filtersRef}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className={SELECT_CLASS}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              scrollToFilters();
            }}
            value={selectedStatus}
          >
            <option value="all">{copy.filters.allStatuses}</option>
            {EXPERIENCE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {copy.status[s.value as keyof typeof copy.status]}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => {
              setSelectedTravelType(e.target.value);
              scrollToFilters();
            }}
            value={selectedTravelType}
          >
            <option value="all">{copy.filters.allTypes}</option>
            {getExperienceTypes(locale).map((travelType) => (
              <option key={travelType.value} value={travelType.value}>
                {travelType.label}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => {
              setSelectedLevel(e.target.value);
              scrollToFilters();
            }}
            value={selectedLevel}
          >
            <option value="all">{copy.filters.allLevels}</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
          {hasActiveFilters && (
            <button
              className="flex h-11 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-medium text-neutral-600 transition-colors hover:border-gray-300 hover:bg-neutral-50"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" />
              {copy.filters.clearFilters}
            </button>
          )}
        </div>
        <span className="text-[13px] text-neutral-400">
          {filtered.length} {copy.filters.of} {experiences.length}{" "}
          {copy.filters.count}
        </span>
      </div>

      {/* Table panel */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-sm text-neutral-500">
              {experiences.length === 0
                ? copy.emptyState.noExperiences
                : copy.emptyState.noMatch}
            </p>
            {experiences.length === 0 && (
              <Button asChild className="mx-auto max-w-xs" size="sm">
                <Link href={`${basePath}/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {copy.emptyState.createFirst}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.package}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.typeLevel}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.status}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.duration}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.capacity}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.price}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.updated}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((experience) => {
                  const editHref =
                    experience.status === "PENDING_TRIPPER_REVIEW"
                      ? `${basePath}/${experience.id}/review-copy`
                      : `${basePath}/${experience.id}`;
                  const isBusy =
                    deletingId === experience.id ||
                    togglingId === experience.id ||
                    isPending;

                  return (
                    <tr
                      key={experience.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      {/* Experience */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          {experience.title}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {experience.destinationCity},{" "}
                          {experience.destinationCountry}
                        </p>
                      </td>

                      {/* Type / Level */}
                      <td className="px-5 py-4">
                        <ExperienceTypePills
                          types={experience.type}
                          level={experience.level}
                          locale={locale}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <ExperienceStatusBadge
                          status={experience.status}
                          label={
                            copy.status[
                              experience.status as keyof typeof copy.status
                            ] ?? experience.status
                          }
                        />
                      </td>

                      {/* Duration */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-700">
                        {experience.minNights === experience.maxNights
                          ? `${experience.minNights}n`
                          : `${experience.minNights}–${experience.maxNights}n`}
                      </td>

                      {/* Capacity */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-700">
                        {experience.minPax === experience.maxPax
                          ? `${experience.minPax}`
                          : `${experience.minPax}–${experience.maxPax}`}
                        {" pax"}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        <span className="font-barlow-condensed text-lg font-bold leading-none text-gray-900">
                          {experience.pricingByType
                            ? `USD ${Math.min(
                                ...Object.values(experience.pricingByType),
                              ).toLocaleString()}+`
                            : "—"}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-5 py-4 text-sm text-neutral-500">
                        {new Date(experience.updatedAt).toLocaleDateString(
                          locale.startsWith("en") ? "en-US" : "es-ES",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <TableIconLink href={editHref} title={copy.table.edit}>
                            <Pencil className="h-4 w-4" />
                          </TableIconLink>
                          <TableIconButton
                            disabled={isBusy}
                            onClick={() =>
                              handleToggleActive(
                                experience.id,
                                experience.isActive,
                              )
                            }
                            title={
                              experience.isActive
                                ? copy.table.unpublish
                                : copy.table.publish
                            }
                          >
                            {experience.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4 text-light-blue" />
                            )}
                          </TableIconButton>
                          <TableIconButton
                            danger
                            disabled={isBusy}
                            onClick={() => handleDelete(experience.id)}
                            title={copy.table.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </TableIconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        isConfirming={isPending}
        icon={Trash2}
        tone="danger"
        title={copy.table.deleteTitle}
        description={
          deleteTargetExperience
            ? renderBoldTitleMessage(
                copy.table.deleteConfirmMessage,
                deleteTargetExperience.title,
              )
            : null
        }
        cancelLabel={copy.form.cancel}
        confirmLabel={copy.table.delete}
      />
    </div>
  );
}
