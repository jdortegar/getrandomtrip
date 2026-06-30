import { EXPERIENCE_LEVELS, getExperienceTypes } from "@/lib/constants/packages";

interface ExperienceTypePillsProps {
  types: string[];
  level?: string | null;
  locale: string;
}

export function ExperienceTypePills({
  types,
  level,
  locale,
}: ExperienceTypePillsProps) {
  const typeOptions = getExperienceTypes(locale);
  const levelLabel = level
    ? (EXPERIENCE_LEVELS.find((l) => l.value === level)?.label ?? level)
    : null;

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {types.map((t) => (
          <span
            key={t}
            className="rounded-[6px] border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700"
          >
            {typeOptions.find((et) => et.value === t)?.label ?? t}
          </span>
        ))}
      </div>
      {levelLabel && (
        <p className="mt-1 text-xs text-neutral-500">{levelLabel}</p>
      )}
    </div>
  );
}
