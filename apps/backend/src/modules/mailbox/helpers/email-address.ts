import type { EmailParticipant } from '@db/entities';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function splitAddressList(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let inAngle = false;
  for (const char of value) {
    if (char === '"') inQuotes = !inQuotes;
    if (char === '<' && !inQuotes) inAngle = true;
    if (char === '>' && !inQuotes) inAngle = false;
    if (char === ',' && !inQuotes && !inAngle) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function parseAddressList(
  value: string | null | undefined,
): EmailParticipant[] {
  if (!value) return [];
  return splitAddressList(value)
    .map((part) => {
      const match = part.match(/^(.*)<([^>]+)>\s*$/);
      if (match) {
        const name = match[1].trim().replace(/^"|"$/g, '').trim();
        return { email: normalizeEmail(match[2]), name: name || null };
      }
      return { email: normalizeEmail(part), name: null };
    })
    .filter((participant) => participant.email.includes('@'));
}

export function uniqueParticipants(
  participants: Array<{ email: string; name?: string | null }>,
): EmailParticipant[] {
  const byEmail = new Map<string, EmailParticipant>();
  for (const participant of participants) {
    const email = normalizeEmail(participant.email);
    const existing = byEmail.get(email);
    if (!existing || (!existing.name && participant.name)) {
      byEmail.set(email, { email, name: participant.name ?? null });
    }
  }
  return [...byEmail.values()];
}

export function truncate(value: string | null | undefined, max: number) {
  if (!value) return '';
  return value.length > max ? value.slice(0, max) : value;
}
