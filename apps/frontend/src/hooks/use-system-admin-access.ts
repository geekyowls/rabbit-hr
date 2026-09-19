'use client';

import { useCallback } from 'react';
import { clearSystemAccessToken, isSystemAdminAccess } from '@/utils/cookies';

export function useSystemAdminAccess() {
  const isInSystemAdminMode = isSystemAdminAccess();

  const exitSystemAdminAccess = useCallback(() => {
    clearSystemAccessToken();
    window.location.href = '/system/organizations';
  }, []);

  return { isInSystemAdminMode, exitSystemAdminAccess };
}
