'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES } from '@/config/api-routes';
import { portalKeys, usePortalMeQuery } from '@/hooks/queries';
import {
  PORTAL_SESSION_EXPIRED,
  publicPortalRequest,
} from '@/utils/portal-api-client';
import {
  clearPortalTokens,
  getPortalOrgSlug,
  getPortalRefreshToken,
  hasPortalSession,
  setPortalOrgSlug,
} from '@/utils/portal-tokens';
import type { PortalMe } from '@/types/portal.type';
import { DEFAULT_PORTAL_BRAND, portalLoginHref } from './portal-utils';

interface PortalSessionValue {
  me: PortalMe;
  brand: string;
  signOut: () => Promise<void>;
}

const PortalSessionContext = createContext<PortalSessionValue | null>(null);

export function usePortalSession() {
  const value = useContext(PortalSessionContext);
  if (!value) {
    throw new Error('usePortalSession must be used inside PortalSessionGate');
  }
  return value;
}

export function PortalSessionGate({
  loading,
  failed,
  children,
}: {
  loading: React.ReactNode;
  failed: (retry: () => void, signOut: () => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const meQuery = usePortalMeQuery(ready);

  const toLogin = useCallback(() => {
    queryClient.removeQueries({ queryKey: portalKeys.all });
    router.replace(portalLoginHref(getPortalOrgSlug()));
  }, [queryClient, router]);

  useEffect(() => {
    if (!hasPortalSession()) {
      toLogin();
      return;
    }
    setReady(true);
    window.addEventListener(PORTAL_SESSION_EXPIRED, toLogin);
    return () => window.removeEventListener(PORTAL_SESSION_EXPIRED, toLogin);
  }, [toLogin]);

  const orgSlug = meQuery.data?.organization.slug;
  useEffect(() => {
    if (orgSlug) setPortalOrgSlug(orgSlug);
  }, [orgSlug]);

  const signOut = useCallback(async () => {
    const refreshToken = getPortalRefreshToken();
    clearPortalTokens();
    if (refreshToken) {
      await publicPortalRequest(API_ROUTES.PORTAL.LOGOUT, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    toLogin();
  }, [toLogin]);

  const value = useMemo<PortalSessionValue | null>(
    () =>
      meQuery.data
        ? {
            me: meQuery.data,
            brand: meQuery.data.organization.brandColor || DEFAULT_PORTAL_BRAND,
            signOut,
          }
        : null,
    [meQuery.data, signOut],
  );

  if (!ready || meQuery.isLoading) return <>{loading}</>;
  if (!value) {
    return (
      <>
        {failed(
          () => meQuery.refetch(),
          () => void signOut(),
        )}
      </>
    );
  }
  return (
    <PortalSessionContext.Provider value={value}>
      {children}
    </PortalSessionContext.Provider>
  );
}
