'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox, Mail, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  integrationCapabilitiesKeys,
  useConnectMailboxMutation,
  useDisconnectMailboxMutation,
  useMailboxesQuery,
  useSyncMailboxMutation,
} from '@/hooks/queries';
import { ApiError } from '@/utils/error-class';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusPill, type PillTone } from '@/components/patterns';
import type {
  Mailbox,
  MailboxConnectionStatus,
  MailboxProvider,
} from '@/types/mailbox.type';

const PROVIDER_LABEL: Record<MailboxProvider, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
};

const STATUS_LABEL: Record<MailboxConnectionStatus, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  expired: 'Expired',
  error: 'Error',
};

const STATUS_TONE: Record<MailboxConnectionStatus, PillTone> = {
  connected: 'success',
  disconnected: 'neutral',
  expired: 'warning',
  error: 'danger',
};

function notConfiguredMessage(provider: MailboxProvider) {
  return provider === 'gmail'
    ? 'Gmail is not configured on the server, ask your administrator to add the Google app credentials'
    : 'Outlook is not configured on the server, ask your administrator to add the Microsoft app credentials';
}

function MailboxRow({
  mailbox,
  onDisconnect,
}: {
  mailbox: Mailbox;
  onDisconnect: (mailbox: Mailbox) => void;
}) {
  const fmt = useFormatters();
  const sync = useSyncMailboxMutation();

  const syncNow = async () => {
    try {
      const result = await sync.mutateAsync(mailbox.id);
      if (result.queued) toast.success('Sync started');
      else toast.info('Sync not started', result.reason ?? undefined);
    } catch (err) {
      toast.error(
        'Could not sync mailbox',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">
            {mailbox.emailAddress}
          </span>
          <StatusPill tone={STATUS_TONE[mailbox.status]} dot>
            {STATUS_LABEL[mailbox.status]}
          </StatusPill>
          {mailbox.isDemo && <StatusPill tone="purple">Demo data</StatusPill>}
          {mailbox.isShared && <StatusPill tone="info">Shared</StatusPill>}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {PROVIDER_LABEL[mailbox.provider]}
          {mailbox.lastSyncedAt &&
            `, last synced ${fmt.relative(mailbox.lastSyncedAt).toLowerCase()}`}
        </p>
        {mailbox.errorMessage && mailbox.status !== 'connected' && (
          <p className="mt-0.5 text-xs text-destructive">
            {mailbox.errorMessage}
          </p>
        )}
      </div>
      {mailbox.canManage && (
        <div className="flex items-center gap-1">
          {!mailbox.isDemo && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={syncNow}
              disabled={sync.isPending}
            >
              <RefreshCw
                className={
                  sync.isPending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'
                }
              />
              Sync now
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            aria-label="Disconnect mailbox"
            title="Disconnect mailbox"
            onClick={() => onDisconnect(mailbox)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
}

export function MailboxCard() {
  const qc = useQueryClient();
  const { hasPermission } = usePermissions();
  const canShare = hasPermission(PERMISSIONS_ENUM.MAILBOX_SHARED_MANAGE);
  const { data: mailboxes = [], isLoading } = useMailboxesQuery();
  const connect = useConnectMailboxMutation();
  const disconnect = useDisconnectMailboxMutation();
  const [shared, setShared] = useState(false);
  const [pending, setPending] = useState<MailboxProvider | null>(null);
  const [notConfigured, setNotConfigured] = useState<MailboxProvider[]>([]);
  const [target, setTarget] = useState<Mailbox | null>(null);

  const start = async (provider: MailboxProvider) => {
    setPending(provider);
    try {
      const { authUrl } = await connect.mutateAsync({ provider, shared });
      window.location.href = authUrl;
    } catch (err) {
      setPending(null);
      if (
        err instanceof ApiError &&
        err.statusCode === 400 &&
        /not configured/i.test(err.message)
      ) {
        setNotConfigured((list) => [...new Set([...list, provider])]);
        toast.error('Not configured on server', notConfiguredMessage(provider));
        return;
      }
      toast.error(
        'Could not start the connection',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const confirmDisconnect = async () => {
    if (!target) return;
    try {
      await disconnect.mutateAsync(target.id);
      qc.invalidateQueries({ queryKey: integrationCapabilitiesKeys.all });
      toast.success('Mailbox disconnected');
    } catch (err) {
      toast.error(
        'Could not disconnect mailbox',
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setTarget(null);
    }
  };

  const connectedCount = mailboxes.filter(
    (m) => m.status === 'connected',
  ).length;

  return (
    <div className="flex h-full flex-col rounded-md border bg-card p-4 sm:col-span-2">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
          <Inbox className="h-5 w-5 text-[#3F6650] dark:text-[#8FBFA1]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Email inbox</h3>
            {connectedCount > 0 && (
              <StatusPill tone="success" dot>
                Connected
              </StatusPill>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect your Gmail or Outlook mailbox to read and reply to candidate
            and client emails in RabbitHR
          </p>
        </div>
        {connectedCount > 0 && (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link href="/dashboard/inbox">Open inbox</Link>
          </Button>
        )}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : mailboxes.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {mailboxes.map((m) => (
              <MailboxRow key={m.id} mailbox={m} onDisconnect={setTarget} />
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
            No mailbox connected yet
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {canShare ? (
          <div className="flex items-center gap-2">
            <Switch
              id="mailbox-shared"
              checked={shared}
              onCheckedChange={setShared}
            />
            <Label
              htmlFor="mailbox-shared"
              className="cursor-pointer text-xs font-normal"
            >
              Share with the team
            </Label>
          </div>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          {(['gmail', 'outlook'] as MailboxProvider[]).map((provider) => (
            <Button
              key={provider}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={pending !== null || notConfigured.includes(provider)}
              onClick={() => start(provider)}
            >
              {pending === provider
                ? 'Redirecting'
                : provider === 'gmail'
                  ? 'Connect Gmail'
                  : 'Connect Outlook'}
            </Button>
          ))}
        </div>
      </div>
      {notConfigured.map((provider) => (
        <p key={provider} className="mt-2 text-xs text-muted-foreground">
          {notConfiguredMessage(provider)}
        </p>
      ))}

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect mailbox</AlertDialogTitle>
            <AlertDialogDescription>
              Synced emails are removed from RabbitHR. You can connect the
              mailbox again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisconnect}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
