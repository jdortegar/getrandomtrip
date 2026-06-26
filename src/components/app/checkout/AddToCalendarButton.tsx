"use client";

import { Calendar } from "lucide-react";
import { addDays } from "@/lib/helpers/date";

interface AddToCalendarButtonProps {
  endDate: string | null;
  eventDescription: string;
  locale: string;
  nights: number;
  originCity: string;
  originCountry: string;
  startDate: string | null;
  tripType: string;
}

function toGCalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildGoogleCalendarUrl(
  title: string,
  start: Date,
  end: Date,
  location: string,
  details: string,
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGCalDate(start)}/${toGCalDate(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatTripDate(isoDate: string, locale: string): string {
  const d = new Date(isoDate);
  const isEs = locale.startsWith("es");
  const dayName = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  if (isEs) return `Próximo ${dayName} ${day}/${month} de ${year}`;
  return `Next ${dayName}, ${month}/${day}/${year}`;
}

export function AddToCalendarButton({
  endDate,
  eventDescription,
  locale,
  nights,
  originCity,
  originCountry,
  startDate,
  tripType,
}: AddToCalendarButtonProps) {
  if (!startDate) return null;

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : addDays(start, Math.max(nights, 1));
  const title = `${tripType.toUpperCase()} — GetRandomTrip`;
  const location = `${originCity}, ${originCountry}`;
  const href = buildGoogleCalendarUrl(title, start, end, location, eventDescription);
  const formattedDate = formatTripDate(startDate, locale);

  return (
    <a
      className="flex items-center gap-1.5 text-blue-500 underline underline-offset-2"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
      {formattedDate}
    </a>
  );
}
