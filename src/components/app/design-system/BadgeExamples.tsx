"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProductBadge } from "@/components/common/ProductBadge";
import Chip from "@/components/Chip";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface BadgeExamplesProps {
  copy: DesignSystemDict;
}

export function BadgeExamples({ copy }: BadgeExamplesProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const labels = copy.badges;
  return (
    <>
      <div className={cn("gap-6 grid", "lg:grid-cols-2")}>
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <h3 className="font-semibold mb-5 text-xl">{labels.statusTitle}</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(labels.statuses).map(([status, label]) => (
              <ExperienceStatusBadge
                key={status}
                label={label}
                status={status}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <ProductBadge value="XSED" />
            {labels.chips.map((label) => (
              <Badge key={label} label={label} />
            ))}
          </div>
          <p className="mt-5 text-neutral-600 text-sm">{labels.statusHint}</p>
        </div>
        <div className="bg-accent border border-gray-200 p-6 rounded-xl">
          <h3 className="font-semibold mb-5 text-xl">{labels.chipTitle}</h3>
          <div
            aria-label={labels.chipTitle}
            className="flex flex-wrap gap-3"
            role="group"
          >
            {labels.chips.map((label) => (
              <Chip
                active={selected.includes(label)}
                key={label}
                onClick={() =>
                  setSelected((values) =>
                    values.includes(label)
                      ? values.filter((value) => value !== label)
                      : [...values, label],
                  )
                }
                size="touch"
              >
                {label}
              </Chip>
            ))}
          </div>
          <p className="mt-5 text-neutral-600 text-sm" role="status">
            {labels.selected.replace("{count}", String(selected.length))}
          </p>
        </div>
      </div>
      <UsageExample
        code={`<ExperienceStatusBadge label={copy.status.ACTIVE} status="ACTIVE" />
<Badge label={copy.category} />
<Chip active={selected} onClick={() => setSelected(!selected)}>{copy.category}</Chip>`}
        label={copy.usage}
      />
    </>
  );
}
