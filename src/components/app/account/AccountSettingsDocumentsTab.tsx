"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, CreditCard, Edit, Flag, Globe } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { CountryMultiSelect } from "@/components/ui/CountryMultiSelect";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";
import type { CountryOption } from "@/lib/geo/countryOptions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TravelDocumentsFormState } from "@/types/documents";

const EMPTY_FORM: TravelDocumentsFormState = {
  idNumber: "",
  idCountry: "",
  idExpiry: "",
  passportNumber: "",
  passportCountry: "",
  passportExpiry: "",
  nationalities: [],
  approvedVisas: [],
};

interface AccountSettingsDocumentsTabProps {
  copy: Dictionary["profile"];
}

export function AccountSettingsDocumentsTab({
  copy,
}: AccountSettingsDocumentsTabProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const [form, setForm] = useState<TravelDocumentsFormState>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<TravelDocumentsFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const visaZoneOptions = useMemo<CountryOption[]>(
    () => [{ value: "SCHENGEN", label: copy.labels.schengenVisa }],
    [copy.labels.schengenVisa],
  );
  const removeCountryLabel = (country: string) =>
    copy.labels.removeCountry.replace("{country}", country);

  useEffect(() => {
    let cancelled = false;
    (async function fetchDocuments() {
      try {
        const res = await fetch("/api/user/documents");
        if (!res.ok) return;
        const data = (await res.json()) as {
          user?: TravelDocumentsFormState;
        };
        if (cancelled || !data.user) return;
        setForm(data.user);
        setSavedForm(data.user);
      } catch (error) {
        console.error("Error fetching travel documents:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(savedForm);
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          user?: TravelDocumentsFormState;
        };
        if (data.user) {
          setForm(data.user);
          setSavedForm(data.user);
        }
        setIsEditing(false);
        toast.success(copy.toasts.profileUpdated);
      } else {
        toast.error(copy.toasts.saveError);
      }
    } catch {
      toast.error(copy.toasts.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  const fieldCn = cn(!isEditing && "cursor-not-allowed opacity-80");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" data-component="AccountSettingsDocumentsTab">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">
          {copy.sections.travelDocs}
        </h2>
        {!isEditing ? (
          <Button
            disabled={loading}
            onClick={handleEdit}
            size="sm"
            variant="secondary"
          >
            <Edit className="mr-2 h-4 w-4" />
            {copy.buttons.editDetails}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} size="sm" variant="secondary">
              {copy.buttons.cancel}
            </Button>
            <Button disabled={isSaving} onClick={handleSave} size="sm">
              {copy.buttons.saveChanges}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* National ID */}
        <div className="rounded-xl border border-gray-200 bg-neutral-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <CreditCard className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              {copy.sections.nationalId}
            </h3>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                className={fieldCn}
                id="doc-id-number"
                label={copy.labels.idNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, idNumber: e.target.value }))
                }
                readOnly={!isEditing}
                type="text"
                value={form.idNumber}
              />
              <FormField
                className={fieldCn}
                id="doc-id-country"
                label={copy.labels.issuingCountry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, idCountry: e.target.value }))
                }
                readOnly={!isEditing}
                type="text"
                value={form.idCountry}
              />
            </div>
            <FormField
              className={cn(fieldCn, "max-w-[240px]")}
              id="doc-id-expiry"
              label={copy.labels.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, idExpiry: e.target.value }))
              }
              readOnly={!isEditing}
              type="date"
              value={form.idExpiry}
            />
          </div>
        </div>

        {/* Passport */}
        <div className="rounded-xl border border-gray-200 bg-neutral-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <BookOpen className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              {copy.sections.passport}
            </h3>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                className={fieldCn}
                id="doc-passport-number"
                label={copy.labels.passportNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, passportNumber: e.target.value }))
                }
                readOnly={!isEditing}
                type="text"
                value={form.passportNumber}
              />
              <FormField
                className={fieldCn}
                id="doc-passport-country"
                label={copy.labels.issuingCountry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, passportCountry: e.target.value }))
                }
                readOnly={!isEditing}
                type="text"
                value={form.passportCountry}
              />
            </div>
            <FormField
              className={cn(fieldCn, "max-w-[240px]")}
              id="doc-passport-expiry"
              label={copy.labels.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, passportExpiry: e.target.value }))
              }
              readOnly={!isEditing}
              type="date"
              value={form.passportExpiry}
            />
          </div>
        </div>

        {/* Nationalities */}
        <div className="rounded-xl border border-gray-200 bg-neutral-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Flag className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              {copy.sections.nationalities}
            </h3>
          </div>
          <p className="mb-3 text-sm text-ink">
            {copy.labels.nationalitiesHelper}
          </p>
          <CountryMultiSelect
            emptyLabel={copy.labels.noNationalities}
            id="doc-nationalities"
            locale={locale}
            noResultsLabel={copy.labels.noCountryResults}
            onChange={(codes) => setForm((f) => ({ ...f, nationalities: codes }))}
            placeholder={copy.labels.selectNationalities}
            readOnly={!isEditing}
            removeLabel={removeCountryLabel}
            searchPlaceholder={copy.labels.searchCountry}
            triggerClassName="bg-white border border-gray-200"
            value={form.nationalities}
          />
        </div>

        {/* Visas */}
        <div className="rounded-xl border border-gray-200 bg-neutral-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Globe className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              {copy.labels.approvedVisas}
            </h3>
          </div>
          <p className="mb-3 text-sm text-ink">
            {copy.labels.approvedVisasHelper}
          </p>
          <CountryMultiSelect
            emptyLabel={copy.labels.noVisas}
            extraOptions={visaZoneOptions}
            id="doc-visas"
            locale={locale}
            noResultsLabel={copy.labels.noCountryResults}
            onChange={(codes) => setForm((f) => ({ ...f, approvedVisas: codes }))}
            placeholder={copy.labels.selectVisas}
            readOnly={!isEditing}
            removeLabel={removeCountryLabel}
            searchPlaceholder={copy.labels.searchVisa}
            triggerClassName="bg-white border border-gray-200"
            value={form.approvedVisas}
          />
        </div>
      </div>
    </div>
  );
}
