/**
 * Replaces the copyright symbol with <sup>©</sup> for proper typography in HTML.
 */
export function formatTitleWithCopyright(title: string): string {
  return title.replace(/©/g, '<sup>©</sup>');
}
