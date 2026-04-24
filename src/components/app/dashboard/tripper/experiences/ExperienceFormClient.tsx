// src/components/app/dashboard/tripper/experiences/ExperienceFormClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import ExperienceFormNav from "./ExperienceFormNav";
import type {
  ExperienceFormData,
  ExperienceHotel,
  ExperienceActivity,
  ExperienceItineraryDay,
} from "@/types/tripper";

// Alias sub-types so map callbacks are typed without inline annotations
type Hotel = ExperienceHotel;
type Activity = ExperienceActivity;
type ItineraryDay = ExperienceItineraryDay;
import type { PackagesDict } from "@/lib/types/dictionary";
import {
  EXPERIENCE_TYPES,
  EXPERIENCE_LEVELS,
  EXPERIENCE_STATUSES,
  ACCOMMODATION_TYPES,
  TRANSPORT_MODES,
  CLIMATE_OPTIONS,
  MAX_TRAVEL_TIME_OPTIONS,
  TIME_PREFERENCES,
  getExcuseOptionsForType,
  MAX_NIGHTS_BY_LEVEL,
} from "@/lib/constants/packages";

const EMPTY_FORM: ExperienceFormData = {
  type: "couple",
  level: "essenza",
  title: "",
  status: "DRAFT",
  teaser: "",
  description: "",
  heroImage: "",
  destinationCountry: "",
  destinationCity: "",
  excuseKey: "",
  minNights: 1,
  maxNights: 2,
  minPax: 1,
  maxPax: 8,
  basePriceUsd: 0,
  displayPrice: "",
  accommodationType: "any",
  transport: "any",
  climate: "any",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  hotels: [],
  activities: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  tags: [],
  highlights: [],
  isActive: true,
  isFeatured: false,
};

interface PackageFormClientProps {
  mode: "create" | "edit";
  initialData?: ExperienceFormData;
  packageId?: string;
  dict: PackagesDict["form"];
  locale: string;
}

