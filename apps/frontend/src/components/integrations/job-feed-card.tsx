'use client';

import Link from 'next/link';
import { Rss } from 'lucide-react';
import { PlanFeature } from '@boilerplate/shared';
import { useJobFeedSettingsQuery, usePlanFeature } from '@/hooks/queries';
import { UpgradeHint } from '@/components/billing/upgrade-hint';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/patterns';

export const JOB_FEED_SETTINGS_PATH =
  '/dashboard/settings/integrations/job-feed';

export function JobFeedCard() {
  const { hasFeature } = usePlanFeature(PlanFeature.JOB_FEED);
  const { data } = useJobFeedSettingsQuery(hasFeature);

  return (
    <div className="flex h-full flex-col rounded-md border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
          <Rss className="h-5 w-5 text-orange-500 dark:text-orange-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Job board feed</h3>
            {data &&
              (data.enabled ? (
                <StatusPill tone="success" dot>
                  Enabled
                </StatusPill>
              ) : (
                <StatusPill tone="neutral">Off</StatusPill>
              ))}
          </div>
          <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">
            Publish open jobs to Indeed, LinkedIn and other boards through an
            XML feed
          </p>
        </div>
      </div>
      <div className="mt-auto flex justify-end pt-3">
        {hasFeature ? (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link href={JOB_FEED_SETTINGS_PATH}>
              {data?.enabled ? 'Manage' : 'Set up'}
            </Link>
          </Button>
        ) : (
          <UpgradeHint feature={PlanFeature.JOB_FEED} />
        )}
      </div>
    </div>
  );
}
