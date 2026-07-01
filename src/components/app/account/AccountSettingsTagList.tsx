"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

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
        <span
          key={item}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
        >
          {item}
          {editing && (
            <button
              aria-label={removeAriaLabel}
              className="text-neutral-400 transition-colors hover:text-neutral-700"
              onClick={() => onRemove(item)}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      ))}
      {editing && (
        <span className="flex items-center gap-1.5">
          <input
            className="h-8 w-32 rounded-full border border-dashed border-gray-300 bg-transparent px-3 text-sm text-neutral-700 outline-none focus:border-light-blue"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            type="text"
            value={draft}
          />
          <button
            aria-label={addAriaLabel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-light-blue text-white transition-opacity hover:opacity-90"
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
