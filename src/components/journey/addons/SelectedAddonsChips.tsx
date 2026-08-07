"use client";

import React from "react";
import { useStore } from "@/store/store";
import { ADDONS } from "@/lib/data/shared/addons-catalog";
import RemovableTag from "@/components/RemovableTag";

export default function SelectedAddonsChips() {
  const { addons, removeAddon } = useStore();
  const sel = addons?.selected ?? [];
  if (!sel.length) return null;

  return (
    <div className="mb-4 rounded-xl bg-neutral-50 ring-1 ring-neutral-200 p-3">
      <div className="text-sm font-medium text-neutral-700 mb-2">
        Tus add-ons ({sel.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {sel.map((s) => {
          const a = ADDONS.find((x) => x.id === s.id);
          if (!a) return null;
          return (
            <RemovableTag
              key={s.id}
              item={{
                key: s.id,
                value: `${a.title}${s.qty > 1 ? ` ×${s.qty}` : ""}`,
                onRemove: () => removeAddon(s.id),
              }}
              color="secondary"
              size="sm"
            />
          );
        })}
      </div>
    </div>
  );
}
