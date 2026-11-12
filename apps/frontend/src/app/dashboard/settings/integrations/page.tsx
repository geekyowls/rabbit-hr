'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import {
  integrationCapabilitiesKeys,
  useJobFeedSettingsQuery,
  useMailboxesQuery,
} from '@/hooks/queries';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { CategoryChips, SearchInput } from '@/components/patterns';
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
import { toast } from '@/lib/toast';
import type {
  IntegrationListItem,
  HealthCheckResponse,
} from '@/types/integration.type';
import { useAnalytics } from '@/hooks/use-analytics';
import { ApiKeyConnectionDialog } from '@/components/integrations/api-key-connection-dialog';
import { IntegrationCard } from '@/components/integrations/integration-card';
import { MailboxCard } from '@/components/integrations/mailbox-card';
import { JobFeedCard } from '@/components/integrations/job-feed-card';

const WHATSAPP_SETTINGS_PATH = '/dashboard/settings/integrations/whatsapp';

type Category =
  'all' | 'connected' | 'calendar' | 'communication' | 'hiring' | 'other';

const PROVIDER_CATEGORY: Record<
  string,
  Exclude<Category, 'all' | 'connected'>
> = {
  google_calendar: 'calendar',
  microsoft_teams: 'calendar',
  zoom: 'calendar',
  wappcloud: 'communication',
  plivo: 'communication',
};

const CATEGORY_LABEL: Record<Category, string> = {
  all: 'All',
  connected: 'Connected',
  calendar: 'Calendar and meetings',
  communication: 'Communication',
  hiring: 'Hiring channels',
  other: 'Other',
};

const CATEGORY_ORDER: Category[] = [
  'all',
  'connected',
  'calendar',
  'communication',
  'hiring',
  'other',
];

interface Entry {
  key: string;
  category: Exclude<Category, 'all' | 'connected'>;
  connected: boolean;
  searchText: string;
  node: React.ReactNode;
}

function isNotConfiguredError(message: string) {
  return /not configured/i.test(message);
}

function IntegrationsContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Integrations', active: true },
  ]);
  const qc = useQueryClient();
  const { hasPermission } = usePermissions();
  const [integrations, setIntegrations] = useState<IntegrationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [disconnectTarget, setDisconnectTarget] =
    useState<IntegrationListItem | null>(null);
  const [apiKeyDialogTarget, setApiKeyDialogTarget] =
    useState<IntegrationListItem | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const { trackSettingsEvent } = useAnalytics();

  const loadIntegrations = useCallback(async () => {
    try {
      const data = await fetchApi<IntegrationListItem[]>(
        API_ROUTES.INTEGRATIONS.LIST,
      );
      setIntegrations(data || []);
    } catch (err: unknown) {
      toast.error(
        'Could not load integrations',
        err instanceof Error ? err.message : undefined,
      );
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    loadIntegrations();
    qc.invalidateQueries({ queryKey: integrationCapabilitiesKeys.all });
  }, [loadIntegrations, qc]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    const handleOAuthResult = (data: {
      success: boolean;
      provider: string;
      error?: string;
    }) => {
      const { success, provider, error } = data;

      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
        popupCheckInterval.current = null;
      }

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;
      setConnecting(null);

      if (success && provider) {
        toast.success('Integration connected');
        trackSettingsEvent('INTEGRATION_CONNECTED', { provider });
        refresh();
      } else if (error) {
        toast.error('Could not connect', error);
      }
    };

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'oauth-callback') {
        handleOAuthResult(event.data);
      }
    };

    const readStored = (raw: string | null) => {
      if (!raw) return;
      try {
        localStorage.removeItem('oauth-callback');
        handleOAuthResult(JSON.parse(raw));
      } catch {
        return;
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'oauth-callback') readStored(event.newValue);
    };

    try {
      readStored(localStorage.getItem('oauth-callback'));
    } catch {
      setConnecting(null);
    }

    window.addEventListener('message', handleOAuthMessage);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      window.removeEventListener('storage', handleStorageEvent);
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
    };
  }, [refresh, trackSettingsEvent]);

  const handleConnect = async (integration: IntegrationListItem) => {
    if (integration.authType === 'api_key') {
      setApiKeyDialogTarget(integration);
      return;
    }

    setConnecting(integration.provider);
    try {
      const { authUrl } = await fetchApi<{ authUrl: string }>(
        API_ROUTES.INTEGRATIONS.CONNECT(integration.provider),
        { method: 'POST' },
      );

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      popupRef.current = window.open(
        authUrl,
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
      );

      if (!popupRef.current) {
        toast.error('Allow popups to connect integrations');
        setConnecting(null);
        return;
      }

      popupCheckInterval.current = setInterval(() => {
        if (popupRef.current?.closed) {
          if (popupCheckInterval.current) {
            clearInterval(popupCheckInterval.current);
            popupCheckInterval.current = null;
          }
          setConnecting(null);
        }
      }, 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (isNotConfiguredError(message)) {
        toast.error(
          'Not configured on server',
          'Ask your administrator to add the app credentials for this integration',
        );
      } else {
        toast.error('Could not start the connection', message || undefined);
      }
      setConnecting(null);
    }
  };

  const handleTestConnection = async (integration: IntegrationListItem) => {
    setTesting(integration.provider);
    try {
      const result = await fetchApi<HealthCheckResponse>(
        API_ROUTES.INTEGRATIONS.HEALTH_CHECK(integration.provider),
        { method: 'POST' },
      );
      if (result.ok) {
        toast.success('Connection is healthy');
      } else {
        toast.error(
          'Connection check failed',
          result.errorMessage ?? undefined,
        );
      }
      refresh();
    } catch (err: unknown) {
      toast.error(
        'Could not check the connection',
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setTesting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await fetchApi(
        API_ROUTES.INTEGRATIONS.DISCONNECT(disconnectTarget.provider),
        { method: 'DELETE' },
      );
      toast.success('Integration disconnected');
      trackSettingsEvent('INTEGRATION_DISCONNECTED', {
        provider: disconnectTarget.provider,
      });
      refresh();
    } catch (err: unknown) {
      toast.error(
        'Could not disconnect',
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setDisconnectTarget(null);
    }
  };

  const query = search.trim().toLowerCase();
  const matches = useCallback(
    (text: string) => !query || text.toLowerCase().includes(query),
    [query],
  );

  const renderCard = (integration: IntegrationListItem) => (
    <IntegrationCard
      key={integration.id}
      integration={integration}
      onConnect={handleConnect}
      onDisconnect={setDisconnectTarget}
      onTestConnection={handleTestConnection}
      connecting={connecting === integration.provider}
      testing={testing === integration.provider}
      {...(integration.provider === 'wappcloud' && {
        manageHref: WHATSAPP_SETTINGS_PATH,
        manageLabel: 'Manage templates',
      })}
    />
  );

  const { data: mailboxes = [] } = useMailboxesQuery();
  const { data: jobFeed } = useJobFeedSettingsQuery();

  const entries: Entry[] = (() => {
    const list: Entry[] = integrations.map((i) => ({
      key: i.provider,
      category: PROVIDER_CATEGORY[i.provider] ?? 'other',
      connected: i.isConnected,
      searchText: `${i.name} ${i.description ?? ''}`,
      node: renderCard(i),
    }));
    if (hasPermission(PERMISSIONS_ENUM.INBOX_READ)) {
      list.push({
        key: 'mailbox',
        category: 'communication',
        connected: mailboxes.some((m) => m.status === 'connected'),
        searchText: 'email inbox gmail outlook mailbox',
        node: <MailboxCard key="mailbox" />,
      });
    }
    if (hasPermission(PERMISSIONS_ENUM.JOB_FEED_MANAGE)) {
      list.push({
        key: 'job_feed',
        category: 'hiring',
        connected: !!jobFeed?.enabled,
        searchText: 'job board feed indeed linkedin xml',
        node: <JobFeedCard key="job_feed" />,
      });
    }
    const order: Category[] = ['calendar', 'communication', 'hiring', 'other'];
    return list.sort(
      (a, b) => order.indexOf(a.category) - order.indexOf(b.category),
    );
  })();

  const inCategory = (e: Entry, c: Category) =>
    c === 'all' ? true : c === 'connected' ? e.connected : e.category === c;

  const chips = CATEGORY_ORDER.map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
    count: entries.filter((e) => inCategory(e, c)).length,
  })).filter((c) => c.value === 'all' || c.count > 0 || c.value === category);

  const visible = entries.filter(
    (e) => inCategory(e, category) && matches(e.searchText),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Integrations" backHref="/dashboard/settings" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div data-tour="integrations-header">
        <PageHeader title="Integrations" backHref="/dashboard/settings" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search integrations"
          className="w-full sm:w-64"
        />
        <CategoryChips
          value={category}
          onChange={setCategory}
          options={chips}
        />
      </div>

      {visible.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          No integrations match
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-tour="integrations-grid"
        >
          {visible.map((e) => e.node)}
        </div>
      )}

      <ApiKeyConnectionDialog
        integration={apiKeyDialogTarget}
        open={!!apiKeyDialogTarget}
        onOpenChange={(open) => {
          if (!open) setApiKeyDialogTarget(null);
        }}
        onSaved={refresh}
      />

      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect integration</AlertDialogTitle>
            <AlertDialogDescription>
              Features that use this integration are hidden until you connect it
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.INTEGRATION_LIST_READ}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to view integrations
        </div>
      }
    >
      <IntegrationsContent />
    </PermissionGuard>
  );
}
