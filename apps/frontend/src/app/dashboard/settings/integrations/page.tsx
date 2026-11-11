'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { integrationCapabilitiesKeys } from '@/hooks/queries';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/patterns';
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

const CALENDAR_PROVIDERS = ['google_calendar', 'microsoft_teams', 'zoom'];
const COMMUNICATION_PROVIDERS = ['wappcloud', 'plivo'];
const GROUPED_PROVIDERS = new Set([
  ...CALENDAR_PROVIDERS,
  ...COMMUNICATION_PROVIDERS,
]);

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
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

  const byProvider = useMemo(() => {
    const map = new Map<string, IntegrationListItem>();
    for (const i of integrations) map.set(i.provider, i);
    return map;
  }, [integrations]);

  const pick = (providers: string[]) =>
    providers
      .map((p) => byProvider.get(p))
      .filter(
        (i): i is IntegrationListItem =>
          !!i && matches(`${i.name} ${i.description ?? ''}`),
      );

  const others = integrations.filter(
    (i) =>
      !GROUPED_PROVIDERS.has(i.provider) &&
      matches(`${i.name} ${i.description ?? ''}`),
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

  const calendar = pick(CALENDAR_PROVIDERS);
  const communication = pick(COMMUNICATION_PROVIDERS);
  const showMailbox =
    hasPermission(PERMISSIONS_ENUM.INBOX_READ) &&
    matches('email inbox gmail outlook mailbox');
  const showJobFeed =
    hasPermission(PERMISSIONS_ENUM.JOB_FEED_MANAGE) &&
    matches('job board feed indeed linkedin xml');
  const connectedCount = integrations.filter((i) => i.isConnected).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Integrations" backHref="/dashboard/settings" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const nothing =
    calendar.length === 0 &&
    communication.length === 0 &&
    others.length === 0 &&
    !showMailbox &&
    !showJobFeed;

  return (
    <div className="space-y-6">
      <div data-tour="integrations-header">
        <PageHeader
          title="Integrations"
          description={`${connectedCount} of ${integrations.length} connected`}
          backHref="/dashboard/settings"
          actions={
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search integrations"
            />
          }
        />
      </div>

      {nothing && (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No integrations match your search
        </div>
      )}

      <div className="space-y-6" data-tour="integrations-grid">
        {calendar.length > 0 && (
          <Section
            title="Calendar and meetings"
            description="Sync interviews to calendars and create meeting links automatically"
          >
            {calendar.map(renderCard)}
          </Section>
        )}

        {(showMailbox || communication.length > 0) && (
          <Section
            title="Communication"
            description="Email, WhatsApp and calls with candidates and clients"
          >
            {showMailbox && <MailboxCard />}
            {communication.map(renderCard)}
          </Section>
        )}

        {showJobFeed && (
          <Section
            title="Hiring channels"
            description="Share your open jobs with job boards"
          >
            <JobFeedCard />
          </Section>
        )}

        {others.length > 0 && (
          <Section title="Other" description="More connected services">
            {others.map(renderCard)}
          </Section>
        )}
      </div>

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
