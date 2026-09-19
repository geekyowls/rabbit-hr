/**
 * Builds full URL by joining base URL and path, handling trailing slashes
 * @param baseUrl - Base URL that might have trailing slash
 * @param path - Path to append (should start with /)
 * @returns Full URL without double slashes
 */
export function buildUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) return path;
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalized}${path}`;
}
