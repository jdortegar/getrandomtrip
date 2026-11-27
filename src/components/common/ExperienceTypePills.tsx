import { normalizeExperienceClassification } from "@/lib/experiences/xsedExperience";
import {
  EXPERIENCE_LEVELS,
  getExperienceTypes,
} from "@/lib/constants/packages";
import { ProductBadge } from "@/components/common/ProductBadge";
import { Badge } from "@/components/ui/Badge";

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
  const classification = normalizeExperienceClassification({
    type: types,
    level,
  });
  const displayLevel =
    level || types.includes("XSED") ? classification.level : null;
  const typeOptions = getExperienceTypes(locale);
  const levelLabel = displayLevel
    ? (EXPERIENCE_LEVELS.find((l) => l.value === displayLevel)?.label ??
      displayLevel)
    : null;

  return (
    <div data-component="ExperienceTypePills">
      <div className="flex flex-wrap gap-1">
        {classification.type.map((t) => (
          <ProductBadge
            key={t}
            value={typeOptions.find((et) => et.value === t)?.label ?? t}
          />
        ))}
        {levelLabel && <Badge kind="level" label={levelLabel} />}
      </div>
    </div>
  );
}
