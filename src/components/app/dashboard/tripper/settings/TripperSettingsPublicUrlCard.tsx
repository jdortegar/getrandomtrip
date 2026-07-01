"use client";

import { Check, Clipboard, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

interface TripperSettingsPublicUrlCardProps {
  copy: TripperDashboardDict["settingsProfile"]["publicUrl"];
  locale: Locale;
  slug: string;
  isEditing: boolean;
  onSlugChange: (slug: string) => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function TripperSettingsPublicUrlCard({
  copy,
  locale,
  slug,
  isEditing,
  onSlugChange,
}: TripperSettingsPublicUrlCardProps) {
  const [copied, setCopied] = useState(false);
  const publicPath = pathForLocale(locale, `/trippers/${slug}`);

  async function handleCopy() {
    const url = `${window.location.origin}${publicPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied — silently ignore, button stays clickable
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.heading}
        </h2>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <span className="truncate text-sm text-neutral-500">
          {copy.domainPrefix}
        </span>
        {isEditing ? (
          <input
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none"
            onChange={(e) => onSlugChange(slugify(e.target.value))}
            placeholder={copy.slugPlaceholder}
            type="text"
            value={slug}
          />
        ) : (
          <span className="truncate text-sm font-semibold text-gray-900">
            {slug}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={handleCopy}
          size="sm"
          type="button"
          variant="secondary"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
          {copied ? copy.copied : copy.copyLink}
        </Button>
        <Button asChild size="icon" variant="secondary">
          <Link href={publicPath} title={copy.openLink}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
