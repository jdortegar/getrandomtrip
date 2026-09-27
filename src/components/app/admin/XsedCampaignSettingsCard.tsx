"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { isCampaignDate } from "@/lib/xsed/campaign";

interface XsedCampaignSettingsCardProps {
  copy: MarketingDictionary["adminPages"]["features"]["xsedCampaign"];
  initialStartDate: string | null;
}

export function XsedCampaignSettingsCard({
  copy,
  initialStartDate,
}: XsedCampaignSettingsCardProps) {
  const [date, setDate] = useState(initialStartDate ?? "");
  const [savedDate, setSavedDate] = useState(initialStartDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const pending = useRef(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || initialStartDate === null) return;
    setError(null);
    setSaved(false);
    if (!isCampaignDate(date)) {
      setError(copy.invalidDate);
      return;
    }
    pending.current = true;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        body: JSON.stringify({ xsedCampaignStartDate: date }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = (await res.json()) as { xsedCampaignStartDate?: unknown };
      if (!res.ok || !isCampaignDate(data.xsedCampaignStartDate)) {
        setError(res.status === 400 ? copy.invalidDate : copy.errorSave);
        return;
      }
      setDate(data.xsedCampaignStartDate);
      setSavedDate(data.xsedCampaignStartDate);
      setSaved(true);
    } catch {
      setError(copy.errorSave);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <form
      className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm"
      noValidate
      onSubmit={handleSave}
    >
      <h3 className="font-semibold text-ink text-xl">{copy.title}</h3>
      <p
        className="max-w-xl mt-1 text-neutral-600 text-sm"
        id="xsed-campaign-hint"
      >
        {copy.description}
      </p>
      <div className="max-w-sm mt-4 space-y-4">
        <FormField
          aria-describedby="xsed-campaign-hint"
          disabled={saving || initialStartDate === null}
          id="xsed-campaign-start-date"
          label={copy.dateLabel}
          max="9999-12-31"
          min="0001-01-01"
          onChange={(event) => {
            setDate(event.target.value);
            setSaved(false);
            setError(null);
          }}
          required
          type="date"
          value={date}
        />
        <Button
          aria-busy={saving}
          disabled={saving || initialStartDate === null || date === savedDate}
          type="submit"
        >
          {saving && <Loader2 aria-hidden className="animate-spin h-4 w-4" />}
          {saving ? copy.saving : copy.save}
        </Button>
      </div>
      {error && (
        <p className="mt-4 text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-4 text-ink text-sm" role="status">
          {copy.savedNote}
        </p>
      )}
    </form>
  );
}
