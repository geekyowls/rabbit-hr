type Escapable = string | number | null | undefined;

export function escapeHtml(value: Escapable): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'number' ? value.toString() : value;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeHtmlAttr(value: Escapable): string {
  return escapeHtml(value);
}
