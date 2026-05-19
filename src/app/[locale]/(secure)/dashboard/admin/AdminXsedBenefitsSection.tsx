"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AdminXsedBenefit } from "@/lib/admin/types";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import { ImageUploadInput } from "./ImageUploadInput";

const BENEFIT_TYPES = ["ACCOMMODATION", "DINNER", "ACTIVITY"] as const;
const CONFIRMATION_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;

const fieldClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900";
const labelClass = "block text-left text-sm font-medium text-neutral-700 mb-1.5";
const sectionClassName = "bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left";

type BenefitCopy = AdminXsedDict["benefits"];
type BenefitFields = Omit<AdminXsedBenefit, "id" | "photos">;

const TYPE_COLORS: Record<string, string> = {
  ACCOMMODATION: "bg-blue-100 text-blue-800 border-blue-200",
  DINNER: "bg-orange-100 text-orange-800 border-orange-200",
  ACTIVITY: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

function benefitToFields(b: AdminXsedBenefit): BenefitFields {
  return {
    type: b.type,
    sortOrder: b.sortOrder,
    name: b.name,
    providerName: b.providerName,
    address: b.address,
    city: b.city,
    state: b.state,
    googleMapsUrl: b.googleMapsUrl,
    customerVisibleNotes: b.customerVisibleNotes,
    internalNotes: b.internalNotes,
    confirmationStatus: b.confirmationStatus,
    reservationCode: b.reservationCode,
  };
}

interface BenefitCardProps {
  benefit: AdminXsedBenefit;
  copy: BenefitCopy;
  experienceId: string;
  onUpdate: (updated: AdminXsedBenefit) => void;
  onDelete: (id: string) => void;
}

function BenefitCard({ benefit, copy, experienceId, onUpdate, onDelete }: BenefitCardProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<BenefitFields>(() => benefitToFields(benefit));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photos, setPhotos] = useState(benefit.photos);

  function set(key: keyof BenefitFields, value: string | number) {
    setFields((prev) => ({ ...prev, [key]: value === "" ? null : value }));
  }

  async function addPhoto(url: string) {
    const res = await fetch(`/api/admin/xsed/${experienceId}/benefits/${benefit.id}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = (await res.json()) as { photo?: { id: string; url: string; altText: string | null; sortOrder: number } };
    if (data.photo) setPhotos((prev) => [...prev, data.photo!]);
  }

  async function removePhoto(url: string) {
    const photo = photos.find((p) => p.url === url);
    if (!photo) return;
    const res = await fetch(
      `/api/admin/xsed/${experienceId}/benefits/${benefit.id}/photos?photoId=${photo.id}`,
      { method: "DELETE" },
    );
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/xsed/${experienceId}/benefits/${benefit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await res.json()) as { benefit?: AdminXsedBenefit; error?: string };
      if (!res.ok || !data.benefit) { toast.error(data.error ?? copy.save); return; }
      onUpdate(data.benefit);
      setOpen(false);
      toast.success(copy.save);
    } catch {
      toast.error(copy.save);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(copy.delete + "?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/xsed/${experienceId}/benefits/${benefit.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error(copy.delete); return; }
      onDelete(benefit.id);
    } catch {
      toast.error(copy.delete);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        <span className={`px-2 py-0.5 text-xs rounded-full border ${TYPE_COLORS[benefit.type]}`}>
          {copy.types[benefit.type]}
        </span>
        <span className="text-sm font-medium text-neutral-800 flex-1 truncate">
          {benefit.name ?? copy.unnamed}
        </span>
        <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[benefit.confirmationStatus]}`}>
          {copy.confirmationStatus[benefit.confirmationStatus]}
        </span>
        <button
          className="text-neutral-400 hover:text-neutral-700"
          onClick={() => setOpen((o) => !o)}
          type="button"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded fields */}
      {open && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Type */}
            <div>
              <label className={labelClass}>{copy.fields.type}</label>
              <select className={fieldClass} value={fields.type} onChange={(e) => set("type", e.target.value)}>
                {BENEFIT_TYPES.map((t) => (
                  <option key={t} value={t}>{copy.types[t]}</option>
                ))}
              </select>
            </div>
            {/* Name */}
            <div>
              <label className={labelClass}>{copy.fields.name}</label>
              <input className={fieldClass} value={fields.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            {/* Sort order */}
            <div>
              <label className={labelClass}>{copy.fields.sortOrder}</label>
              <input className={fieldClass} type="number" value={fields.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </div>
            {/* Provider */}
            <div>
              <label className={labelClass}>{copy.fields.providerName}</label>
              <input className={fieldClass} value={fields.providerName ?? ""} onChange={(e) => set("providerName", e.target.value)} />
            </div>
            {/* Address */}
            <div>
              <label className={labelClass}>{copy.fields.address}</label>
              <input className={fieldClass} value={fields.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </div>
            {/* City */}
            <div>
              <label className={labelClass}>{copy.fields.city}</label>
              <input className={fieldClass} value={fields.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            {/* State */}
            <div>
              <label className={labelClass}>{copy.fields.state}</label>
              <input className={fieldClass} value={fields.state ?? ""} onChange={(e) => set("state", e.target.value)} />
            </div>
            {/* Google Maps */}
            <div>
              <label className={labelClass}>{copy.fields.googleMapsUrl}</label>
              <input className={fieldClass} value={fields.googleMapsUrl ?? ""} onChange={(e) => set("googleMapsUrl", e.target.value)} />
            </div>
            {/* Confirmation status */}
            <div>
              <label className={labelClass}>{copy.fields.confirmationStatus}</label>
              <select className={fieldClass} value={fields.confirmationStatus} onChange={(e) => set("confirmationStatus", e.target.value)}>
                {CONFIRMATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{copy.confirmationStatus[s]}</option>
                ))}
              </select>
            </div>
            {/* Reservation code */}
            <div>
              <label className={labelClass}>{copy.fields.reservationCode}</label>
              <input className={fieldClass} value={fields.reservationCode ?? ""} onChange={(e) => set("reservationCode", e.target.value)} />
            </div>
          </div>
          {/* Guest notes */}
          <div>
            <label className={labelClass}>{copy.fields.customerVisibleNotes}</label>
            <textarea className={`${fieldClass} min-h-20`} rows={3} value={fields.customerVisibleNotes ?? ""} onChange={(e) => set("customerVisibleNotes", e.target.value)} />
          </div>
          {/* Internal notes */}
          <div>
            <label className={labelClass}>{copy.fields.internalNotes}</label>
            <textarea className={`${fieldClass} min-h-20`} rows={3} value={fields.internalNotes ?? ""} onChange={(e) => set("internalNotes", e.target.value)} />
          </div>
          {/* Photos */}
          <div>
            <label className={labelClass}>{copy.fields.photos} <span className="text-neutral-400 font-normal">(máx. 6)</span></label>
            <ImageUploadInput
              feature="xsed"
              max={6}
              onAdd={addPhoto}
              onRemove={removePhoto}
              values={photos.map((p) => p.url)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving} type="button">
              {saving ? "…" : copy.save}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setFields(benefitToFields(benefit)); setOpen(false); }} type="button">
              {copy.cancel}
            </Button>
            <button
              className="ml-auto text-red-500 hover:text-red-700 disabled:opacity-40"
              disabled={deleting}
              onClick={handleDelete}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NewBenefitFormProps {
  copy: BenefitCopy;
  experienceId: string;
  onCreated: (benefit: AdminXsedBenefit) => void;
  onCancel: () => void;
}

function NewBenefitForm({ copy, experienceId, onCreated, onCancel }: NewBenefitFormProps) {
  const [fields, setFields] = useState<BenefitFields>({
    type: "ACCOMMODATION",
    sortOrder: 0,
    name: null,
    providerName: null,
    address: null,
    city: null,
    state: null,
    googleMapsUrl: null,
    customerVisibleNotes: null,
    internalNotes: null,
    confirmationStatus: "PENDING",
    reservationCode: null,
  });
  const [saving, setSaving] = useState(false);

  function set(key: keyof BenefitFields, value: string | number) {
    setFields((prev) => ({ ...prev, [key]: value === "" ? null : value }));
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/xsed/${experienceId}/benefits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await res.json()) as { benefit?: AdminXsedBenefit; error?: string };
      if (!res.ok || !data.benefit) { toast.error(data.error ?? copy.save); return; }
      onCreated(data.benefit);
      toast.success(copy.save);
    } catch {
      toast.error(copy.save);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{copy.fields.type}</label>
          <select className={fieldClass} value={fields.type} onChange={(e) => set("type", e.target.value)}>
            {BENEFIT_TYPES.map((t) => (
              <option key={t} value={t}>{copy.types[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{copy.fields.name}</label>
          <input className={fieldClass} value={fields.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>{copy.fields.providerName}</label>
          <input className={fieldClass} value={fields.providerName ?? ""} onChange={(e) => set("providerName", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>{copy.fields.city}</label>
          <input className={fieldClass} value={fields.city ?? ""} onChange={(e) => set("city", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClass}>{copy.fields.customerVisibleNotes}</label>
        <textarea className={`${fieldClass} min-h-20`} rows={3} value={fields.customerVisibleNotes ?? ""} onChange={(e) => set("customerVisibleNotes", e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleCreate} disabled={saving} type="button">
          {saving ? "…" : copy.save}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} type="button">
          {copy.cancel}
        </Button>
      </div>
    </div>
  );
}

interface AdminXsedBenefitsSectionProps {
  experienceId: string | undefined;
  initialBenefits: AdminXsedBenefit[];
  copy: BenefitCopy;
}

export function AdminXsedBenefitsSection({ experienceId, initialBenefits, copy }: AdminXsedBenefitsSectionProps) {
  const [benefits, setBenefits] = useState<AdminXsedBenefit[]>(initialBenefits);
  const [adding, setAdding] = useState(false);

  if (!experienceId) {
    return (
      <div className={sectionClassName}>
        <p className="text-sm text-neutral-500">{copy.saveFirst}</p>
      </div>
    );
  }

  return (
    <div className={sectionClassName}>
      <div className="space-y-3">
        {benefits.length === 0 && !adding && (
          <p className="text-sm text-neutral-500">{copy.empty}</p>
        )}
        {benefits.map((b) => (
          <BenefitCard
            key={b.id}
            benefit={b}
            copy={copy}
            experienceId={experienceId}
            onUpdate={(updated) => setBenefits((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
            onDelete={(id) => setBenefits((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
        {adding && (
          <NewBenefitForm
            copy={copy}
            experienceId={experienceId}
            onCreated={(b) => { setBenefits((prev) => [...prev, b]); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )}
        {!adding && (
          <button
            className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
            onClick={() => setAdding(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {copy.add}
          </button>
        )}
      </div>
    </div>
  );
}
