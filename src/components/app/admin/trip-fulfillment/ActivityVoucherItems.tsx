"use client";

import { DocumentValidationGroup } from "./DocumentValidationGroup";
import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { VoucherItem } from "@/lib/types/VoucherData";
import type { HotelVoucherFormCopy } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface ActivityVoucherItemsProps {
  addLabel: string;
  copy: HotelVoucherFormCopy;
  items: VoucherItem[];
  onChange: (items: VoucherItem[]) => void;
  section: "program" | "inclusions";
  title: string;
}
export function ActivityVoucherItems({
  addLabel,
  copy,
  items,
  onChange,
  section,
  title,
}: ActivityVoucherItemsProps) {
  function edit(id: string, patch: Partial<VoucherItem>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  return (
    <DocumentValidationGroup
      name={`data.${section}`}
      className="flex flex-col gap-3"
      data-item-section={section}
    >
      <legend>{title}</legend>
      {items.map((item, index) => (
        <div
          className="flex flex-col gap-2 rounded border border-gray-200 p-3"
          key={item.id}
        >
          <FormField
            data-item-title
            id={`activity-${section}-${item.id}`}
            name={`data.${section}.${index}.title`}
            label={`${title} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { title: e.target.value })}
            required
            value={item.title}
          />
          <TextAreaInput
            id={`activity-${section}-description-${item.id}`}
            name={`data.${section}.${index}.description`}
            label={`${copy.description} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { description: e.target.value })}
            value={item.description ?? ""}
          />
          <button
            aria-label={`${copy.up} ${title} ${index + 1}`}
            className={styles.btn}
            data-up
            disabled={index === 0}
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
            data-remove
            onClick={() => onChange(items.filter((row) => row.id !== item.id))}
            type="button"
          >
            {copy.remove}
          </button>
        </div>
      ))}
      <button
        aria-label={`${addLabel}: ${title}`}
        className={styles.btn}
        data-add
        disabled={items.length >= 50}
        onClick={() =>
          onChange([...items, { id: crypto.randomUUID(), title: "" }])
        }
        type="button"
      >
        {addLabel}
      </button>
    </DocumentValidationGroup>
  );
}
