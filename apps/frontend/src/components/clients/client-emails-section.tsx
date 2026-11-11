'use client';

import { Mail } from 'lucide-react';
import { SectionCard } from '@/components/patterns';
import { LinkedEmailThreads } from '@/components/comms/linked-email-threads';
import { useUserMailbox } from '@/components/comms/use-user-mailbox';

export function ClientEmailsSection({ clientId }: { clientId: string }) {
  const { connected } = useUserMailbox();
  if (!connected) return null;
  return (
    <SectionCard icon={Mail} title="Emails" bodyClassName="p-4">
      <LinkedEmailThreads
        target={{ clientId }}
        emptyTitle="No emails linked to this client yet"
        emptyDescription="Emails with this client or about their candidates appear here"
      />
    </SectionCard>
  );
}
