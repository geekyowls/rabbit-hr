'use client';

import { useCallback } from 'react';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import {
  setToken,
  setRefreshToken,
  saveOriginalTokens,
  getOriginalToken,
  getOriginalRefreshToken,
  clearOriginalTokens,
  hasOriginalTokens,
  isSystemAdminAccess,
} from '@/utils/cookies';
import { toast } from '@/lib/toast';
import type { LoginResponse } from '@/types/user.type';
import { useAnalytics } from '@/hooks/use-analytics';

export function useImpersonation() {
  const { trackFeatureEvent } = useAnalytics();
  const isImpersonating = hasOriginalTokens() && !isSystemAdminAccess();

  const startImpersonation = useCallback(
    async (targetUserId: string, password: string) => {
      try {
        saveOriginalTokens();
        const data = await fetchApi<LoginResponse>(
          API_ROUTES.AUTH.IMPERSONATE,
          {
            method: 'POST',
            body: JSON.stringify({ targetUserId, password }),
          },
        );
        setToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        trackFeatureEvent('IMPERSONATION_STARTED', { userId: targetUserId });
        window.location.href = '/dashboard';
      } catch (err: unknown) {
        clearOriginalTokens();
        const message =
          err instanceof Error ? err.message : 'Failed to impersonate user';
        toast.error(message);
      }
    },
    [trackFeatureEvent],
  );

  const stopImpersonation = useCallback(() => {
    const originalToken = getOriginalToken();
    const originalRefreshToken = getOriginalRefreshToken();
    if (originalToken && originalRefreshToken) {
      setToken(originalToken);
      setRefreshToken(originalRefreshToken);
    }
    clearOriginalTokens();
    trackFeatureEvent('IMPERSONATION_ENDED');
    window.location.href = '/dashboard';
  }, [trackFeatureEvent]);

  return { isImpersonating, startImpersonation, stopImpersonation };
}
