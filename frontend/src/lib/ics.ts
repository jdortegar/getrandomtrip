// frontend/src/lib/ics.ts

/** Escapa caracteres especiales para iCalendar.
 *  Acepta cualquier tipo y lo convierte a string de forma segura. */
function icsEscape(val: unknown): string {
  const s = String(val ?? '');
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Convierte string|Date a iCal UTC (YYYYMMDDTHHMMSSZ). Devuelve undefined si es inválida. */
function toIcsUtc(input?: string | Date): string | undefined {
  if (input == null) return undefined;
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return undefined;

  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${h}${mi}${s}Z`;
}

/** Genera un data:URL con un evento ICS. start/end pueden ser string ISO o Date. */
export function buildICS(
  title: unknown,
  start?: string | Date,
  end?: string | Date,
  location?: unknown
) {
  const now = new Date();
  const dtstamp = toIcsUtc(now)!;

  const dtstart = toIcsUtc(start) ?? dtstamp;
  const dtend =
    toIcsUtc(end) ??
    toIcsUtc(new Date(now.getTime() + 2 * 60 * 60 * 1000))!; // fallback +2h

  const uid = `${Date.now()}@randomtrip`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Randomtrip//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${icsEscape(title)}`,
    `LOCATION:${icsEscape(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const body = lines.join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
}
