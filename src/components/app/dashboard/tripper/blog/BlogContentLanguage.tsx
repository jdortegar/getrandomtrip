"use client";

import { useId, type Ref } from "react";
import { FormSelectField } from "@/components/ui/FormField";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";

interface BlogContentLanguageProps {
  copy: TripperBlogFormDict["contentLanguage"];
  disabled?: boolean;
  locale: "es" | "en";
  onChange: (locale: "es" | "en") => void;
  selectRef?: Ref<HTMLSelectElement>;
}

export function BlogContentLanguage({
  copy,
  disabled,
  locale,
  onChange,
  selectRef,
}: BlogContentLanguageProps) {
  const id = useId();

  return (
    <div className="space-y-2" data-component="BlogContentLanguage">
      <FormSelectField
        aria-describedby={`${id}-hint`}
        disabled={disabled}
        id={id}
        label={copy.label}
        onChange={(event) => {
          const value = event.target.value;
          if (!disabled && (value === "es" || value === "en")) onChange(value);
        }}
        ref={selectRef}
        value={locale}
      >
        {(["es", "en"] as const).map((language) => (
          <option key={language} value={language}>
            {copy[language]}
          </option>
        ))}
      </FormSelectField>
      <p className="text-neutral-600 text-xs" id={`${id}-hint`}>
        {copy.hint}
      </p>
    </div>
  );
}
