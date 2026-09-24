import * as flagSvgs from "country-flag-icons/string/3x2";

/**
 * SVG markup for one country's flag (renders the same on every OS, unlike
 * flag emoji on Windows). Server-only: the namespace import holds every
 * flag, so only the chosen one should reach the client.
 */
export function getWelcomeFlagSvg(code: string): string | null {
  return (flagSvgs as Record<string, string>)[code] ?? null;
}
