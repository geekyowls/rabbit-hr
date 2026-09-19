'use client';

import { ApiError } from '@/utils/error-class';
import { API_URL, API_ROUTES } from '@/config/api-routes';
import {
  getActiveToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  clearTokens,
} from '@/utils/cookies';

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError('No refresh token', 401);
  }

  const response = await fetch(`${API_URL}${API_ROUTES.AUTH.REFRESH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    throw new ApiError('Session expired', 401);
  }

  const result = await response.json();
  const { accessToken, refreshToken: newRefreshToken } = result.data;

  setToken(accessToken);
  setRefreshToken(newRefreshToken);

  return accessToken;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
    }
    const rawMessage = data.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0] || 'Request failed'
      : rawMessage || 'Request failed';
    throw new ApiError(message, response.status);
  }

  // Paginated response - return as-is
  if (Array.isArray(data.data) && 'total' in data && 'page' in data) {
    return data as T;
  }

  // Standard wrapped response - unwrap
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (token: string | null) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
      },
    });
  };

  const response = await makeRequest(getActiveToken());

  // Handle 401 with refresh token
  if (response.status === 401 && getRefreshToken()) {
    let newToken: string;

    if (isRefreshing) {
      newToken = await new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
    } else {
      isRefreshing = true;
      try {
        newToken = await refreshAccessToken();
        processQueue(null, newToken);
      } catch (err) {
        processQueue(err as Error, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    const retryResponse = await makeRequest(newToken);
    return parseResponse<T>(retryResponse);
  }

  return parseResponse<T>(response);
}

export async function fetchApiBlob(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const makeRequest = async (token: string | null) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
      },
    });
  };

  const response = await makeRequest(getActiveToken());

  if (response.status === 401 && getRefreshToken()) {
    let newToken: string;

    if (isRefreshing) {
      newToken = await new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
    } else {
      isRefreshing = true;
      try {
        newToken = await refreshAccessToken();
        processQueue(null, newToken);
      } catch (err) {
        processQueue(err as Error, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    return makeRequest(newToken);
  }

  return response;
}
