import type { DocumentFieldError } from "@/lib/types/DocumentValidation";

export function createDocumentValidation() {
  const errors: DocumentFieldError[] = [];
  const add = (path: string, code: DocumentFieldError["code"]) =>
    errors.push({ path, code });
  function record(
    value: unknown,
    fields: string[],
    path: string,
  ): Record<string, unknown> | null {
    if (
      !value ||
      typeof value !== "object" ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
      Reflect.ownKeys(value).some(
        (key) =>
          !fields.some((field) => field === key) ||
          !Object.prototype.propertyIsEnumerable.call(value, key),
      )
    ) {
      add(path, "invalid_shape");
      return null;
    }
    return value as Record<string, unknown>;
  }
  return { errors, add, record };
}
