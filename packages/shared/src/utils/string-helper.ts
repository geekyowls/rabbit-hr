export function formatFoodName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function toTitleCase(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(
      /(^|[\s\-'])([a-zÀ-ɏ])/g,
      (_, sep: string, ch: string) => sep + ch.toUpperCase(),
    );
}
