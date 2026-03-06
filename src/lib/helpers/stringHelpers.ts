/**
 * Replaces the copyright symbol with <sup>©</sup> for proper typography in HTML.
 */
export function formatTitleWithCopyright(title: string): string {
  return title.replace(/©/g, '<sup>©</sup>');
}

/**
 * Returns the first character of a name, uppercased, or '?' if empty/whitespace.
 */
export function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}
