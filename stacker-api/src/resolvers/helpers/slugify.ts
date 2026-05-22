/**
 * Convert a string to a URL-friendly slug.
 * Lowercase, hyphens between words, no leading/trailing hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
