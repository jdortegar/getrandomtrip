// src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Plus } from "lucide-react";
import {
  EXPERIENCE_LEVELS,
  EXPERIENCE_TYPES,
  EXPERIENCE_STATUSES,
} from "@/lib/constants/packages";
import type { ExperienceListItem } from "@/types/tripper";
import type { PackagesDict } from "@/lib/types/dictionary";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVE: "bg-red-100 text-red-800 border-red-200",
  ARCHIVED: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const selectClassName = "";

interface ExperiencesPageClientProps {
  experiences: ExperienceListItem[];
  dict: PackagesDict;
  locale: string;
}

export default function ExperiencesPageClient({
  experiences,
  dict: copy,
  locale,
}: ExperiencesPageClientProps) {
  const [selectedTravelType, setSelectedTravelType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const filtered = experiences.filter((experience) => {
    const travelTypeMatch =
      selectedTravelType === "all" || experience.type === selectedTravelType;
    const statusMatch =
      selectedStatus === "all" || experience.status === selectedStatus;
    const levelMatch =
      selectedLevel === "all" || experience.level === selectedLevel;
    return travelTypeMatch && statusMatch && levelMatch;
  });

  const availableLevels = Array.from(
    new Set(experiences.map((experience) => experience.level)),
  ).sort();

  const availableTravelTypes = Array.from(
    new Set(experiences.map((experience) => experience.type)),
  ).sort();

  const basePath = `/${locale}/dashboard/tripper/experiences`;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-center mb-14">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-2">
            Tripper OS
          </p>
          <h1 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{copy.description}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <Select
            className={selectClassName}
            onChange={(e) => setSelectedStatus(e.target.value)}
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
            className={selectClassName}
            onChange={(e) => setSelectedTravelType(e.target.value)}
            value={selectedTravelType}
          >
            <option value="all">{copy.filters.allTypes}</option>
            {EXPERIENCE_TYPES.map((travelType) => (
              <option key={travelType.value} value={travelType.value}>
                {travelType.label}
              </option>
            ))}
          </Select>

          <Select
            className={selectClassName}
            onChange={(e) => setSelectedLevel(e.target.value)}
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
            {copy.newPackage}
          </Link>
        </Button>
      </div>

      {/* Table panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-neutral-500 mb-4">
              {experiences.length === 0
                ? copy.emptyState.noPackages
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
                    {copy.table.price}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.updated}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
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
                        {EXPERIENCE_TYPES.find(
                          (type) => type.value === experience.type,
                        )?.label ?? experience.type}
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
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {experience.displayPrice ||
                        `USD ${experience.basePriceUsd.toLocaleString()}`}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {new Date(experience.updatedAt).toLocaleDateString(
                        locale.startsWith("en") ? "en-US" : "es-ES",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`${basePath}/${experience.id}`}>
                        {copy.table.edit}
                      </Link>
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
