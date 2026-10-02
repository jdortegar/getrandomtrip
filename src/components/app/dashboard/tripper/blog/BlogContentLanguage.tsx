"use client";

import { ChevronDown } from "lucide-react";
import { useId, type Ref } from "react";
import { FormSelectField } from "@/components/ui/FormField";
import { formControlClass, formLabelClass } from "@/components/ui/formControlClass";
import { cn } from "@/lib/utils";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";

interface BlogContentLanguageProps {
  copy: TripperBlogFormDict["contentLanguage"];
  disabled?: boolean;
  inline?: boolean;
  locale: "es" | "en";
  onChange: (locale: "es" | "en") => void;
  selectRef?: Ref<HTMLSelectElement>;
}

export function BlogContentLanguage({
  copy,
  disabled,
  inline = false,
  locale,
  onChange,
  selectRef,
}: BlogContentLanguageProps) {
  const id = useId();

  function handleChange(value: string) {
    if (!disabled && (value === "es" || value === "en")) onChange(value);
  }

  if (inline) {
    return (
      <div className="contents" data-component="BlogContentLanguage">
        <label className={cn(formLabelClass, "basis-full")} htmlFor={id}>
          {copy.label}
        </label>
        <div className="relative w-48">
          <select
            aria-describedby={`${id}-hint`}
            className={cn(
              formControlClass,
              "appearance-none cursor-pointer pr-12 py-2 w-48",
            )}
            disabled={disabled}
            id={id}
            onChange={(event) => handleChange(event.target.value)}
            ref={selectRef}
            value={locale}
          >
            {(["es", "en"] as const).map((language) => (
              <option key={language} value={language}>
                {copy[language]}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="absolute -translate-y-1/2 h-5 pointer-events-none right-4 text-gray-500 top-1/2 w-5"
          />
        </div>
        <p className="sr-only" id={`${id}-hint`}>
          {copy.hint}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-component="BlogContentLanguage">
      <FormSelectField
        aria-describedby={`${id}-hint`}
        disabled={disabled}
        id={id}
        label={copy.label}
        onChange={(event) => handleChange(event.target.value)}
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
