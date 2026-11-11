'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  integrationCapabilitiesKeys,
  useJobFeedSettingsQuery,
  useUpdateJobFeedSettingsMutation,
} from '@/hooks/queries';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { SectionCard } from '@/components/patterns';
import { CopyField } from '@/components/integrations/copy-field';
import type { UpdateJobFeedSettingsRequest } from '@/types/job-feed.type';

const HELP_STEPS = [
  'Turn the feed on and copy the URL for the board you want to use',
  'In the job board employer or partner settings, add an XML feed and paste the URL',
  'The board checks the feed every few hours and lists the same open jobs as your careers page',
  'Closed jobs drop out of the feed on the next check',
];

function ToggleRow({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function JobFeedContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Integrations', href: '/dashboard/settings/integrations' },
    { label: 'Job board feed', active: true },
  ]);
  const fmt = useFormatters();
  const qc = useQueryClient();
  const { data, isLoading } = useJobFeedSettingsQuery();
  const update = useUpdateJobFeedSettingsMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const save = async (patch: UpdateJobFeedSettingsRequest, done: string) => {
    try {
      await update.mutateAsync(patch);
      qc.invalidateQueries({ queryKey: integrationCapabilitiesKeys.all });
      toast.success(done);
    } catch (err) {
      toast.error(
        'Could not update the job feed',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Job board feed"
        description="Publish open jobs to job boards through an XML feed"
        backHref="/dashboard/settings/integrations"
      />

      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <SectionCard title="Feed settings" bodyClassName="space-y-4 p-4">
            <ToggleRow
              id="feed-enabled"
              label="Enable feed"
              hint="When off, job boards cannot read the feed"
              checked={data.enabled}
              disabled={update.isPending}
              onChange={(enabled) =>
                save({ enabled }, enabled ? 'Feed enabled' : 'Feed turned off')
              }
            />
            <ToggleRow
              id="feed-client-names"
              label="Include client names"
              hint="Show the hiring client on each job, turn off to keep clients confidential"
              checked={data.includeClientNames}
              disabled={update.isPending}
              onChange={(includeClientNames) =>
                save({ includeClientNames }, 'Feed settings saved')
              }
            />
          </SectionCard>

          <SectionCard
            title="Feed URLs"
            subtitle={
              data.lastAccessedAt
                ? `Last fetched by a job board ${fmt.relative(data.lastAccessedAt).toLowerCase()}`
                : 'Not fetched by a job board yet'
            }
            actions={
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={update.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate URLs
              </Button>
            }
            bodyClassName="space-y-4 p-4"
          >
            {data.feedUrls ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Indeed XML
                  </Label>
                  <CopyField
                    value={data.feedUrls.indeed}
                    label="Copy Indeed feed URL"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    LinkedIn XML
                  </Label>
                  <CopyField
                    value={data.feedUrls.linkedin}
                    label="Copy LinkedIn feed URL"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enable the feed to get your feed URLs
              </p>
            )}
          </SectionCard>

          <SectionCard title="How job boards use the feed" bodyClassName="p-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {HELP_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </SectionCard>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate feed URLs</AlertDialogTitle>
            <AlertDialogDescription>
              The current URLs stop working straight away. Update the feed URL
              on every job board that uses it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                save({ regenerateToken: true }, 'Feed URLs regenerated')
              }
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function JobFeedPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.JOB_FEED_MANAGE}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to manage the job feed
        </div>
      }
    >
      <JobFeedContent />
    </PermissionGuard>
  );
}