// ─── helper: pill token list ──────────────────────────────────────────────────
function TokenList({
  items,
  onRemove,
  color = "neutral",
}: {
  items: string[];
  onRemove: (item: string) => void;
  color?: "neutral" | "green" | "red";
}) {
  const cls = {
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
    green: "bg-green-50 text-green-800 border-green-200",
    red: "bg-red-50 text-red-800 border-red-200",
  }[color];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full border ${cls}`}
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="opacity-60 hover:opacity-100 leading-none"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── helper: token input ──────────────────────────────────────────────────────
function TokenInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [val, setVal] = useState("");
  const submit = () => {
    if (val.trim()) {
      onAdd(val.trim());
      setVal("");
    }
  };
  return (
    <div className="flex gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="text-sm"
      />
      <Button type="button" variant="outline" size="sm" onClick={submit}>
        +
      </Button>
    </div>
  );
}

export default function PackageFormClient({
  mode,
  initialData,
  packageId,
  dict: copy,
  locale,
}: PackageFormClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<ExperienceFormData>(
    initialData ?? EMPTY_FORM,
  );
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");

  const basePath = `/${locale}/dashboard/tripper/experiences`;

  const sections = [
    { id: "basic", label: copy.sections.basic },
    { id: "destination", label: copy.sections.destination },
    { id: "capacity", label: copy.sections.capacityPricing },
    { id: "compatibility", label: copy.sections.compatibility },
    { id: "accommodation", label: copy.sections.accommodation },
    { id: "activities", label: copy.sections.activities },
    { id: "itinerary", label: copy.sections.itinerary },
    { id: "inclusions", label: copy.sections.inclusions },
    { id: "tags-media", label: copy.sections.tagsMedia },
    { id: "visibility", label: copy.sections.visibility },
  ];

  const maxNightsLimit = MAX_NIGHTS_BY_LEVEL[form.level] ?? null;
  const excuseOptions = getExcuseOptionsForType(form.type);
  const showExcuse = form.level === "explora-plus" || form.level === "bivouac";

  const set = <K extends keyof ExperienceFormData>(
    key: K,
    value: ExperienceFormData[K],
  ) => setForm((prev: ExperienceFormData) => ({ ...prev, [key]: value }));

  const handleTypeChange = (value: string) => {
    setForm((prev: ExperienceFormData) => ({
      ...prev,
      type: value,
      excuseKey: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (maxNightsLimit !== null && form.maxNights > maxNightsLimit) {
      toast.error(
        copy.fields.maxNightsHint.replace("{n}", String(maxNightsLimit)),
      );
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/experiences"
          : `/api/tripper/experiences/${packageId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          mode === "create" ? "Experiencia creada" : "Cambios guardados",
        );
        router.push(basePath);
      } else {
        toast.error(data.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelClass =
    "block text-left text-sm font-medium text-neutral-700 mb-1.5";
  const hintClass = "text-xs text-neutral-400 mt-1";
  const sectionClassName =
    "scroll-mt-24 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="text-center mb-10">
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <a href={basePath}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {copy.cancel}
          </a>
        </Button>
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-2">
          Tripper OS
        </p>
        <h1 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase">
          {mode === "create"
            ? copy.createTitle
            : (initialData?.title?.toUpperCase() ?? copy.editTitle)}
        </h1>
      </div>

      {/* Layout: sidebar nav + scrollable form */}
      <div className="flex w-full flex-col gap-8 lg:flex-row">
        {/* Sidebar — fixed width, sticky */}
        <div className="top-[100px] flex flex-col lg:w-80 lg:flex-shrink-0 lg:self-start lg:sticky">
          <ExperienceFormNav
            sections={sections}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
            mode={mode}
            loading={loading}
            onCancel={() => router.push(basePath)}
            submitLabel={
              loading
                ? copy.saving
                : mode === "create"
                  ? copy.createSubmit
                  : copy.editSubmit
            }
            cancelLabel={copy.cancel}
          />
        </div>

        {/* Form sections */}
        <form
          id="package-form"
          onSubmit={handleSubmit}
          className="min-w-0 flex-1 space-y-6"
        >
          {/* Section 1: Básico */}
          <div id="section-basic" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.basic}
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  {copy.fields.title} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ej: Aventura Urbana Misteriosa"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {copy.fields.type} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className={fieldClass}
                    required
                  >
                    {EXPERIENCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {copy.fields.level} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => set("level", e.target.value)}
                    className={fieldClass}
                    required
                  >
                    {EXPERIENCE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {mode === "edit" && (
                <div>
                  <label className={labelClass}>{copy.fields.status}</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className={fieldClass}
                  >
                    {EXPERIENCE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>{copy.fields.teaser}</label>
                <Input
                  value={form.teaser}
                  onChange={(e) => set("teaser", e.target.value)}
                  placeholder="Una descripción breve para las tarjetas"
                  maxLength={150}
                />
                <p className={hintClass}>{copy.fields.teaserHint}</p>
              </div>

              <div>
                <label className={labelClass}>{copy.fields.description}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  className={fieldClass}
                  placeholder="Describe tu experiencia en detalle..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Destino */}
          <div id="section-destination" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.destination}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {copy.fields.country}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.destinationCountry}
                    onChange={(e) => set("destinationCountry", e.target.value)}
                    placeholder="Ej: Argentina"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {copy.fields.city} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.destinationCity}
                    onChange={(e) => set("destinationCity", e.target.value)}
                    placeholder="Ej: Buenos Aires"
                    required
                  />
                </div>
              </div>

              {showExcuse && excuseOptions.length > 0 && (
                <div>
                  <label className={labelClass}>{copy.fields.excuseKey}</label>
                  <select
                    value={form.excuseKey}
                    onChange={(e) => set("excuseKey", e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">— Seleccionar excusa —</option>
                    {excuseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className={hintClass}>{copy.fields.excuseKeyHint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Capacidad & Precio */}
          <div id="section-capacity" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.capacityPricing}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>{copy.fields.minNights}</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.minNights}
                    onChange={(e) =>
                      set("minNights", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.fields.maxNights}</label>
                  <Input
                    type="number"
                    min={1}
                    max={maxNightsLimit ?? undefined}
                    value={form.maxNights}
                    onChange={(e) =>
                      set("maxNights", parseInt(e.target.value) || 1)
                    }
                  />
                  {maxNightsLimit !== null && (
                    <p className={hintClass}>
                      {copy.fields.maxNightsHint.replace(
                        "{n}",
                        String(maxNightsLimit),
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{copy.fields.minPax}</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.minPax}
                    onChange={(e) =>
                      set("minPax", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.fields.maxPax}</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxPax}
                    onChange={(e) =>
                      set("maxPax", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {copy.fields.basePriceUsd}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.basePriceUsd}
                    onChange={(e) =>
                      set("basePriceUsd", parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                  <p className={hintClass}>{copy.fields.basePriceUsdHint}</p>
                </div>
                <div>
                  <label className={labelClass}>
                    {copy.fields.displayPrice}
                  </label>
                  <Input
                    value={form.displayPrice}
                    onChange={(e) => set("displayPrice", e.target.value)}
                    placeholder="Ej: Desde USD 450"
                  />
                  <p className={hintClass}>{copy.fields.displayPriceHint}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Compatibilidad */}
          <div id="section-compatibility" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">
              {copy.sections.compatibility}
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              {copy.fields.compatibilityHint}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  key: "accommodationType" as const,
                  opts: ACCOMMODATION_TYPES,
                  label: copy.fields.accommodationType,
                },
                {
                  key: "transport" as const,
                  opts: TRANSPORT_MODES,
                  label: copy.fields.transport,
                },
                {
                  key: "climate" as const,
                  opts: CLIMATE_OPTIONS,
                  label: copy.fields.climate,
                },
                {
                  key: "maxTravelTime" as const,
                  opts: MAX_TRAVEL_TIME_OPTIONS,
                  label: copy.fields.maxTravelTime,
                },
                {
                  key: "departPref" as const,
                  opts: TIME_PREFERENCES,
                  label: copy.fields.departPref,
                },
                {
                  key: "arrivePref" as const,
                  opts: TIME_PREFERENCES,
                  label: copy.fields.arrivePref,
                },
              ].map(({ key, opts, label }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <select
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className={fieldClass}
                  >
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Alojamiento */}
          <div id="section-accommodation" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.accommodation}
            </h2>
            <div className="space-y-3">
              {form.hotels.length === 0 && (
                <p className="text-sm text-neutral-400">
                  {copy.fields.noHotels}
                </p>
              )}
              {form.hotels.map((hotel: Hotel, i: number) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700">
                      Hotel {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "hotels",
                          form.hotels.filter(
                            (_: Hotel, idx: number) => idx !== i,
                          ),
                        )
                      }
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelClass}>
                        {copy.fields.hotelName} *
                      </label>
                      <Input
                        value={hotel.name}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = { ...updated[i], name: e.target.value };
                          set("hotels", updated);
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        {copy.fields.hotelStars}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={hotel.stars ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = {
                            ...updated[i],
                            stars: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          };
                          set("hotels", updated);
                        }}
                        placeholder="1-5"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        {copy.fields.hotelLocation}
                      </label>
                      <Input
                        value={hotel.location ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = {
                            ...updated[i],
                            location: e.target.value,
                          };
                          set("hotels", updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        {copy.fields.hotelCheckIn}
                      </label>
                      <Input
                        value={hotel.checkIn ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = {
                            ...updated[i],
                            checkIn: e.target.value,
                          };
                          set("hotels", updated);
                        }}
                        placeholder="Día 1"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        {copy.fields.hotelCheckOut}
                      </label>
                      <Input
                        value={hotel.checkOut ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = {
                            ...updated[i],
                            checkOut: e.target.value,
                          };
                          set("hotels", updated);
                        }}
                        placeholder="Día 3"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("hotels", [...form.hotels, { name: "" }])}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-neutral-500 hover:border-gray-300 hover:text-neutral-700 transition-colors"
              >
                + {copy.fields.addHotel}
              </button>
            </div>
          </div>

          {/* Section 6: Actividades */}
          <div id="section-activities" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.activities}
            </h2>
            <div className="space-y-3">
              {form.activities.length === 0 && (
                <p className="text-sm text-neutral-400">
                  {copy.fields.noActivities}
                </p>
              )}
              {form.activities.map((activity: Activity, i: number) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700">
                      Actividad {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "activities",
                          form.activities.filter(
                            (_: Activity, idx: number) => idx !== i,
                          ),
                        )
                      }
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {copy.fields.activityName} *
                    </label>
                    <Input
                      value={activity.name}
                      onChange={(e) => {
                        const updated = [...form.activities];
                        updated[i] = { ...updated[i], name: e.target.value };
                        set("activities", updated);
                      }}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>
                        {copy.fields.activityDuration}
                      </label>
                      <Input
                        value={activity.duration ?? ""}
                        onChange={(e) => {
                          const updated = [...form.activities];
                          updated[i] = {
                            ...updated[i],
                            duration: e.target.value,
                          };
                          set("activities", updated);
                        }}
                        placeholder="Ej: 3h"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {copy.fields.activityDesc}
                    </label>
                    <textarea
                      value={activity.description ?? ""}
                      onChange={(e) => {
                        const updated = [...form.activities];
                        updated[i] = {
                          ...updated[i],
                          description: e.target.value,
                        };
                        set("activities", updated);
                      }}
                      rows={2}
                      className={fieldClass}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set("activities", [...form.activities, { name: "" }])
                }
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-neutral-500 hover:border-gray-300 hover:text-neutral-700 transition-colors"
              >
                + {copy.fields.addActivity}
              </button>
            </div>
          </div>

          {/* Section 7: Itinerario */}
          <div id="section-itinerary" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.itinerary}
            </h2>
            <div className="space-y-3">
              {form.itinerary.length === 0 && (
                <p className="text-sm text-neutral-400">
                  {copy.fields.noItinerary}
                </p>
              )}
              {form.itinerary.map((day: ItineraryDay, i: number) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-neutral-700">
                      Día {day.day}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.itinerary
                          .filter((_: ItineraryDay, idx: number) => idx !== i)
                          .map((d: ItineraryDay, idx: number) => ({
                            ...d,
                            day: idx + 1,
                          }));
                        set("itinerary", updated);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {copy.fields.itineraryTitle} *
                    </label>
                    <Input
                      value={day.title}
                      onChange={(e) => {
                        const updated = [...form.itinerary];
                        updated[i] = { ...updated[i], title: e.target.value };
                        set("itinerary", updated);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {copy.fields.itineraryDesc} *
                    </label>
                    <textarea
                      value={day.description}
                      onChange={(e) => {
                        const updated = [...form.itinerary];
                        updated[i] = {
                          ...updated[i],
                          description: e.target.value,
                        };
                        set("itinerary", updated);
                      }}
                      rows={3}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set("itinerary", [
                    ...form.itinerary,
                    {
                      day: form.itinerary.length + 1,
                      title: "",
                      description: "",
                    },
                  ])
                }
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-neutral-500 hover:border-gray-300 hover:text-neutral-700 transition-colors"
              >
                + {copy.fields.addDay}
              </button>
            </div>
          </div>

          {/* Section 8: Incluye / No Incluye */}
          <div id="section-inclusions" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.inclusions}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-700">
                  {copy.fields.inclusions}
                </h3>
                <TokenInput
                  placeholder={copy.fields.addInclusion}
                  onAdd={(val) => set("inclusions", [...form.inclusions, val])}
                />
                <TokenList
                  items={form.inclusions}
                  onRemove={(val) =>
                    set(
                      "inclusions",
                      form.inclusions.filter((x: string) => x !== val),
                    )
                  }
                  color="green"
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-700">
                  {copy.fields.exclusions}
                </h3>
                <TokenInput
                  placeholder={copy.fields.addExclusion}
                  onAdd={(val) => set("exclusions", [...form.exclusions, val])}
                />
                <TokenList
                  items={form.exclusions}
                  onRemove={(val) =>
                    set(
                      "exclusions",
                      form.exclusions.filter((x: string) => x !== val),
                    )
                  }
                  color="red"
                />
              </div>
            </div>
          </div>

          {/* Section 9: Tags, Highlights & Media */}
          <div id="section-tags-media" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.tagsMedia}
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={labelClass}>{copy.fields.tags}</label>
                <TokenInput
                  placeholder={copy.fields.tagInput}
                  onAdd={(val) => {
                    if (!form.tags.includes(val))
                      set("tags", [...form.tags, val]);
                  }}
                />
                <TokenList
                  items={form.tags}
                  onRemove={(val) =>
                    set(
                      "tags",
                      form.tags.filter((t: string) => t !== val),
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>{copy.fields.highlights}</label>
                <TokenInput
                  placeholder={copy.fields.highlightInput}
                  onAdd={(val) => {
                    if (!form.highlights.includes(val))
                      set("highlights", [...form.highlights, val]);
                  }}
                />
                <TokenList
                  items={form.highlights}
                  onRemove={(val) =>
                    set(
                      "highlights",
                      form.highlights.filter((h: string) => h !== val),
                    )
                  }
                />
              </div>

              <div>
                <label className={labelClass}>{copy.fields.heroImage}</label>
                <Input
                  type="url"
                  value={form.heroImage}
                  onChange={(e) => set("heroImage", e.target.value)}
                  placeholder="https://..."
                />
                <p className={hintClass}>{copy.fields.heroImageHint}</p>
              </div>
            </div>
          </div>

          {/* Section 10: Visibilidad */}
          <div id="section-visibility" className={sectionClassName}>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.visibility}
            </h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-neutral-900"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-700">
                    {copy.fields.isActive}
                  </span>
                  <p className={hintClass}>{copy.fields.isActiveHint}</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => set("isFeatured", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-neutral-900"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-700">
                    {copy.fields.isFeatured}
                  </span>
                  <p className={hintClass}>{copy.fields.isFeaturedHint}</p>
                </div>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
