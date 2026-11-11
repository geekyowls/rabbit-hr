import { useIntegrationCapabilities, useMailboxesQuery } from '@/hooks/queries';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';

export function useUserMailbox() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission(PERMISSIONS_ENUM.INBOX_READ);
  const { data: capabilities, isLoading } = useIntegrationCapabilities();
  const connected = canRead && !!capabilities?.mailbox.connected;
  const { data: mailboxes = [] } = useMailboxesQuery(connected);
  const usable = mailboxes.filter((m) => m.status === 'connected');
  const mailbox = usable.find((m) => m.isOwner) ?? usable[0] ?? null;
  return {
    loading: isLoading,
    connected,
    canSend: connected && hasPermission(PERMISSIONS_ENUM.INBOX_SEND),
    mailbox,
    isDemo: mailbox?.isDemo ?? false,
  };
}
