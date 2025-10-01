/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug with dashes
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with dashes
      .replace(/[^\w\s-]/g, '')
      // Replace multiple spaces with single dash
      .replace(/[\s_-]+/g, '-')
      // Remove leading/trailing dashes
      .replace(/^-+|-+$/g, '')
  );
}
