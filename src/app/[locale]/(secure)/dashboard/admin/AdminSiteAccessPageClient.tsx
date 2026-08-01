"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Switch } from "@/components/ui/Switch";
import { useDictionary } from "@/hooks/useDictionary";

export function AdminSiteAccessPageClient() {
  const copy = useDictionary((d) => d.adminPages.siteAccess);

  const [gateEnabled, setGateEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/site-settings");
        const data = (await res.json()) as {
          gateEnabled?: boolean;
          error?: string;
        };
        if (!res.ok || typeof data.gateEnabled !== "boolean") {
          setError(data.error ?? copy.errorLoad);
          return;
        }
        setGateEnabled(data.gateEnabled);
      } catch {
        setError(copy.errorLoad);
      } finally {
        setLoading(false);
      }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(next: boolean) {
    if (saving) return;
    setSaving(true);
    setError(null);
    setSavedNote(false);
    const previous = gateEnabled;
    setGateEnabled(next);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateEnabled: next }),
      });
      const data = (await res.json()) as {
        gateEnabled?: boolean;
        error?: string;
      };
      if (!res.ok || typeof data.gateEnabled !== "boolean") {
        setGateEnabled(previous);
        setError(data.error ?? copy.errorSave);
        return;
      }
      setGateEnabled(data.gateEnabled);
      setSavedNote(true);
    } catch {
      setGateEnabled(previous);
      setError(copy.errorSave);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">
              {copy.toggleLabel}
            </h3>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">
              {copy.toggleDescription}
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              {copy.maintenanceHint}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-medium text-neutral-500">
              {gateEnabled ? copy.stateOn : copy.stateOff}
            </span>
            <Switch
              checked={!!gateEnabled}
              disabled={saving || gateEnabled === null}
              onCheckedChange={(next) => void handleToggle(next)}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && savedNote && (
          <p className="mt-4 text-sm text-neutral-500">{copy.savedNote}</p>
        )}
      </div>
    </div>
  );
}
