export function formatAdminDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAdminAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US')}`;
}
