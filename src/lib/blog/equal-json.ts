/** PostgreSQL JSONB does not preserve object key order. Arrays remain ordered. */
export function equalBlogJson(left: unknown, right: unknown): boolean {
  const canonical = (value: unknown): string | undefined =>
    JSON.stringify(value ?? null, (_key, item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const record = item as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(record)
          .sort()
          .map((key) => [key, record[key]]),
      );
    });
  return canonical(left) === canonical(right);
}
