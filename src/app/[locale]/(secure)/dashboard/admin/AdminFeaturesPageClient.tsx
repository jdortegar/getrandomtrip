"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Switch } from "@/components/ui/Switch";
import { useDictionary } from "@/hooks/useDictionary";

interface ToggleCardCopy {
  errorLoad: string;
  errorSave: string;
  maintenanceHint?: string;
  savedNote: string;
  stateOff: string;
  stateOn: string;
  toggleDescription: string;
  toggleLabel: string;
}

interface FeatureToggleCardProps {
  copy: ToggleCardCopy;
  enabled: boolean | null;
  error: string | null;
  onToggle: (next: boolean) => void;
  saving: boolean;
  savedNote: boolean;
}

function FeatureToggleCard({
  copy,
  enabled,
  error,
  onToggle,
  saving,
  savedNote,
}: FeatureToggleCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="text-xl font-semibold text-ink">
            {copy.toggleLabel}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-neutral-600">
            {copy.toggleDescription}
          </p>
          {copy.maintenanceHint && (
            <p className="mt-3 text-xs text-neutral-400">
              {copy.maintenanceHint}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-medium text-ink">
            {enabled ? copy.stateOn : copy.stateOff}
          </span>
          <Switch
            checked={!!enabled}
            disabled={saving || enabled === null}
            onCheckedChange={onToggle}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!error && savedNote && (
        <p className="mt-4 text-sm text-ink">{copy.savedNote}</p>
      )}
    </div>
  );
}

interface FeatureFlags {
  gateEnabled: boolean;
  xsedWindowEnforcementEnabled: boolean;
}

export function AdminFeaturesPageClient() {
  const copy = useDictionary((d) => d.adminPages.features);

  const [gateEnabled, setGateEnabled] = useState<boolean | null>(null);
  const [xsedWindowEnforcementEnabled, setXsedWindowEnforcementEnabled] =
    useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savingGate, setSavingGate] = useState(false);
  const [gateSaveError, setGateSaveError] = useState<string | null>(null);
  const [gateSavedNote, setGateSavedNote] = useState(false);

  const [savingXsedWindow, setSavingXsedWindow] = useState(false);
  const [xsedWindowSaveError, setXsedWindowSaveError] = useState<string | null>(null);
  const [xsedWindowSavedNote, setXsedWindowSavedNote] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/admin/site-settings");
        const data = (await res.json()) as Partial<FeatureFlags> & {
          error?: string;
        };
        if (
          !res.ok ||
          typeof data.gateEnabled !== "boolean" ||
          typeof data.xsedWindowEnforcementEnabled !== "boolean"
        ) {
          setLoadError(data.error ?? copy.siteAccessGate.errorLoad);
          return;
        }
        setGateEnabled(data.gateEnabled);
        setXsedWindowEnforcementEnabled(data.xsedWindowEnforcementEnabled);
      } catch {
        setLoadError(copy.siteAccessGate.errorLoad);
      } finally {
        setLoading(false);
      }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGateToggle(next: boolean) {
    if (savingGate) return;
    setSavingGate(true);
    setGateSaveError(null);
    setGateSavedNote(false);
    const previous = gateEnabled;
    setGateEnabled(next);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateEnabled: next }),
      });
      const data = (await res.json()) as Partial<FeatureFlags> & {
        error?: string;
      };
      if (!res.ok || typeof data.gateEnabled !== "boolean") {
        setGateEnabled(previous);
        setGateSaveError(data.error ?? copy.siteAccessGate.errorSave);
        return;
      }
      setGateEnabled(data.gateEnabled);
      setGateSavedNote(true);
    } catch {
      setGateEnabled(previous);
      setGateSaveError(copy.siteAccessGate.errorSave);
    } finally {
      setSavingGate(false);
    }
  }

  async function handleXsedWindowToggle(next: boolean) {
    if (savingXsedWindow) return;
    setSavingXsedWindow(true);
    setXsedWindowSaveError(null);
    setXsedWindowSavedNote(false);
    const previous = xsedWindowEnforcementEnabled;
    setXsedWindowEnforcementEnabled(next);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xsedWindowEnforcementEnabled: next }),
      });
      const data = (await res.json()) as Partial<FeatureFlags> & {
        error?: string;
      };
      if (!res.ok || typeof data.xsedWindowEnforcementEnabled !== "boolean") {
        setXsedWindowEnforcementEnabled(previous);
        setXsedWindowSaveError(data.error ?? copy.xsedWindowEnforcement.errorSave);
        return;
      }
      setXsedWindowEnforcementEnabled(data.xsedWindowEnforcementEnabled);
      setXsedWindowSavedNote(true);
    } catch {
      setXsedWindowEnforcementEnabled(previous);
      setXsedWindowSaveError(copy.xsedWindowEnforcement.errorSave);
    } finally {
      setSavingXsedWindow(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {loadError && (
        <p className="text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}
      <FeatureToggleCard
        copy={copy.siteAccessGate}
        enabled={gateEnabled}
        error={gateSaveError}
        onToggle={(next) => void handleGateToggle(next)}
        saving={savingGate}
        savedNote={gateSavedNote}
      />
      <FeatureToggleCard
        copy={copy.xsedWindowEnforcement}
        enabled={xsedWindowEnforcementEnabled}
        error={xsedWindowSaveError}
        onToggle={(next) => void handleXsedWindowToggle(next)}
        saving={savingXsedWindow}
        savedNote={xsedWindowSavedNote}
      />
    </div>
  );
}
