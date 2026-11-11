const MAX_KEY_LENGTH = 64;

export function toSlugKey(text: string, fallbackPrefix: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const prefixed = /^[a-z]/.test(slug) ? slug : `${fallbackPrefix}_${slug}`;
  return prefixed.slice(0, MAX_KEY_LENGTH).replace(/_+$/g, '');
}

export function uniqueSlugKey(base: string, taken: Set<string>): string {
  let key = base;
  let suffix = 2;
  while (taken.has(key)) {
    const tail = `_${suffix++}`;
    key = `${base.slice(0, MAX_KEY_LENGTH - tail.length)}${tail}`;
  }
  taken.add(key);
  return key;
}
