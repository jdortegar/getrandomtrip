"use client";

import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { VoucherItem } from "@/lib/types/VoucherData";
import type { HotelVoucherFormCopy } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface DinnerVoucherMenuProps {
  addLabel: string;
  copy: HotelVoucherFormCopy;
  items: VoucherItem[];
  onChange: (items: VoucherItem[]) => void;
  disabled: boolean;
  title: string;
}
export function DinnerVoucherMenu({
  addLabel,
  copy,
  items,
  onChange,
  disabled,
  title,
}: DinnerVoucherMenuProps) {
  function edit(id: string, patch: Partial<VoucherItem>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend>{title}</legend>
      {items.map((item, index) => (
        <div
          className="flex flex-col gap-2 rounded border border-gray-200 p-3"
          key={item.id}
        >
          <FormField
            data-menu-title
            id={`dinner-menu-${item.id}`}
            label={`${title} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { title: e.target.value })}
            required
            value={item.title}
          />
          <TextAreaInput
            data-menu-description
            id={`dinner-menu-description-${item.id}`}
            label={`${copy.description} ${index + 1}`}
            maxLength={4000}
            onChange={(e) => edit(item.id, { description: e.target.value })}
            value={item.description ?? ""}
          />
          <button
            aria-label={`${copy.up} ${title} ${index + 1}`}
            className={styles.btn}
            data-menu-up
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
            data-menu-remove
            disabled={disabled}
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
        data-add-menu
        disabled={disabled || items.length >= 50}
        onClick={() =>
          onChange([...items, { id: crypto.randomUUID(), title: "" }])
        }
        type="button"
      >
        {addLabel}
      </button>
    </fieldset>
  );
}
