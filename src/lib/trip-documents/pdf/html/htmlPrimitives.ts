import type { VoucherItem } from "@/lib/types/VoucherData";

export function escapeHtml(value: string | number | undefined) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}
export function safeHref(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? escapeHtml(value)
      : undefined;
  } catch {
    return undefined;
  }
}
export function link(value: string, url?: string, className = "") {
  const href = safeHref(url);
  return href
    ? `<a class="${className}" href="${href}">${escapeHtml(value)}</a>`
    : escapeHtml(value);
}
export function imageData(
  buffer: Buffer,
  width: number,
  height: number,
  className = "",
) {
  // Inline SVG keeps print images self-contained; no web UI image component or URL fetch.
  return `<svg aria-hidden="true" class="${className}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image height="${height}" width="${width}" href="data:image/png;base64,${buffer.toString("base64")}"/></svg>`;
}
export function richText(value: string) {
  return value
    .split("\n")
    .map((line) => {
      const bullet = /^[•*-]\s/.test(line);
      const text = bullet ? line.replace(/^[•*-]\s/, "") : line;
      const match = text.match(/^([^:]{1,45}:)(\s*)(.*)$/);
      const content = match
        ? `<b>${escapeHtml(match[1])}</b> ${escapeHtml(match[3])}`
        : escapeHtml(text);
      return `<p class="${bullet ? "bullet" : ""}">${content || "<br>"}</p>`;
    })
    .join("");
}
export function date(
  value: string,
  locale: string,
  weekday = false,
  year = true,
) {
  const formatted = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    ...(year ? { year: "numeric" as const } : {}),
    ...(weekday ? { weekday: "long" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
  return formatted.replace(
    /(^| de )([a-záéíóúñ])/g,
    (_, prefix: string, first: string) => prefix + first.toUpperCase(),
  );
}
export function summary(label: string, value: string, detail = "") {
  return `<section class="summary card"><h2>${escapeHtml(label)}</h2><div class="accent"><strong>${escapeHtml(value)}</strong>${detail ? `<p>${escapeHtml(detail)}</p>` : ""}</div></section>`;
}
export function numberedItems(items: VoucherItem[]) {
  return items
    .map(
      (item, index) =>
        `<div class="numbered-item chunk"><span class="number">${index + 1}</span><div><h3>${escapeHtml(item.title)}</h3><div class="description">${richText(item.description || "")}</div></div></div>`,
    )
    .join("");
}
