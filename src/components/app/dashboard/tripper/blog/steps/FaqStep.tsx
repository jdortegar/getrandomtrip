"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";

interface Props {
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  onChange: BlogFormDraftOnChange;
}

const EMPTY_FAQ = { question: "", answer: "" };

export function FaqStep({ copy, draft, onChange }: Props) {
  const { fields } = copy;

  function updateFaq(index: number, key: "question" | "answer", value: string) {
    const updated = draft.faq.map((f, i) => (i === index ? { ...f, [key]: value } : f));
    onChange("faq", updated);
  }

  function addFaq() {
    onChange("faq", [...draft.faq, { ...EMPTY_FAQ }]);
  }

  function removeFaq(index: number) {
    onChange(
      "faq",
      draft.faq.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[2]?.substeps[0]?.description}
      </p>

      <div className="space-y-6">
        {draft.faq.map((item, index) => (
          <div className="space-y-4" key={index}>
            {index > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm text-neutral-500">
                  {fields.faqLabel} {index + 1}
                </span>
                <button
                  className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-red-500"
                  onClick={() => removeFaq(index)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                  {fields.removeFaq}
                </button>
              </div>
            )}

            <FormField
              id={`faq-question-${index}`}
              label={`${fields.faqQuestion} ${index + 1}`}
              onChange={(e) => updateFaq(index, "question", e.target.value)}
              placeholder={fields.faqQuestionPlaceholder}
              value={item.question}
            />

            <TextAreaInput
              id={`faq-answer-${index}`}
              label={fields.faqAnswer}
              onChange={(e) => updateFaq(index, "answer", e.target.value)}
              placeholder={fields.faqAnswerPlaceholder}
              value={item.answer}
            />
          </div>
        ))}
      </div>

      <button
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 transition-colors hover:border-gray-400 hover:text-neutral-700"
        onClick={addFaq}
        type="button"
      >
        + {fields.addFaq}
      </button>
    </div>
  );
}
