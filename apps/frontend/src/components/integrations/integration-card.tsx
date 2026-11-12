'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType, CSSProperties } from 'react';
import {
  Calendar,
  MoreVertical,
  Phone,
  Puzzle,
  Slack,
  Users,
  Video,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/brand-icons';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/patterns';
import { usePlanFeature } from '@/hooks/queries';
import { UpgradeHint } from '@/components/billing/upgrade-hint';
import type { IntegrationListItem } from '@/types/integration.type';

type IconComponent = ComponentType<{
  className?: string;
  style?: CSSProperties;
}>;

const PROVIDER_ICON: Record<string, { icon: IconComponent; color?: string }> = {
  google_calendar: { icon: Calendar, color: '#4285F4' },
  zoom: { icon: Video, color: '#2D8CFF' },
  slack: { icon: Slack, color: '#4A154B' },
  microsoft_teams: { icon: Users, color: '#6264A7' },
  plivo: { icon: Phone, color: '#43B02A' },
  wappcloud: { icon: WhatsAppIcon },
};

const ICON_FILE_PROVIDERS = new Set([
  'google_calendar',
  'zoom',
  'slack',
  'microsoft_teams',
  'plivo',
  'openai',
  'gemini',
]);

export function IntegrationIcon({
  provider,
  iconUrl,
  name,
}: {
  provider: string;
  iconUrl?: string | null;
  name: string;
}) {
  const meta = PROVIDER_ICON[provider];
  const Icon = meta?.icon ?? Puzzle;
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background p-1.5">
      {iconUrl && ICON_FILE_PROVIDERS.has(provider) ? (
        <Image
          src={iconUrl}
          alt={name}
          width={40}
          height={40}
          className="h-full w-full object-contain"
          unoptimized
        />
      ) : (
        <Icon
          className="h-5 w-5"
          style={meta?.color ? { color: meta.color } : undefined}
        />
      )}
    </div>
  );
}

export function IntegrationStatusBadge({
  integration,
}: {
  integration: IntegrationListItem;
}) {
  if (!integration.isConfigured && !integration.isConnected) {
    return <StatusPill tone="neutral">Not configured</StatusPill>;
  }
  switch (integration.status) {
    case 'connected':
      return (
        <StatusPill tone="success" dot>
          Connected
        </StatusPill>
      );
    case 'expired':
      return (
        <StatusPill tone="warning" dot>
          Expired
        </StatusPill>
      );
    case 'error':
      return (
        <StatusPill tone="danger" dot>
          Error
        </StatusPill>
      );
    default:
      return null;
  }
}

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onTestConnection,
  connecting,
  testing,
  manageHref,
  manageLabel,
}: {
  integration: IntegrationListItem;
  onConnect: (integration: IntegrationListItem) => void;
  onDisconnect: (integration: IntegrationListItem) => void;
  onTestConnection: (integration: IntegrationListItem) => void;
  connecting: boolean;
  testing: boolean;
  manageHref?: string;
  manageLabel?: string;
}) {
  const { hasPermission } = usePermissions();
  const { hasFeature } = usePlanFeature(integration.planFeature);
  const planLocked = !hasFeature;
  const isApiKey = integration.authType === 'api_key';
  const canConnect = hasPermission(PERMISSIONS_ENUM.INTEGRATION_CONNECT);
  const canDisconnect = hasPermission(PERMISSIONS_ENUM.INTEGRATION_DISCONNECT);
  const hasError =
    integration.status === 'error' || integration.status === 'expired';
  const connectLabel = hasError
    ? isApiKey
      ? 'Update'
      : 'Reconnect'
    : 'Connect';

  return (
    <div className="flex h-full flex-col rounded-md border bg-card p-4">
      <div className="flex items-start gap-3">
        <IntegrationIcon
          provider={integration.provider}
          iconUrl={integration.iconUrl}
          name={integration.name}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold">
              {integration.name}
            </h3>
            <IntegrationStatusBadge integration={integration} />
          </div>
          {integration.description && (
            <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">
              {integration.description}
            </p>
          )}
        </div>
        {integration.isConnected && (canDisconnect || canConnect) && (
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
                  Update credentials
                </DropdownMenuItem>
              )}
              {canConnect && (
                <DropdownMenuItem
                  onClick={() => onTestConnection(integration)}
                  disabled={testing}
                >
                  {testing ? 'Checking' : 'Check connection'}
                </DropdownMenuItem>
              )}
              {canDisconnect && (
                <DropdownMenuItem
                  onClick={() => onDisconnect(integration)}
                  className="text-destructive focus:text-destructive"
                >
                  Disconnect
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-3 space-y-1 text-xs">
        {integration.isConnected &&
          (integration.accountEmail || integration.accountName) && (
            <p className="truncate text-muted-foreground">
              {integration.accountEmail || integration.accountName}
            </p>
          )}
        {hasError && integration.errorMessage && (
          <p className="line-clamp-2 text-destructive">
            {integration.errorMessage}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 pt-3">
        {manageHref && integration.isConnected && (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link href={manageHref}>{manageLabel ?? 'Manage'}</Link>
          </Button>
        )}
        {planLocked && integration.planFeature && (
          <UpgradeHint feature={integration.planFeature} />
        )}
        {!planLocked &&
          (!integration.isConnected || hasError) &&
          integration.isConfigured &&
          canConnect && (
            <Button
              size="sm"
              variant={hasError ? 'outline' : 'default'}
              className={cn('h-7 px-3 text-xs')}
              onClick={() => onConnect(integration)}
              disabled={connecting}
            >
              {connecting ? 'Connecting' : connectLabel}
            </Button>
          )}
      </div>
    </div>
  );
}
