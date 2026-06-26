"use client";

import { CalendarDays, MapPin, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";
import { XSED_PRICE_PER_PERSON } from "@/lib/data/traveler-types";
import { getNextWeekend } from "@/lib/helpers/xsed-dates";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const DAYS_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function formatDay(date: Date): string {
  return `${DAYS_ES[date.getDay()]} ${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface XsedSummaryProps {
  onEdit: (section: string) => void;
  originCity: string;
  originCountry: string;
  pax: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function XsedSummary({
  onEdit,
  originCity,
  originCountry,
  pax,
}: XsedSummaryProps) {
  const total = XSED_PRICE_PER_PERSON * pax;
  const { saturday, sunday } = getNextWeekend();

  const sectionTitleClass = "text-base font-bold text-gray-900";
  const detailClass = "text-sm font-normal text-gray-900";
  const actionButtonClass =
    "shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-normal text-gray-900 hover:bg-gray-200";

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-8 lg:self-start lg:w-80">
      <h2 className="text-xl font-bold text-gray-900">Resumen</h2>

      {/* Producto */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>Producto</p>
        <div className="mt-2">
          <p className={cn("font-bold", detailClass)}>XSED</p>
          <p className="text-sm font-normal text-gray-500 mt-0.5">
            1 noche · cena · experiencia local sorpresa
          </p>
        </div>
      </div>

      {/* Fecha */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>Fecha</p>
        <div className="mt-2 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-gray-900" />
          <p className={detailClass}>
            {formatDay(saturday)} · {formatDay(sunday)}
          </p>
        </div>
      </div>

      {/* Origen */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>Origen</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          {originCity && originCountry ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-gray-900" />
                <p className={detailClass}>
                  {originCity}, {originCountry}.
                </p>
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit("origin")}
                type="button"
              >
                Cambiar
              </button>
            </>
          ) : (
            <div className="flex w-full justify-end">
              <button
                className={actionButtonClass}
                onClick={() => onEdit("origin")}
                type="button"
              >
                Agregar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Personas */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>Personas</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={detailClass}>
            {pax} persona{pax !== 1 ? "s" : ""}
          </p>
          <button
            className={actionButtonClass}
            onClick={() => onEdit("pax")}
            type="button"
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* Totals */}
      <div>
        <div className="flex gap-4 items-start justify-between">
          <p className="font-barlow font-semibold text-sm text-gray-900">
            Precio por persona
          </p>
          <p className="shrink-0 text-right font-barlow-condensed font-bold text-lg text-gray-900">
            USD {XSED_PRICE_PER_PERSON}
          </p>
        </div>

        <div className="border-gray-200 border-t flex gap-4 items-start justify-between mt-5 pt-4">
          <div className="min-w-0 flex-1">
            <p className="font-barlow-condensed font-bold text-3xl text-gray-900">
              Total
            </p>
            <p className="mt-1 font-barlow font-normal text-gray-600 text-sm">
              {pax} persona{pax !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="shrink-0 text-right font-barlow-condensed font-bold text-3xl text-gray-900">
            USD {total}
          </p>
        </div>
      </div>

      {/* Importante */}
      <div className="rounded-lg bg-[#E8F4FC] p-4 text-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkle
            aria-hidden
            className="h-4 w-4 shrink-0 text-[#5B7A8C] fill-[#5B7A8C]"
          />
          <span className="text-base font-bold text-gray-900">Importante</span>
        </div>
        <ul className="list-outside list-disc pl-4 space-y-1 text-sm font-normal text-gray-900">
          <li>El destino es una sorpresa revelada el día del drop.</li>
          <li>
            El precio final será confirmado por el equipo una vez asignado el
            drop.
          </li>
          <li>Incluye 1 noche de alojamiento, cena y experiencia local.</li>
          <li>Serás redirigido al checkout para completar el pago.</li>
        </ul>
      </div>
    </aside>
  );
}
