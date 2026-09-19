'use client';

import { JWTPayload, Organization } from '@/types/user.type';
import { OrganizationConfig } from '@/types/organization-config.type';
import type { PagePreferences } from '@/types/page-preferences.type';
import { getUserFromToken } from '@/utils/auth';
import {
  getToken,
  getActiveToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  clearTokens,
  clearOriginalTokens,
  clearSystemAccessToken,
} from '@/utils/cookies';
import { buildApiUrl, API_ROUTES, API_URL } from '@/config/api-routes';
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { useOpenPanel } from '@openpanel/nextjs';
import { setGlitchtipUser, clearGlitchtipUser } from '@/lib/glitchtip';

interface SessionContextType {
  user: JWTPayload | null;
  organization: Organization | null;
  organizationConfig: OrganizationConfig | null;
  userPreferences: UserPreferences | null;
  pagePreferences: PagePreferences | null;
  setUser: (user: JWTPayload | null) => void;
  setOrganization: (org: Organization | null) => void;
  setOrganizationConfig: (config: OrganizationConfig | null) => void;
  setUserPreferences: (prefs: UserPreferences | null) => void;
  setPagePreferences: (prefs: PagePreferences | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  logout: () => void;
  loadFullSession: (token: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  organization: null,
  organizationConfig: null,
  userPreferences: null,
  pagePreferences: null,
  setUser: () => {},
  setOrganization: () => {},
  setOrganizationConfig: () => {},
  setUserPreferences: () => {},
  setPagePreferences: () => {},
  isLoading: true,
  isAuthenticated: false,
  isLoggingOut: false,
  logout: () => {},
  loadFullSession: async () => {},
});

interface SessionProviderProps {
  children: ReactNode;
}

export interface UserPreferences {
  tourCompleted: boolean;
}

interface MeResponse {
  organization: Organization;
  organizationConfig: OrganizationConfig;
  tourCompleted?: boolean;
  pagePreferences?: PagePreferences;
}

interface MeResult {
  organization: Organization | null;
  organizationConfig: OrganizationConfig | null;
  userPreferences: UserPreferences | null;
  pagePreferences: PagePreferences | null;
}

async function fetchMe(token: string): Promise<MeResult> {
  try {
    const response = await fetch(`${API_URL}${API_ROUTES.USERS.ME}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok)
      return {
        organization: null,
        organizationConfig: null,
        userPreferences: null,
        pagePreferences: null,
      };

    const data = await response.json();
    const meData = data.data as MeResponse;
    return {
      organization: meData.organization,
      organizationConfig: meData.organizationConfig,
      userPreferences: {
        tourCompleted: meData.tourCompleted ?? false,
      },
      pagePreferences: meData.pagePreferences ?? null,
    };
  } catch {
    return {
      organization: null,
      organizationConfig: null,
      userPreferences: null,
      pagePreferences: null,
    };
  }
}

async function tryRefreshSession(): Promise<JWTPayload | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(buildApiUrl(API_ROUTES.AUTH.REFRESH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    const { accessToken, refreshToken: newRefreshToken } = data.data;

    setToken(accessToken);
    setRefreshToken(newRefreshToken);

    return getUserFromToken(accessToken);
  } catch {
    clearTokens();
    return null;
  }
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationConfig, setOrganizationConfig] =
    useState<OrganizationConfig | null>(null);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [pagePreferences, setPagePreferences] =
    useState<PagePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAuthenticated = !!user;
  const router = useRouter();
  const op = useOpenPanel();

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const token = getToken();
      const refreshToken = getRefreshToken();
      if (token) {
        await fetch(buildApiUrl(API_ROUTES.AUTH.LOGOUT), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken: refreshToken || '' }),
        });
      }
    } catch {
      // Still logout locally even if API fails
    } finally {
      op?.clear();
      setUser(null);
      setOrganization(null);
      setOrganizationConfig(null);
      setUserPreferences(null);
      setPagePreferences(null);
      clearTokens();
      clearOriginalTokens();
      clearSystemAccessToken();
      setIsLoggingOut(false);
      router.push('/');
    }
  }, [router, isLoggingOut, op]);

  const loadFullSession = useCallback(async (token: string) => {
    const meResult = await fetchMe(token);
    if (meResult.organization) {
      setOrganization(meResult.organization);
    }
    if (meResult.organizationConfig) {
      setOrganizationConfig(meResult.organizationConfig);
    }
    if (meResult.userPreferences) {
      setUserPreferences(meResult.userPreferences);
    }
    setPagePreferences(meResult.pagePreferences);
  }, []);

  const handleCrossTabLogout = useCallback(() => {
    if (!user) return;

    setUser(null);
    setOrganization(null);
    setOrganizationConfig(null);
    setUserPreferences(null);
    setPagePreferences(null);
    router.push('/');
  }, [user, router]);

  useEffect(() => {
    async function initSession() {
      const token = getActiveToken();
      if (token) {
        const userData = getUserFromToken(token);
        if (userData) {
          setUser(userData);
          const meResult = await fetchMe(token);
          setOrganization(meResult.organization);
          setOrganizationConfig(meResult.organizationConfig);
          setUserPreferences(meResult.userPreferences);
          setPagePreferences(meResult.pagePreferences);
          setIsLoading(false);
          return;
        }
      }

      if (getRefreshToken()) {
        const refreshedUser = await tryRefreshSession();
        if (refreshedUser) {
          setUser(refreshedUser);
          const newToken = getToken();
          if (newToken) {
            const meResult = await fetchMe(newToken);
            setOrganization(meResult.organization);
            setOrganizationConfig(meResult.organizationConfig);
            setUserPreferences(meResult.userPreferences);
            setPagePreferences(meResult.pagePreferences);
          }
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    }

    initSession();
  }, []);

  useEffect(() => {
    if (user) {
      setGlitchtipUser({
        id: user.userId,
        email: user.email,
        organizationId: user.organizationId,
      });
    } else {
      clearGlitchtipUser();
    }
  }, [user]);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [logout]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' && event.oldValue && !event.newValue) {
        handleCrossTabLogout();
        return;
      }

      if (
        event.key === 'systemAccessToken' &&
        event.oldValue &&
        !event.newValue
      ) {
        window.location.reload();
        return;
      }

      if (event.key === 'originalToken' && event.oldValue && !event.newValue) {
        window.location.reload();
        return;
      }

      if (event.key === 'token' && !event.oldValue && event.newValue && !user) {
        window.location.reload();
        return;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleCrossTabLogout, user]);

  const contextValue = useMemo(
    () => ({
      user,
      organization,
      organizationConfig,
      userPreferences,
      pagePreferences,
      setUser,
      setOrganization,
      setOrganizationConfig,
      setUserPreferences,
      setPagePreferences,
      isLoading,
      isAuthenticated,
      isLoggingOut,
      logout,
      loadFullSession,
    }),
    [
      user,
      organization,
      organizationConfig,
      userPreferences,
      pagePreferences,
      isLoading,
      isAuthenticated,
      isLoggingOut,
      logout,
      loadFullSession,
    ],
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
