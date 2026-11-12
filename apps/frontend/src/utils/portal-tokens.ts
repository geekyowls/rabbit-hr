const PORTAL_TOKEN_KEY = 'portalToken';
const PORTAL_REFRESH_TOKEN_KEY = 'portalRefreshToken';
const PORTAL_ORG_KEY = 'portalOrgSlug';

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export function getPortalToken(): string | null {
  return read(PORTAL_TOKEN_KEY);
}

export function getPortalRefreshToken(): string | null {
  return read(PORTAL_REFRESH_TOKEN_KEY);
}

export function setPortalTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(PORTAL_TOKEN_KEY, accessToken);
  localStorage.setItem(PORTAL_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearPortalTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_REFRESH_TOKEN_KEY);
}

export function getPortalOrgSlug(): string | null {
  return read(PORTAL_ORG_KEY);
}

export function setPortalOrgSlug(slug: string) {
  localStorage.setItem(PORTAL_ORG_KEY, slug);
}

export function hasPortalSession(): boolean {
  return !!getPortalRefreshToken();
}
