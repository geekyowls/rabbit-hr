import { useMemo } from 'react';
import { useOrganizationAtsSettings } from '@/hooks/queries/use-ats-settings-query';
import { createFormatters } from '@/lib/format';

export function useFormatters() {
  const settings = useOrganizationAtsSettings();
  return useMemo(() => createFormatters(settings), [settings]);
}
