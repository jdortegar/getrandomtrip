"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import RemovableTag from "@/components/RemovableTag";

interface AccountSettingsTagListProps {
  items: string[];
  editing: boolean;
  onRemove: (value: string) => void;
  onAdd: (value: string) => void;
  placeholder: string;
  addAriaLabel: string;
  removeAriaLabel: string;
}

export function AccountSettingsTagList({
  items,
  editing,
  onRemove,
  onAdd,
  placeholder,
  addAriaLabel,
  removeAriaLabel,
}: AccountSettingsTagListProps) {
  const [draft, setDraft] = useState("");

  const submitDraft = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitDraft();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <RemovableTag
          key={item}
          item={{
            key: item,
            value: item,
            onRemove: editing ? () => onRemove(item) : undefined,
          }}
          color="secondary"
          size="sm"
        />
      ))}
      {editing && (
        <span className="flex items-center gap-1.5">
          <input
            className="h-8 w-32 rounded-full border border-dashed border-gray-300 bg-transparent px-3 text-sm text-neutral-700 outline-none focus:border-secondary"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            type="text"
            value={draft}
          />
          <button
            aria-label={addAriaLabel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-white transition-opacity hover:opacity-90"
            onClick={submitDraft}
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </span>
      )}
    </div>
  );
}
