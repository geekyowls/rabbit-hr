'use client';

import { ApiError } from '@/utils/error-class';
import { API_ROUTES, API_URL, buildApiUrl } from '@/config/api-routes';
import {
  clearPortalTokens,
  getPortalRefreshToken,
  getPortalToken,
  setPortalTokens,
} from '@/utils/portal-tokens';
import type { PortalTokens } from '@/types/portal.type';

export const PORTAL_SESSION_EXPIRED = 'portal-session-expired';

let refreshing: Promise<string> | null = null;

function errorMessage(body: unknown): string {
  const raw = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(raw)) return String(raw[0] ?? 'Request failed');
  return typeof raw === 'string' && raw ? raw : 'Request failed';
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  return response.json().catch(() => undefined);
}

function expireSession() {
  clearPortalTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PORTAL_SESSION_EXPIRED));
  }
}

async function refreshPortalToken(): Promise<string> {
  const refreshToken = getPortalRefreshToken();
  if (!refreshToken) throw new ApiError('Session expired', 401);
  const response = await fetch(`${API_URL}${API_ROUTES.PORTAL.REFRESH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    expireSession();
    throw new ApiError('Session expired', 401);
  }
  const body = (await response.json()) as { data: PortalTokens };
  setPortalTokens(body.data.accessToken, body.data.refreshToken);
  return body.data.accessToken;
}

function refreshOnce(): Promise<string> {
  refreshing ??= refreshPortalToken().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function unwrap<T>(response: Response): Promise<T> {
  const body = await readJson(response);
  if (!response.ok) {
    throw new ApiError(errorMessage(body), response.status);
  }
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export async function fetchPortalApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const request = (token: string | null) =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
      },
    });

  const response = await request(getPortalToken());
  if (response.status === 401 && getPortalRefreshToken()) {
    const token = await refreshOnce();
    const retry = await request(token);
    if (retry.status === 401) expireSession();
    return unwrap<T>(retry);
  }
  if (response.status === 401) expireSession();
  return unwrap<T>(response);
}

export async function publicPortalRequest<T>(
  route: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildApiUrl(route), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  return unwrap<T>(response);
}
