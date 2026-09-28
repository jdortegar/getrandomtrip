interface TimeLeft {
  days: number;
  hours: number;
  min: number;
  sec: number;
}

export function computeTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const min = Math.floor((diff % 3600) / 60);
  const sec = diff % 60;
  return { days, hours, min, sec };
}

export function formatTargetTime(target: Date): string {
  const hh = String(target.getHours()).padStart(2, "0");
  const mm = String(target.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}HS.`;
}

export function formatTargetDate(target: Date, locale: string): string {
  const tag = locale === "en" ? "en-US" : "es-ES";
  const dayName = target
    .toLocaleDateString(tag, { weekday: "long" })
    .toUpperCase();
  const day = target.getDate();
  const month = target.getMonth() + 1;
  const hh = String(target.getHours()).padStart(2, "0");
  const mm = String(target.getMinutes()).padStart(2, "0");
  return `${dayName} ${day}/${month} ${hh}:${mm}HS.`;
}
