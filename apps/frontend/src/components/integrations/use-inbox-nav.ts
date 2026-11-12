import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import {
  hasIntegrationCapability,
  useInboxStatsQuery,
  useIntegrationCapabilities,
} from '@/hooks/queries';

export const INBOX_PATH = '/dashboard/inbox';

export function useInboxNav() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission(PERMISSIONS_ENUM.INBOX_READ);
  const { data: capabilities } = useIntegrationCapabilities(canRead);
  const visible = canRead && hasIntegrationCapability(capabilities, 'mailbox');
  const { data: stats } = useInboxStatsQuery(undefined, visible);
  return { visible, unread: visible ? (stats?.unread ?? 0) : 0 };
}

export function unreadLabel(unread: number) {
  return unread > 99 ? '99+' : String(unread);
}
