"use client";

import { DocumentValidationGroup } from "./DocumentValidationGroup";
import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { SuggestedActivity } from "@/lib/types/ExperienceRoadmap";
import type {
  HotelVoucherFormCopy,
  ExperienceRoadmapPdfCopy,
} from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface ExperienceRoadmapActivitiesProps {
  roadmapCopy: ExperienceRoadmapPdfCopy;
  copy: HotelVoucherFormCopy;
  items: SuggestedActivity[];
  onChange: (items: SuggestedActivity[]) => void;
  disabled: boolean;
  title: string;
}
export function ExperienceRoadmapActivities({
  roadmapCopy,
  copy,
  items,
  onChange,
  disabled,
  title,
}: ExperienceRoadmapActivitiesProps) {
  function edit(id: string, patch: Partial<SuggestedActivity>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  return (
    <DocumentValidationGroup
      name={`data.activities`}
      className="flex flex-col gap-3"
      disabled={disabled}
    >
      <legend>{title}</legend>
      {items.map((item, index) => (
        <div
          className="flex flex-col gap-2 rounded border border-gray-200 p-3"
          key={item.id}
        >
          <FormField
            data-stop-title
            id={`experience-stop-${item.id}`}
            name={`data.activities.${index}.title`}
            label={`${title} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { title: e.target.value })}
            required
            value={item.title}
          />
          <TextAreaInput
            data-stop-description
            id={`experience-stop-description-${item.id}`}
            name={`data.activities.${index}.description`}
            label={`${copy.description} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { description: e.target.value })}
            required
            value={item.description ?? ""}
          />
          {(["date", "time"] as const).map((key) => (
            <FormField
              {...{ [`data-stop-${key}`]: true }}
              id={`experience-stop-${key}-${item.id}`}
              name={`data.activities.${index}.${key}`}
              key={key}
              label={`${roadmapCopy[key]} ${index + 1}`}
              onChange={(event) => edit(item.id, { [key]: event.target.value })}
              type={key}
              value={item[key] ?? ""}
            />
          ))}
          <button
            aria-label={`${copy.up} ${title} ${index + 1}`}
            className={styles.btn}
            data-stop-up
            disabled={disabled || index === 0}
            onClick={() => {
              const reordered = [...items];
              [reordered[index - 1], reordered[index]] = [
                reordered[index],
                reordered[index - 1],
              ];
              onChange(reordered);
            }}
            type="button"
          >
            {copy.up}
          </button>
          <button
            aria-label={`${copy.remove} ${title} ${index + 1}`}
            className={styles.btn}
            data-stop-remove
            disabled={disabled}
            onClick={() => onChange(items.filter((row) => row.id !== item.id))}
            type="button"
          >
            {copy.remove}
          </button>
        </div>
      ))}
      <button
        aria-label={`${roadmapCopy.addActivity}: ${title}`}
        className={styles.btn}
        data-add-stop
        disabled={disabled || items.length >= 50}
        onClick={() =>
          onChange([
            ...items,
            { id: crypto.randomUUID(), title: "", description: "" },
          ])
        }
        type="button"
      >
        {roadmapCopy.addActivity}
      </button>
    </DocumentValidationGroup>
  );
}
