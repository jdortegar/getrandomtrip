// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Day of the week on which XSED drops occur.
 * 0 = Sunday, 1 = Monday, 2 = Tuesday, …, 6 = Saturday.
 */
export const DROP_DAY_OF_WEEK = 0; // Sunday

/** Local time (in any LATAM timezone) when the booking window opens. */
export const LOCAL_WINDOW_START_HOUR = 16; // 4pm

/** Local time (in any LATAM timezone) when the booking window closes. */
export const LOCAL_WINDOW_END_HOUR = 20; // 8pm

/**
 * UTC outer boundary used server-side as a fast guard before running
 * the heavier auto-decrement computation. Wide enough to cover Hermosillo (UTC-7).
 *   Sunday 19:00 UTC  = 4pm ART (UTC-3)  — earliest LATAM open
 *   Monday 03:00 UTC  = 8pm Hermosillo (UTC-7) — latest LATAM close
 */
export const SERVER_OUTER_OPEN_UTC_HOUR = 19;
export const SERVER_OUTER_CLOSE_UTC_HOUR = 3;

/** All supported LATAM IANA timezone identifiers. */
export const SUPPORTED_TIMEZONES = [
  // Argentina (UTC-3, no DST)
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Salta",
  "America/Argentina/Jujuy",
  "America/Argentina/Tucuman",
  "America/Argentina/Catamarca",
  "America/Argentina/La_Rioja",
  "America/Argentina/San_Juan",
  "America/Argentina/Mendoza",
  "America/Argentina/San_Luis",
  "America/Argentina/Rio_Gallegos",
  "America/Argentina/Ushuaia",
  // Bolivia (UTC-4)
  "America/La_Paz",
  // Brazil (UTC-2 to UTC-5; Intl handles DST)
  "America/Sao_Paulo",
  "America/Belem",
  "America/Fortaleza",
  "America/Recife",
  "America/Araguaina",
  "America/Maceio",
  "America/Bahia",
  "America/Cuiaba",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Manaus",
  "America/Eirunepe",
  "America/Rio_Branco",
  "America/Noronha",
  // Chile (DST handled by Intl)
  "America/Santiago",
  "America/Punta_Arenas",
  // Colombia (UTC-5)
  "America/Bogota",
  // Costa Rica (UTC-6)
  "America/Costa_Rica",
  // Cuba (DST handled by Intl)
  "America/Havana",
  // Dominican Republic (UTC-4)
  "America/Santo_Domingo",
  // Ecuador (UTC-5)
  "America/Guayaquil",
  // El Salvador (UTC-6)
  "America/El_Salvador",
  // Guatemala (UTC-6)
  "America/Guatemala",
  // Haiti (DST handled by Intl)
  "America/Port-au-Prince",
  // Honduras (UTC-6)
  "America/Tegucigalpa",
  // Jamaica (UTC-5)
  "America/Jamaica",
  // Mexico (UTC-5 to UTC-7; border DST handled by Intl)
  "America/Mexico_City",
  "America/Cancun",
  "America/Monterrey",
  "America/Merida",
  "America/Bahia_Banderas",
  "America/Mazatlan",
  "America/Hermosillo",
  "America/Chihuahua",
  "America/Ojinaga",
  "America/Tijuana",
  // Nicaragua (UTC-6)
  "America/Managua",
  // Panama (UTC-5)
  "America/Panama",
  // Paraguay (DST handled by Intl)
  "America/Asuncion",
  // Peru (UTC-5)
  "America/Lima",
  // Puerto Rico (UTC-4)
  "America/Puerto_Rico",
  // Uruguay (UTC-3)
  "America/Montevideo",
  // Venezuela (UTC-4)
  "America/Caracas",
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns what weekday (0=Sun) and hour it currently is in `tz`. */
function getLocalInfo(
  tz: string,
  date: Date,
): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    weekday: weekdayMap[wd] ?? 1,
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
  };
}

/**
 * Returns the UTC offset of `tz` at `date` in fractional hours (positive = ahead of UTC).
 * Uses the sv-SE locale trick: format local time, parse as UTC, diff against real UTC.
 */
export function getUtcOffsetHours(tz: string, date: Date): number {
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  // sv-SE gives "YYYY-MM-DD HH:MM"
  const [datePart, timePart] = s.split(" ");
  const [y, mo, d] = (datePart ?? "").split("-").map(Number);
  const [h, mi] = (timePart ?? "").split(":").map(Number);
  const localAsUtc = Date.UTC(y!, mo! - 1, d!, h!, mi!, 0);
  return (localAsUtc - date.getTime()) / 3_600_000;
}

