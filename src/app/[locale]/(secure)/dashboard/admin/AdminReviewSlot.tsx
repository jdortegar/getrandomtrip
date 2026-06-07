"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { getBasePricePerPerson } from "@/lib/data/traveler-types";

interface Props {
  experienceId: string;
  types: string[];
  level: string;
  locale: string;
}

export function AdminReviewSlot({ experienceId, types, level, locale }: Props) {
  const router = useRouter();
  const nonXsedTypes = types.filter((t) => t !== "XSED");

  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      nonXsedTypes.map((t) => {
        const preset = getBasePricePerPerson(t, level);
        return [t, preset > 0 ? String(preset) : ""];
      }),
    ),
  );
  const [rejecting, setRejecting] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backPath = `/${locale}/dashboard/admin/experiences`;

  const allPricesFilled = nonXsedTypes.every((t) => {
    const v = Number(prices[t]);
    return Number.isFinite(v) && v > 0;
  });

  async function handleApprove() {
    if (!allPricesFilled) return;
    setSaving(true);
    setError(null);
    try {
      const pricingByType = Object.fromEntries(
        nonXsedTypes.map((t) => [t, Number(prices[t])]),
      );
      const res = await fetch(`/api/admin/experiences/${experienceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricingByType }),
      });
      if (!res.ok) throw new Error();
      router.push(backPath);
      router.refresh();
    } catch {
      setError("Could not approve. Please try again.");
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!reviewNote.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/experiences/${experienceId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: reviewNote.trim() }),
      });
      if (!res.ok) throw new Error();
      router.push(backPath);
      router.refresh();
    } catch {
      setError("Could not reject. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {nonXsedTypes.length > 0 && (
        <Accordion type="single" collapsible defaultValue="admin-pricing">
          <JourneyDropdown
            value="admin-pricing"
            label="Price per person (USD)"
            content=""
          >
            <div className="space-y-5">
              {nonXsedTypes.map((t) => (
                <FormField
                  key={t}
                  id={`admin-price-${t}`}
                  label={<span className="capitalize">{t}</span>}
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0"
                  value={prices[t] ?? ""}
                  onChange={(e) =>
                    setPrices((prev) => ({ ...prev, [t]: e.target.value }))
                  }
                  disabled={saving}
                />
              ))}
            </div>
          </JourneyDropdown>
        </Accordion>
      )}

      {rejecting && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-500">Note to tripper</p>
          <textarea
            rows={3}
            placeholder="Explain what needs to change..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            disabled={saving}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:opacity-50"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-center gap-4 sm:gap-10 mt-8 pt-6 border-t border-gray-200">
        {!rejecting ? (
          <>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={saving}
              className="text-sm font-medium text-red-600 underline hover:no-underline disabled:opacity-50"
            >
              Reject
            </button>
            <Button
              size="sm"
              onClick={() => void handleApprove()}
              disabled={!allPricesFilled || saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Approve & publish"
              )}
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setRejecting(false);
                setReviewNote("");
              }}
              disabled={saving}
              className="text-sm font-medium text-gray-900 underline hover:no-underline disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              size="sm"
              onClick={() => void handleReject()}
              disabled={!reviewNote.trim() || saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm rejection"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
