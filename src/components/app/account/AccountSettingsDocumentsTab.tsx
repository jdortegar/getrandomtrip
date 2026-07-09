"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, CreditCard, Edit, Globe, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TravelDocumentsFormState } from "@/types/documents";

const VISA_COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Bolivia",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kenya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Schengena",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Vietnam",
];

const EMPTY_FORM: TravelDocumentsFormState = {
  idNumber: "",
  idCountry: "",
  idExpiry: "",
  passportNumber: "",
  passportCountry: "",
  passportExpiry: "",
  approvedVisas: [],
};

interface AccountSettingsDocumentsTabProps {
  copy: Dictionary["profile"];
}

export function AccountSettingsDocumentsTab({
  copy,
}: AccountSettingsDocumentsTabProps) {
  const [form, setForm] = useState<TravelDocumentsFormState>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<TravelDocumentsFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [visaQuery, setVisaQuery] = useState("");
  const [isVisaDropdownOpen, setIsVisaDropdownOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(e.target as Node)
      ) {
        setIsVisaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(savedForm);
    setIsEditing(false);
    setVisaQuery("");
    setIsVisaDropdownOpen(false);
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

  function addVisa(country: string) {
    setForm((f) => ({ ...f, approvedVisas: [...f.approvedVisas, country] }));
    setVisaQuery("");
    setIsVisaDropdownOpen(false);
  }

  function removeVisa(country: string) {
    setForm((f) => ({
      ...f,
      approvedVisas: f.approvedVisas.filter((v) => v !== country),
    }));
  }

  const fieldCn = cn(!isEditing && "cursor-not-allowed opacity-80");
  const filteredVisaCountries = VISA_COUNTRIES.filter(
    (c) =>
      !form.approvedVisas.includes(c) &&
      c.toLowerCase().includes(visaQuery.toLowerCase()),
  ).slice(0, 20);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-light-blue/10 text-light-blue">
              <CreditCard className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-light-blue/10 text-light-blue">
              <BookOpen className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
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

        {/* Approved Visas */}
        <div className="rounded-xl border border-gray-200 bg-neutral-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-light-blue/10 text-light-blue">
              <Globe className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {copy.labels.approvedVisas}
            </h3>
          </div>
          <p className="mb-3 text-sm text-neutral-500">
            {copy.labels.approvedVisasHelper}
          </p>

          <div className="flex flex-wrap gap-2">
            {form.approvedVisas.length === 0 ? (
              <p className="text-sm italic text-neutral-400">
                {copy.labels.noVisas}
              </p>
            ) : (
              form.approvedVisas.map((visa) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-light-blue/10 px-3 py-1 text-xs font-medium text-light-blue"
                  key={visa}
                >
                  {visa}
                  {isEditing && (
                    <button
                      aria-label={copy.tagList.removeAriaLabel}
                      onClick={() => removeVisa(visa)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>

          {isEditing && (
            <div className="relative mt-3" ref={comboboxRef}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 outline-none focus:border-light-blue"
                  onChange={(e) => {
                    setVisaQuery(e.target.value);
                    setIsVisaDropdownOpen(true);
                  }}
                  onFocus={() => setIsVisaDropdownOpen(true)}
                  placeholder={copy.labels.searchVisa}
                  type="text"
                  value={visaQuery}
                />
              </div>
              {isVisaDropdownOpen && filteredVisaCountries.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-[200px] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredVisaCountries.map((country) => (
                    <button
                      className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-gray-50"
                      key={country}
                      onMouseDown={() => addVisa(country)}
                      type="button"
                    >
                      {country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
