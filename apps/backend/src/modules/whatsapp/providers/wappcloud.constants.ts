const DEFAULT_WAPPCLOUD_API_BASE = 'https://client-api.wappcloud.com/api/v1';

export function wappCloudApiBase(): string {
  return process.env.WAPPCLOUD_API_BASE || DEFAULT_WAPPCLOUD_API_BASE;
}

export function wappCloudHeaders(
  apiKey: string,
  accessToken: string,
): Record<string, string> {
  return {
    'x-api-key': apiKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

export function wappCloudErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as { message?: unknown; details?: unknown; error?: unknown };
  if (typeof b.details === 'string' && b.details) return b.details;
  if (typeof b.error === 'string' && b.error) return b.error;
  if (b.error && typeof b.error === 'object') {
    const nested = (b.error as { message?: unknown }).message;
    if (typeof nested === 'string' && nested) return nested;
  }
  if (typeof b.message === 'string' && b.message) return b.message;
  return null;
}
