'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Search, MoreVertical } from 'lucide-react';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const CATEGORY_LABELS: Record<string, string> = {
  calendar: 'Calendar',
  video_conferencing: 'Video',
  messaging: 'Messaging',
  productivity: 'Productivity',
  ai: 'AI',
  telephony: 'Telephony',
  payments: 'Payments',
};

function categoryLabel(value: string): string {
  return (
    CATEGORY_LABELS[value] ??
    value
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onTestConnection,
  connecting,
  testing,
}: {
  integration: IntegrationListItem;
  onConnect: (integration: IntegrationListItem) => void;
  onDisconnect: (provider: string) => void;
  onTestConnection: (provider: string) => void;
  connecting: string | null;
  testing: string | null;
}) {
  const { hasPermission } = usePermissions();
  const isConnecting = connecting === integration.provider;
  const isTesting = testing === integration.provider;
  const isApiKey = integration.authType === 'api_key';
  const canConnect = hasPermission(PERMISSIONS_ENUM.INTEGRATION_CONNECT);
  const canDisconnect = hasPermission(PERMISSIONS_ENUM.INTEGRATION_DISCONNECT);

  const renderStatusBadge = () => {
    if (!integration.isConfigured) {
      return (
        <Badge
          variant="outline"
          className="shrink-0 text-[10px] font-normal text-muted-foreground"
        >
          Not configured
        </Badge>
      );
    }
    switch (integration.status) {
      case 'connected':
        return (
          <Badge className="shrink-0 border-transparent bg-green-100 text-[10px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
            Connected
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            Expired
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="shrink-0 text-[10px]">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderAction = () => {
    if (integration.isConnected) {
      if (!canDisconnect && !(isApiKey && canConnect)) return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              aria-label="Manage integration"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isApiKey && canConnect && (
              <DropdownMenuItem onClick={() => onConnect(integration)}>
                Configure
              </DropdownMenuItem>
            )}
            {isApiKey && canConnect && (
              <DropdownMenuItem
                onClick={() => onTestConnection(integration.provider)}
                disabled={isTesting}
              >
                {isTesting ? 'Testing...' : 'Test connection'}
              </DropdownMenuItem>
            )}
            {canDisconnect && (
              <DropdownMenuItem
                onClick={() => onDisconnect(integration.provider)}
                className="text-destructive focus:text-destructive"
              >
                Disconnect
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (!integration.isConfigured || !canConnect) return null;

    const label =
      integration.status === 'error'
        ? isApiKey
          ? 'Update'
          : 'Reconnect'
        : integration.status === 'expired'
          ? 'Reconnect'
          : 'Connect';

    const variant =
      integration.status === 'error' || integration.status === 'expired'
        ? 'outline'
        : 'default';

    return (
      <Button
        size="sm"
        variant={variant}
        className="h-7 shrink-0 px-3 text-xs"
        onClick={() => onConnect(integration)}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : label}
      </Button>
    );
  };

  const subtext =
    integration.status === 'error' && integration.errorMessage
      ? integration.errorMessage
      : integration.isConnected && integration.accountEmail
        ? integration.accountEmail
        : null;

  return (
    <div className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 p-1.5">
          {integration.iconUrl ? (
            <Image
              src={integration.iconUrl}
              alt={integration.name}
              width={40}
              height={40}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <div className="h-full w-full rounded bg-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">
              {integration.name}
            </h3>
            {renderStatusBadge()}
          </div>
          {integration.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {integration.description}
            </p>
          )}
        </div>
        {integration.isConnected && renderAction()}
      </div>

      {(subtext || !integration.isConnected) && (
        <div className="mt-4 flex min-h-[28px] items-center justify-between gap-2">
          {subtext ? (
            <span
              className={`truncate text-xs ${
                integration.status === 'error'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {subtext}
            </span>
          ) : (
            <Badge
              variant="secondary"
              className="shrink-0 rounded-full px-2.5 text-[10px] font-medium"
            >
              {categoryLabel(integration.category)}
            </Badge>
          )}
          {!integration.isConnected && renderAction()}
        </div>
      )}
    </div>
  );
}

function IntegrationsContent() {
  const [integrations, setIntegrations] = useState<IntegrationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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
      const message =
        err instanceof Error ? err.message : 'Failed to load integrations';
      toast.error(message);
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        const providerName = provider.replace(/_/g, ' ');
        toast.success(
          `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} connected successfully`,
        );
        trackSettingsEvent('INTEGRATION_CONNECTED', { provider });
        loadIntegrations();
      } else if (error) {
        toast.error(`Failed to connect: ${error}`);
      }
    };

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'oauth-callback') {
        handleOAuthResult(event.data);
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'oauth-callback' && event.newValue) {
        const data = JSON.parse(event.newValue);
        localStorage.removeItem('oauth-callback');
        handleOAuthResult(data);
      }
    };

    const pendingCallback = localStorage.getItem('oauth-callback');
    if (pendingCallback) {
      localStorage.removeItem('oauth-callback');
      handleOAuthResult(JSON.parse(pendingCallback));
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
  }, [loadIntegrations, trackSettingsEvent]);

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
        toast.error('Please allow popups to connect integrations');
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
      const message =
        err instanceof Error ? err.message : 'Failed to initiate connection';
      toast.error(message);
      setConnecting(null);
    }
  };

  const handleTestConnection = async (provider: string) => {
    setTesting(provider);
    try {
      const result = await fetchApi<HealthCheckResponse>(
        API_ROUTES.INTEGRATIONS.HEALTH_CHECK(provider),
        { method: 'POST' },
      );
      if (result.ok) {
        toast.success('Connection is healthy');
      } else {
        toast.error(result.errorMessage || 'Connection check failed');
      }
      loadIntegrations();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to run health check';
      toast.error(message);
    } finally {
      setTesting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await fetchApi(
        API_ROUTES.INTEGRATIONS.DISCONNECT(disconnectTarget.provider),
        {
          method: 'DELETE',
        },
      );
      toast.success(`${disconnectTarget.name} disconnected`);
      trackSettingsEvent('INTEGRATION_DISCONNECTED', {
        provider: disconnectTarget.provider,
      });
      loadIntegrations();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to disconnect';
      toast.error(message);
    } finally {
      setDisconnectTarget(null);
    }
  };

  const categories = useMemo(() => {
    const present = Array.from(
      new Set(integrations.map((i) => i.category)),
    ).sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
    return ['all', ...present];
  }, [integrations]);

  const connectedCount = useMemo(
    () => integrations.filter((i) => i.isConnected).length,
    [integrations],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return integrations.filter((i) => {
      const matchesCategory =
        activeCategory === 'all' || i.category === activeCategory;
      const matchesSearch =
        !query ||
        i.name.toLowerCase().includes(query) ||
        (i.description ?? '').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [integrations, search, activeCategory]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Integrations" backHref="/dashboard/settings" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div data-tour="integrations-header">
        <PageHeader title="Integrations" backHref="/dashboard/settings" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {connectedCount} of {integrations.length} connected
        </span>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={activeCategory === category ? 'default' : 'outline'}
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? 'All' : categoryLabel(category)}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No integrations match your search
        </div>
      ) : (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-tour="integrations-grid"
        >
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={(provider) => {
                const target = integrations.find(
                  (i) => i.provider === provider,
                );
                if (target) setDisconnectTarget(target);
              }}
              onTestConnection={handleTestConnection}
              connecting={connecting}
              testing={testing}
            />
          ))}
        </div>
      )}

      <ApiKeyConnectionDialog
        integration={apiKeyDialogTarget}
        open={!!apiKeyDialogTarget}
        onOpenChange={(open) => {
          if (!open) setApiKeyDialogTarget(null);
        }}
        onSaved={() => {
          loadIntegrations();
        }}
      />

      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect {disconnectTarget?.name}? You
              can reconnect it later.
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
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You don&apos;t have permission to view integrations
        </div>
      }
    >
      <IntegrationsContent />
    </PermissionGuard>
  );
}
