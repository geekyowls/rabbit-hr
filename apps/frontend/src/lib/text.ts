export function formatFreeTextLabel(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function titleCaseWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function titleCaseTag(tag: string): string {
  return tag
    .replace(/-/g, ' ')
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}

export function formatTagListDisplay(
  value: string | string[] | null | undefined,
): string {
  if (!value) return '';
  const parts = Array.isArray(value)
    ? value
    : value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  return parts.map(titleCaseTag).filter(Boolean).join(', ');
}
