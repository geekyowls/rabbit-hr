'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Database,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { OnboardingStepKey } from '@boilerplate/shared';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useAddSampleDataMutation,
  useDismissOnboardingMutation,
  useOnboardingChecklist,
  useRemoveSampleDataMutation,
} from '@/hooks/queries/use-onboarding-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BILLING_SETTINGS_PATH } from '@/components/billing/billing-links';
import type { OnboardingStep } from '@/types/onboarding.type';

const STEP_CONFIG: Record<
  OnboardingStepKey,
  { label: string; description: string; href: string }
> = {
  [OnboardingStepKey.COMPANY]: {
    label: 'Add your company logo and details',
    description: 'Shown on your careers page, offers and emails',
    href: '/dashboard/settings/organization',
  },
  [OnboardingStepKey.REGION]: {
    label: 'Set your region and formatting',
    description: 'Currency, time zone and date format',
    href: '/dashboard/settings/ats',
  },
  [OnboardingStepKey.TEAM]: {
    label: 'Invite your team',
    description: 'Bring in the recruiters who work with you',
    href: '/dashboard/settings/users',
  },
  [OnboardingStepKey.CLIENT]: {
    label: 'Add your first client',
    description: 'The companies you recruit for',
    href: '/dashboard/clients',
  },
  [OnboardingStepKey.JOB]: {
    label: 'Post your first job',
    description:
      'Publish it to your careers page to start receiving applicants',
    href: '/dashboard/jobs',
  },
  [OnboardingStepKey.INBOX]: {
    label: 'Connect your email inbox',
    description: 'Read and reply to candidate and client emails in RabbitHR',
    href: '/dashboard/settings/integrations',
  },
};

function errorMessage(err: unknown): string | undefined {
  return err instanceof Error ? err.message : undefined;
}

function StepRow({ step }: { step: OnboardingStep }) {
  const config = STEP_CONFIG[step.key];
  const label = step.upgradeRequired
    ? 'Upgrade to invite your team'
    : config.label;
  const href = step.upgradeRequired ? BILLING_SETTINGS_PATH : config.href;
  return (
    <li>
      <Link
        href={href}
        className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
      >
        {step.done ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
        ) : step.upgradeRequired ? (
          <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : (
          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block text-sm font-medium',
              step.done && 'text-muted-foreground line-through',
            )}
          >
            {label}
          </span>
          <span className="block text-xs text-muted-foreground">
            {step.upgradeRequired
              ? 'The Free plan includes one team member'
              : config.description}
          </span>
        </span>
        {!step.done && (
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </Link>
    </li>
  );
}

export function OnboardingChecklistCard() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS_ENUM.ORGANIZATION_UPDATE);
  const { data } = useOnboardingChecklist(canManage);
  const dismiss = useDismissOnboardingMutation();
  const addSample = useAddSampleDataMutation();
  const removeSample = useRemoveSampleDataMutation();

  if (!canManage || !data || data.dismissed) return null;
  const allDone = data.total > 0 && data.completed >= data.total;
  if (allDone && !data.hasSampleData) return null;

  const percent = data.total > 0 ? (data.completed / data.total) * 100 : 0;
  const samplePending = addSample.isPending || removeSample.isPending;

  const toggleSample = async () => {
    try {
      if (data.hasSampleData) {
        await removeSample.mutateAsync();
        toast.success('Sample data removed');
      } else {
        const result = await addSample.mutateAsync();
        toast.success(
          'Sample data added',
          `${result.clients} clients, ${result.jobs} draft jobs and ${result.candidates} candidates, all marked as sample`,
        );
      }
    } catch (err) {
      toast.error('Could not update sample data', errorMessage(err));
    }
  };

  const hide = async () => {
    try {
      await dismiss.mutateAsync();
    } catch (err) {
      toast.error('Could not hide the checklist', errorMessage(err));
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Get started</h2>
          <p className="text-xs text-muted-foreground">
            A few steps to set up your agency workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {`${data.completed} of ${data.total} done`}
          </span>
          <Progress value={percent} className="h-1.5 w-24" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={samplePending}
            onClick={toggleSample}
          >
            {data.hasSampleData ? (
              <Trash2 className="size-3.5" />
            ) : (
              <Database className="size-3.5" />
            )}
            {data.hasSampleData
              ? 'Remove sample data'
              : 'Explore with sample data'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="Hide checklist"
            title="Hide checklist"
            disabled={dismiss.isPending}
            onClick={hide}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <ul className="grid gap-x-4 p-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.steps.map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </ul>
    </Card>
  );
}
