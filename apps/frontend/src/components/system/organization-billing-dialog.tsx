'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  OrgSubscriptionStatus,
  PLANS,
  PlanId,
  TRIAL_PERIOD_DAYS,
  isPlanId,
} from '@boilerplate/shared';
import { zodResolver } from '@/lib/zod-resolver';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { toast } from '@/lib/toast';
import {
  organizationBillingSchema,
  type OrganizationBillingFormData,
} from '@/schemas/billing.schema';
import { SUBSCRIPTION_STATUS_LABELS } from '@/components/billing/billing-status';
import type { UpdateOrganizationBillingRequest } from '@/types/billing.type';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface OrganizationBillingTarget {
  id: string;
  name: string;
  plan: string | null;
  subscriptionStatus: OrgSubscriptionStatus;
  memberLimitOverride: number | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const COMP_END = '2099-12-31';

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function toIso(value: string): string | null {
  return value ? new Date(`${value}T23:59:59.000Z`).toISOString() : null;
}

function defaultsFor(
  target: OrganizationBillingTarget,
): OrganizationBillingFormData {
  return {
    plan: isPlanId(target.plan) ? target.plan : PlanId.STARTER,
    status: target.subscriptionStatus,
    memberLimit: target.memberLimitOverride
      ? String(target.memberLimitOverride)
      : '',
    trialEndsAt: toDateInput(target.trialEndsAt),
    subscriptionEndsAt: toDateInput(target.subscriptionEndsAt),
  };
}

export function OrganizationBillingDialog({
  target,
  onClose,
  onSaved,
}: {
  target: OrganizationBillingTarget | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationBillingFormData>({
    resolver: zodResolver(organizationBillingSchema),
    defaultValues: {
      plan: PlanId.STARTER,
      status: OrgSubscriptionStatus.TRIAL,
      memberLimit: '',
      trialEndsAt: '',
      subscriptionEndsAt: '',
    },
  });

  useEffect(() => {
    if (target) reset(defaultsFor(target));
  }, [target, reset]);

  const extendTrial = () => {
    const current = getValues('trialEndsAt');
    const base = Math.max(
      Date.now(),
      current ? new Date(current).getTime() : 0,
    );
    const next = new Date(base + TRIAL_PERIOD_DAYS * DAY_MS);
    setValue('status', OrgSubscriptionStatus.TRIAL);
    setValue('trialEndsAt', next.toISOString().slice(0, 10));
  };

  const comp = () => {
    setValue('status', OrgSubscriptionStatus.ACTIVE);
    setValue('subscriptionEndsAt', COMP_END);
  };

  const onSubmit = async (data: OrganizationBillingFormData) => {
    if (!target) return;
    const body: UpdateOrganizationBillingRequest = {
      plan: data.plan,
      status: data.status,
      memberLimitOverride: data.memberLimit ? Number(data.memberLimit) : null,
      trialEndsAt: toIso(data.trialEndsAt),
      subscriptionEndsAt: toIso(data.subscriptionEndsAt),
    };
    try {
      await fetchApi(
        API_ROUTES.SYSTEM_ADMIN.ORGANIZATIONS.UPDATE_BILLING(target.id),
        { method: 'PATCH', body: JSON.stringify(body) },
      );
      toast.success('Billing updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        'Could not update billing',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Billing for {target?.name}</DialogTitle>
          <DialogDescription>
            Set an enterprise plan, comp an account or extend a trial
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Plan</Label>
              <Controller
                control={control}
                name="plan"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PLANS).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(OrgSubscriptionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {SUBSCRIPTION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="billing-member-limit">Member limit</Label>
            <Input
              id="billing-member-limit"
              inputMode="numeric"
              placeholder="Plan default"
              {...register('memberLimit')}
            />
            {errors.memberLimit && (
              <p className="text-xs text-destructive">
                {errors.memberLimit.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="billing-trial-ends">Trial ends</Label>
              <Input
                id="billing-trial-ends"
                type="date"
                {...register('trialEndsAt')}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="billing-access-until">Access until</Label>
              <Input
                id="billing-access-until"
                type="date"
                {...register('subscriptionEndsAt')}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={extendTrial}
            >
              {`Extend trial ${TRIAL_PERIOD_DAYS} days`}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={comp}>
              Comp account
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