/**
 * Finds the UTC `Date` that represents `targetHour`:00:00 local time in `tz`
 * on the nearest upcoming DROP_DAY_OF_WEEK (0 days ahead if today is the drop
 * day and the target hour hasn't passed yet; 7 days ahead otherwise).
 */
function getNextDropDayLocalHour(
  tz: string,
  targetHour: number,
  now = new Date(),
): Date {
  // Anchor to noon UTC first so the local weekday check and the date arithmetic
  // operate on the same calendar day — fixes the off-by-one when local and UTC
  // dates differ (e.g. late Friday night locally = Saturday UTC).
  const noonUTC = new Date(now);
  noonUTC.setUTCHours(12, 0, 0, 0);

  // Hours >= 24 mean the target rolls into the next calendar day (e.g. 24 = midnight).
  const overflowDays = Math.floor(targetHour / 24);
  const actualHour = targetHour % 24;
  const targetDay = (DROP_DAY_OF_WEEK + overflowDays) % 7;

  const { weekday } = getLocalInfo(tz, noonUTC);
  const daysUntilDrop = (targetDay - weekday + 7) % 7;

  noonUTC.setUTCDate(noonUTC.getUTCDate() + daysUntilDrop);

  const offsetHours = getUtcOffsetHours(tz, noonUTC);
  // actualHour local  =  actualHour - offsetHours  UTC
  let utcHour = actualHour - offsetHours;

  const target = new Date(noonUTC);
  if (utcHour >= 24) {
    target.setUTCDate(target.getUTCDate() + 1);
    utcHour -= 24;
  } else if (utcHour < 0) {
    target.setUTCDate(target.getUTCDate() - 1);
    utcHour += 24;
  }
  target.setUTCHours(utcHour, 0, 0, 0);

  // If the result is in the past, jump to the following drop day
  if (target <= now) {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  return target;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * CLIENT-ONLY.
 * Returns the user's IANA timezone if it is in SUPPORTED_TIMEZONES, otherwise null.
 */
export function detectSupportedTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (SUPPORTED_TIMEZONES as readonly string[]).includes(tz) ? tz : null;
  } catch {
    return null;
  }
}

/**
 * Shared (client + server).
 * Returns true if it is currently drop-day 16:00–20:00 local time in `tz`.
 */
export function isLocalWindowOpen(tz: string, date = new Date()): boolean {
  const { weekday, hour } = getLocalInfo(tz, date);
  return (
    weekday === DROP_DAY_OF_WEEK &&
    hour >= LOCAL_WINDOW_START_HOUR &&
    hour < LOCAL_WINDOW_END_HOUR
  );
}

/**
 * CLIENT-ONLY.
 * Returns 'open' if the booking window is currently open for the user's detected timezone,
 * 'waiting' otherwise (including if the timezone is not supported).
 */
export function getPhase(): "open" | "waiting" {
  const tz = detectSupportedTimezone();
  if (!tz) return "waiting";
  return isLocalWindowOpen(tz) ? "open" : "waiting";
}

/**
 * Shared (client + server).
 * Returns the UTC Date that the countdown should target:
 *   - If window is open  → end of current window (drop-day 20:00 local)
 *   - If window is closed → start of next window  (drop-day 16:00 local)
 *
 * Falls back to 'America/Argentina/Buenos_Aires' if `tz` is null/empty.
 */
export function getCountdownTarget(tz: string | null, now = new Date()): Date {
  const resolvedTz = tz ?? "America/Argentina/Buenos_Aires";
  if (isLocalWindowOpen(resolvedTz, now)) {
    return getNextDropDayLocalHour(resolvedTz, LOCAL_WINDOW_END_HOUR, now);
  }
  return getNextDropDayLocalHour(resolvedTz, LOCAL_WINDOW_START_HOUR, now);
}

/**
 * SERVER-ONLY.
 * Cheap outer boundary check before running the heavier auto-decrement computation.
 * Returns true if `now` falls anywhere within any supported LATAM timezone's booking window.
 */
export function isWithinServerOuterBoundary(date = new Date()): boolean {
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  const nextDay = (DROP_DAY_OF_WEEK + 1) % 7;
  if (day === DROP_DAY_OF_WEEK && hour >= SERVER_OUTER_OPEN_UTC_HOUR)
    return true;
  if (day === nextDay && hour < SERVER_OUTER_CLOSE_UTC_HOUR) return true;
  return false;
}
