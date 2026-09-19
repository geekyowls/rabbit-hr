'use client';

import { useState, useCallback } from 'react';
import { useSession } from '@/contexts/session-context';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { toast } from '@/lib/toast';
import type { SavedView, PagePreferences } from '@/types/page-preferences.type';

const MAX_SAVED_VIEWS = 10;

export function useSavedViews(page: string, allLabel = 'All') {
  const { pagePreferences, setPagePreferences } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  const views: SavedView[] = (pagePreferences?.[page]?.savedViews ?? []).filter(
    (v): v is SavedView => !!v && !!v.name,
  );

  const persistViews = useCallback(
    async (updatedViews: SavedView[]): Promise<boolean> => {
      setIsSaving(true);
      try {
        const result = await fetchApi<PagePreferences>(
          API_ROUTES.USERS.PAGE_PREFERENCES,
          {
            method: 'PUT',
            body: JSON.stringify({ page, savedViews: updatedViews }),
          },
        );
        setPagePreferences(result ?? null);
        return true;
      } catch {
        toast.error('Failed to save view');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [page, setPagePreferences],
  );

  const validateViewName = useCallback(
    (name: string, excludeName?: string): string | null => {
      const trimmed = name.trim();
      if (!trimmed) return 'Name is required';
      if (trimmed.toLowerCase() === allLabel.toLowerCase())
        return 'This name is reserved';
      if (trimmed.length > 30) return 'Name must be 30 characters or less';
      if (
        views.some(
          (v) =>
            v.name?.toLowerCase() === trimmed.toLowerCase() &&
            v.name !== excludeName,
        )
      )
        return 'A view with this name already exists';
      return null;
    },
    [views, allLabel],
  );

  const saveView = useCallback(
    async (name: string, filters: Record<string, string>) => {
      const isOverwrite = views.some((v) => v.name === name);
      if (!isOverwrite && views.length >= MAX_SAVED_VIEWS) {
        toast.error(`Maximum ${MAX_SAVED_VIEWS} views reached`);
        return;
      }
      const existing = views.filter((v) => v.name !== name);
      const updated = [...existing, { name, filters }];
      const ok = await persistViews(updated);
      if (ok) toast.success('View saved');
    },
    [views, persistViews],
  );

  const deleteView = useCallback(
    async (name: string) => {
      const updated = views.filter((v) => v.name !== name);
      const ok = await persistViews(updated);
      if (ok) toast.success('View deleted');
    },
    [views, persistViews],
  );

  const renameView = useCallback(
    async (oldName: string, newName: string) => {
      const updated = views.map((v) =>
        v.name === oldName ? { ...v, name: newName } : v,
      );
      const ok = await persistViews(updated);
      if (ok) toast.success('View renamed');
    },
    [views, persistViews],
  );

  const updateView = useCallback(
    async (name: string, filters: Record<string, string>) => {
      const updated = views.map((v) =>
        v.name === name ? { ...v, filters } : v,
      );
      const ok = await persistViews(updated);
      if (ok) toast.success('View updated');
    },
    [views, persistViews],
  );

  return {
    views,
    saveView,
    deleteView,
    renameView,
    updateView,
    validateViewName,
    isSaving,
    MAX_SAVED_VIEWS,
  };
}
