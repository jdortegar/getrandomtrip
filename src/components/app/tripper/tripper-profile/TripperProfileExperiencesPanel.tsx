'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TripperProfilePageDict } from '@/lib/types/dictionary';
import type { TripperOwnExperienceListItem } from '@/types/tripper';

interface TripperProfileExperiencesPanelProps {
  copy: TripperProfilePageDict;
  experiences: TripperOwnExperienceListItem[];
  experiencesPath: string;
  replaceCount: (template: string, n: number) => string;
}

export function TripperProfileExperiencesPanel({
  copy,
  experiences,
  experiencesPath,
  replaceCount,
}: TripperProfileExperiencesPanelProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold leading-none tracking-tight text-neutral-900">
          {copy.sections.experiences}
        </h2>
        <Button asChild size="sm" variant="default">
          <Link href={experiencesPath}>
            <Package className="mr-2 h-4 w-4" />
            {copy.experiences.manageCta}
          </Link>
        </Button>
      </div>
      {experiences.length > 0 ? (
        <div className="space-y-4">
          <p className="mb-4 text-sm text-neutral-600">
            {replaceCount(copy.experiences.countBlurb, experiences.length)}
          </p>
          <div className="grid gap-4">
            {experiences.slice(0, 5).map((experience) => (
              <div
                className="rounded-xl border border-neutral-200 p-4 transition-all duration-300 hover:shadow-md"
                key={experience.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{experience.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{experience.teaser}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                      <span>
                        {experience.type} • {experience.level}
                      </span>
                      <span>
                        {experience.minNights}-{experience.maxNights} {copy.experiences.nightsLabel}
                      </span>
                      <span>
                        {experience.minPax}-{experience.maxPax} {copy.experiences.peopleLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-neutral-900">{experience.displayPrice}</p>
                    <p className="text-sm text-neutral-500">
                      {experience.isActive
                        ? copy.experiences.active
                        : copy.experiences.inactive}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {experiences.length > 5 ? (
            <div className="pt-4 text-center">
              <Button asChild variant="outline">
                <Link href={experiencesPath}>
                  {replaceCount(copy.experiences.viewAll, experiences.length)}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
          <p className="mb-4 text-base text-neutral-600">{copy.experiences.emptyTitle}</p>
          <Button asChild variant="default">
            <Link href={experiencesPath}>
              <Package className="mr-2 h-4 w-4" />
              {copy.experiences.emptyCta}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
