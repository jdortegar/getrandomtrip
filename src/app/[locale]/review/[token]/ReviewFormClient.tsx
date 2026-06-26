"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { ReviewFormDict } from "@/lib/types/dictionary";

interface ReviewFormClientProps {
  token: string;
  copy: ReviewFormDict;
}

export default function ReviewFormClient({
  token,
  copy,
}: ReviewFormClientProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState(false);
  const [contentError, setContentError] = useState(false);

  if (submitted) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          {copy.successTitle}
        </h2>
        <p className="text-sm text-neutral-600">{copy.successMessage}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation
    let hasError = false;
    if (rating === 0) {
      setRatingError(true);
      hasError = true;
    }
    if (!content.trim()) {
      setContentError(true);
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          content: content.trim(),
          title: title.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        setError(copy.errorAlreadySubmitted);
        return;
      }

      if (!res.ok) {
        setError(copy.errorGeneric);
        return;
      }

      setSubmitted(true);
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
      <form onSubmit={(e) => void handleSubmit(e)} noValidate>
        {/* Star Rating */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label className="font-normal text-gray-600 text-base">
              {copy.ratingLabel}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex gap-1" role="group" aria-label={copy.ratingLabel}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                aria-label={`${star}`}
                className="focus:outline-none p-1 touch-manipulation"
                key={star}
                onClick={() => {
                  setRating(star);
                  setRatingError(false);
                }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                type="button"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-neutral-300"
                  }`}
                />
              </button>
            ))}
            </div>
          </div>
          {ratingError && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {copy.ratingLabel}
            </p>
          )}
        </div>

        {/* Title (optional) */}
        <div className="mb-4">
          <FormField
            id="review-title"
            label={copy.titleLabel}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={copy.titlePlaceholder}
            type="text"
            value={title}
          />
        </div>

        {/* Content (required) */}
        <div className="mb-6">
          <TextAreaInput
            id="review-content"
            label={
              <span>
                {copy.contentLabel}
                <span className="text-red-500 ml-1">*</span>
              </span>
            }
            maxLength={1000}
            onChange={(e) => {
              setContent(e.target.value);
              if (e.target.value.trim()) setContentError(false);
            }}
            placeholder={copy.contentPlaceholder}
            value={content}
          />
          {contentError && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {copy.contentLabel}
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          disabled={submitting}
          size="lg"
          type="submit"
          variant="feature"
        >
          {submitting ? "..." : copy.submitButton}
        </Button>
      </form>
    </div>
  );
}
