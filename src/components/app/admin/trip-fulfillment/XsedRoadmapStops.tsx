"use client";

import { DocumentValidationGroup } from "./DocumentValidationGroup";
import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { XsedRoadmapStop } from "@/lib/types/XsedRoadmap";
import type {
  HotelVoucherFormCopy,
  XsedRoadmapPdfCopy,
} from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface XsedRoadmapStopsProps {
  roadmapCopy: XsedRoadmapPdfCopy;
  copy: HotelVoucherFormCopy;
  items: XsedRoadmapStop[];
  onChange: (items: XsedRoadmapStop[]) => void;
  disabled: boolean;
  title: string;
}
export function XsedRoadmapStops({
  roadmapCopy,
  copy,
  items,
  onChange,
  disabled,
  title,
}: XsedRoadmapStopsProps) {
  function edit(id: string, patch: Partial<XsedRoadmapStop>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  return (
    <DocumentValidationGroup
      name={`data.stops`}
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
            id={`xsed-stop-${item.id}`}
            name={`data.stops.${index}.title`}
            label={`${title} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { title: e.target.value })}
            required
            value={item.title}
          />
          <TextAreaInput
            data-stop-directions
            id={`xsed-stop-directions-${item.id}`}
            name={`data.stops.${index}.directions`}
            label={`${roadmapCopy.directions} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { directions: e.target.value })}
            required
            value={item.directions ?? ""}
          />
          {(["date", "time"] as const).map((key) => (
            <FormField
              {...{ [`data-stop-${key}`]: true }}
              id={`xsed-stop-${key}-${item.id}`}
              name={`data.stops.${index}.${key}`}
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
        aria-label={`${roadmapCopy.addStop}: ${title}`}
        className={styles.btn}
        data-add-stop
        disabled={disabled || items.length >= 50}
        onClick={() =>
          onChange([
            ...items,
            { id: crypto.randomUUID(), title: "", directions: "" },
          ])
        }
        type="button"
      >
        {roadmapCopy.addStop}
      </button>
    </DocumentValidationGroup>
  );
}
