// src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx
"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  EXPERIENCE_LEVELS,
  getExperienceTypes,
  EXPERIENCE_STATUSES,
} from "@/lib/constants/packages";
import type { ExperienceListItem } from "@/types/tripper";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PENDING_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  INACTIVE: "bg-red-100 text-red-800 border-red-200",
  ARCHIVED: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

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
  const filtersRef = useRef<HTMLDivElement>(null);

  const scrollToFilters = useCallback(() => {
    filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const filtered = experiences.filter((experience) => {
    const travelTypeMatch =
      selectedTravelType === "all" || experience.type.includes(selectedTravelType);
    const statusMatch =
      selectedStatus === "all" || experience.status === selectedStatus;
    const levelMatch =
      selectedLevel === "all" || experience.level === selectedLevel;
    return travelTypeMatch && statusMatch && levelMatch;
  });

  const basePath = `/${locale}/dashboard/tripper/experiences`;

  function handleDelete(id: string) {
    if (!confirm(copy.table.deleteConfirm)) return;
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div ref={filtersRef} className="flex gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <Select
            onChange={(e) => { setSelectedStatus(e.target.value); scrollToFilters(); }}
            value={selectedStatus}
          >
            <option value="all">{copy.filters.allStatuses}</option>
            {EXPERIENCE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {copy.status[s.value]}
              </option>
            ))}
          </Select>
          <Select
            onChange={(e) => { setSelectedTravelType(e.target.value); scrollToFilters(); }}
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
            onChange={(e) => { setSelectedLevel(e.target.value); scrollToFilters(); }}
            value={selectedLevel}
          >
            <option value="all">{copy.filters.allLevels}</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {copy.newExperience}
          </Link>
        </Button>
      </div>

      {/* Table panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-neutral-500 mb-4">
              {experiences.length === 0
                ? copy.emptyState.noExperiences
                : copy.emptyState.noMatch}
            </p>
            {experiences.length === 0 && (
              <Button asChild size="sm" className="max-w-xs mx-auto">
                <Link href={`${basePath}/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {copy.emptyState.createFirst}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.package}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.typeLevel}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.status}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.duration}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.capacity}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.price}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.updated}
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-left">
                {filtered.map((experience) => (
                  <tr
                    key={experience.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-neutral-900">
                        {experience.title}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {experience.destinationCity},{" "}
                        {experience.destinationCountry}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-neutral-700 capitalize">
                        {experience.type
                          .map(
                            (t) =>
                              getExperienceTypes(locale).find((et) => et.value === t)
                                ?.label ?? t,
                          )
                          .join(", ")}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {EXPERIENCE_LEVELS.find(
                          (level) => level.value === experience.level,
                        )?.label ?? experience.level}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${
                          STATUS_COLORS[experience.status] ??
                          STATUS_COLORS.DRAFT
                        }`}
                      >
                        {copy.status[
                          experience.status as keyof typeof copy.status
                        ] ?? experience.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700 whitespace-nowrap">
                      {experience.minNights === experience.maxNights
                        ? `${experience.minNights}n`
                        : `${experience.minNights}–${experience.maxNights}n`}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700 whitespace-nowrap">
                      {experience.minPax === experience.maxPax
                        ? `${experience.minPax}`
                        : `${experience.minPax}–${experience.maxPax}`}
                      {" pax"}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {experience.pricingByType
                        ? `USD ${Math.min(...Object.values(experience.pricingByType)).toLocaleString()}+`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {new Date(experience.updatedAt).toLocaleDateString(
                        locale.startsWith("en") ? "en-US" : "es-ES",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          title={copy.table.edit}
                          className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                        >
                          <Link href={`${basePath}/${experience.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={copy.table.delete}
                          className="h-8 w-8 p-0 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                          disabled={deletingId === experience.id || isPending}
                          onClick={() => handleDelete(experience.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
