const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ORIGINAL_TOKEN_KEY = 'originalToken';
const ORIGINAL_REFRESH_TOKEN_KEY = 'originalRefreshToken';
const SYSTEM_ADMIN_ACCESS_KEY = 'isSystemAdminAccess';
const SYSTEM_ACCESS_TOKEN_KEY = 'systemAccessToken';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function saveOriginalTokens(): void {
  const token = getToken();
  const refreshToken = getRefreshToken();
  if (token) localStorage.setItem(ORIGINAL_TOKEN_KEY, token);
  if (refreshToken)
    localStorage.setItem(ORIGINAL_REFRESH_TOKEN_KEY, refreshToken);
}

export function getOriginalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ORIGINAL_TOKEN_KEY);
}

export function getOriginalRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ORIGINAL_REFRESH_TOKEN_KEY);
}

export function clearOriginalTokens(): void {
  localStorage.removeItem(ORIGINAL_TOKEN_KEY);
  localStorage.removeItem(ORIGINAL_REFRESH_TOKEN_KEY);
  localStorage.removeItem(SYSTEM_ADMIN_ACCESS_KEY);
  localStorage.removeItem(SYSTEM_ACCESS_TOKEN_KEY);
}

export function hasOriginalTokens(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(ORIGINAL_TOKEN_KEY);
}

export function setSystemAdminAccess(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem(SYSTEM_ADMIN_ACCESS_KEY, 'true');
  } else {
    localStorage.removeItem(SYSTEM_ADMIN_ACCESS_KEY);
  }
}

export function isSystemAdminAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SYSTEM_ADMIN_ACCESS_KEY) === 'true';
}

export function getSystemAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SYSTEM_ACCESS_TOKEN_KEY);
}

export function setSystemAccessToken(token: string): void {
  localStorage.setItem(SYSTEM_ACCESS_TOKEN_KEY, token);
}

export function clearSystemAccessToken(): void {
  localStorage.removeItem(SYSTEM_ACCESS_TOKEN_KEY);
  localStorage.removeItem(SYSTEM_ADMIN_ACCESS_KEY);
}

export function getActiveToken(): string | null {
  if (isSystemAdminAccess()) {
    return getSystemAccessToken();
  }
  return getToken();
}
