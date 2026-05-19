"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { ImageUploadInput } from "./ImageUploadInput";
import ExperienceFormNav from "@/components/app/dashboard/tripper/experiences/ExperienceFormNav";
import { AdminXsedBenefitsSection } from "./AdminXsedBenefitsSection";
import type { AdminXsedBenefit } from "@/lib/admin/types";
import { useDictionary } from "@/hooks/useDictionary";

interface Field {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "datetime-local" | "select" | "image";
  options?: string[];
  required?: boolean;
  hint?: string;
}

type FormValues = Record<string, string>;

function buildInitialValues(keys: string[], seed: FormValues = {}): FormValues {
  const init: FormValues = { currency: "USD", status: "DRAFT", ...seed };
  keys.forEach((key) => {
    if (!(key in init)) init[key] = "";
  });
  return init;
}

const fieldClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900";
const labelClass = "block text-left text-sm font-medium text-neutral-700 mb-1.5";
const hintClass = "text-xs text-neutral-400 mt-1";
const sectionClassName =
  "bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left";

interface AdminXsedFormClientProps {
  locale: string;
  experienceId?: string;
  initialData?: FormValues;
  initialBenefits?: AdminXsedBenefit[];
}

export function AdminXsedFormClient({ locale, experienceId, initialData, initialBenefits = [] }: AdminXsedFormClientProps) {
  const router = useRouter();
  const copy = useDictionary(d => d.adminXsed);
  const f = copy.form.fields;
  const isEdit = Boolean(experienceId);

  const SECTIONS: { id: string; label: string; fields?: Field[] }[] = [
    {
      id: "basic",
      label: copy.form.sections.basic,
      fields: [
        { key: "titleInternal", label: f.titleInternal, required: true },
        { key: "titlePublicTeaser", label: f.titlePublicTeaser },
        { key: "slug", label: f.slug, hint: f.slugHint },
        {
          key: "status",
          label: f.status,
          type: "select",
          options: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
        },
        { key: "heroImage", label: f.heroImage, type: "image" },
      ],
    },
    {
      id: "location",
      label: copy.form.sections.location,
      fields: [
        { key: "destinationCity", label: f.destinationCity },
        { key: "destinationState", label: f.destinationState },
        { key: "originCity", label: f.originCity },
        { key: "originCountry", label: f.originCountry },
        { key: "distanceKmFromOrigin", label: f.distanceKm, type: "number" },
      ],
    },
    {
      id: "dates",
      label: copy.form.sections.dates,
      fields: [
        { key: "tripDate", label: f.tripDate, type: "datetime-local" },
        { key: "revealAt", label: f.revealAt, type: "datetime-local" },
      ],
    },
    {
      id: "pricing",
      label: copy.form.sections.pricing,
      fields: [
        { key: "pricePerPerson", label: f.pricePerPerson, type: "number" },
        { key: "currency", label: f.currency, hint: f.currencyHint },
        { key: "minSpots", label: f.minSpots, type: "number" },
        { key: "maxSpots", label: f.maxSpots, type: "number" },
        { key: "costEstimateTotal", label: f.costEstimateTotal, type: "number" },
        { key: "targetMarginPercent", label: f.targetMarginPercent, type: "number" },
      ],
    },
    { id: "benefits", label: copy.form.sections.benefits },
    {
      id: "guest",
      label: copy.form.sections.guest,
      fields: [
        { key: "included", label: f.included, type: "textarea" },
        { key: "notIncluded", label: f.notIncluded, type: "textarea" },
        { key: "generalConditions", label: f.generalConditions, type: "textarea" },
        { key: "cancellationPolicy", label: f.cancellationPolicy, type: "textarea" },
        { key: "weatherPolicy", label: f.weatherPolicy, type: "textarea" },
        { key: "accessibilityNotes", label: f.accessibilityNotes, type: "textarea" },
        { key: "safetyNotes", label: f.safetyNotes, type: "textarea" },
      ],
    },
    {
      id: "reveal",
      label: copy.form.sections.reveal,
      fields: [
        { key: "revealCopy", label: f.revealCopy, type: "textarea" },
        { key: "preRevealCopy", label: f.preRevealCopy, type: "textarea" },
        { key: "packingHints", label: f.packingHints, type: "textarea" },
        { key: "whatsappMessageTemplate", label: f.whatsappMessageTemplate, type: "textarea" },
      ],
    },
    {
      id: "internal",
      label: copy.form.sections.internal,
      fields: [
        { key: "adminNotes", label: f.adminNotes, type: "textarea" },
        { key: "supplierNotes", label: f.supplierNotes, type: "textarea" },
      ],
    },
  ];

  const allKeys = SECTIONS.flatMap(({ fields }) => (fields ?? []).map(({ key }) => key));
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(allKeys, initialData));
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");

  const backPath = `/${locale}/dashboard/admin/xsed`;

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, unknown> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== "") payload[k] = v;
    });

    try {
      const url = isEdit ? `/api/admin/xsed/${experienceId}` : "/api/admin/xsed";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method,
      });
      const data = (await res.json()) as { experience?: { id: string }; error?: string };
      if (!res.ok || !data.experience) {
        toast.error(data.error ?? copy.form.toastError);
        return;
      }
      toast.success(isEdit ? copy.form.toastUpdated : copy.form.toastCreated);
      router.push(backPath);
    } catch {
      toast.error(copy.form.toastError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="text-center mb-10">
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <a href={backPath}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {copy.form.back}
          </a>
        </Button>
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-2">
          {copy.form.eyebrow}
        </p>
        <h1 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase">
          {isEdit ? copy.form.titleEdit : copy.form.title}
        </h1>
      </div>

      {/* Layout: sidebar + form */}
      <div className="flex w-full flex-col gap-8 lg:flex-row">
        {/* Sticky sidebar */}
        <div className="top-[100px] flex flex-col lg:w-80 lg:shrink-0 lg:self-start lg:sticky">
          <ExperienceFormNav
            sections={SECTIONS}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
            mode="create"
            loading={saving}
            onCancel={() => router.push(backPath)}
            submitLabel={saving ? copy.form.saving : isEdit ? copy.form.submitEdit : copy.form.submit}
            cancelLabel={copy.form.cancel}
          />
        </div>

        {/* Form */}
        <form
          className={`min-w-0 flex-1 ${activeSection === "benefits" ? "hidden" : ""}`}
          id="package-form"
          onSubmit={handleSubmit}
        >
          {SECTIONS.map(({ id, label, fields }) => (
            <div
              className={id === activeSection ? sectionClassName : "hidden"}
              id={`section-${id}`}
              key={id}
            >
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">{label}</h2>
              <div className="space-y-4">
                {(fields ?? []).map(({ key, label: fieldLabel, type = "text", options, required, hint }) => (
                  <div key={key}>
                    <label className={labelClass} htmlFor={key}>
                      {fieldLabel}
                      {required && <span className="ml-0.5 text-red-500"> *</span>}
                    </label>
                    {type === "image" ? (
                      <ImageUploadInput
                        feature="xsed"
                        max={1}
                        onAdd={(url) => set(key, url)}
                        onRemove={() => set(key, "")}
                        values={values[key] ? [values[key]] : []}
                      />
                    ) : type === "textarea" ? (
                      <textarea
                        className={`${fieldClass} min-h-24`}
                        id={key}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={fieldLabel}
                        rows={4}
                        value={values[key] ?? ""}
                      />
                    ) : type === "select" ? (
                      <select
                        className={fieldClass}
                        id={key}
                        onChange={(e) => set(key, e.target.value)}
                        value={values[key] ?? ""}
                      >
                        {options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={key}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={fieldLabel}
                        required={required}
                        type={type}
                        value={values[key] ?? ""}
                      />
                    )}
                    {hint && <p className={hintClass}>{hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </form>

        {/* Benefits section — outside form, managed independently */}
        {activeSection === "benefits" && (
          <div className="min-w-0 flex-1">
            <AdminXsedBenefitsSection
              experienceId={experienceId}
              initialBenefits={initialBenefits}
              copy={copy.benefits}
            />
          </div>
        )}
      </div>
    </div>
  );
}
