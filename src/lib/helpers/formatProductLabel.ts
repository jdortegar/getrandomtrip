/** Display-only: keep identifiers and localized/free-form copy unchanged. */
export function formatProductLabel(value: string): string {
  return value.toLowerCase() === "xsed" ? value.toUpperCase() : value;
}
