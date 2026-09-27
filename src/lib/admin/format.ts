export function formatAdminDate(iso: string | null, locale = "en-US"): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAdminAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}
