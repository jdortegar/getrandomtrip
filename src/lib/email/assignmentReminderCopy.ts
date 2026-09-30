import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

export function assignmentReminderCopy(locale: string | null) {
  return (locale === "en" ? en : es).destinationAssignmentReminder;
}

export function formatAssignmentReminderText(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    values[key] === undefined ? match : String(values[key]),
  );
}

export function formatRevealDeadline(date: Date): string {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
