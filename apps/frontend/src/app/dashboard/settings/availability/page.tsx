'use client';

import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CalendarClock, Clock } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { timeZoneOptions } from '@/lib/format';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import {
  useMyAvailabilityQuery,
  useUpdateMyAvailabilityMutation,
} from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, SectionCard } from '@/components/patterns';
import { SearchableSelect } from '@/components/common/searchable-select';
import { WeeklyHoursEditor } from '@/components/availability/weekly-hours-editor';
import { TimeOffList } from '@/components/availability/time-off-list';
import {
  BUFFER_OPTIONS,
  MIN_NOTICE_OPTIONS,
  availabilitySchema,
  minutesLabel,
  toDays,
  toWeeklyHours,
  type AvailabilityFormValues,
} from '@/components/availability/availability-utils';
import type { InterviewerAvailability } from '@/types/availability.type';

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function toValues(a: InterviewerAvailability): AvailabilityFormValues {
  return {
    timezone: a.timezone,
    days: toDays(a.weeklyHours),
    bufferMinutes: a.bufferMinutes,
    minNoticeMinutes: a.minNoticeMinutes,
    maxDaysAhead: a.maxDaysAhead,
  };
}

const EMPTY_VALUES: AvailabilityFormValues = {
  timezone: 'UTC',
  days: toDays([]),
  bufferMinutes: 0,
  minNoticeMinutes: 0,
  maxDaysAhead: 30,
};

function withCurrent<T extends number>(options: T[], current: T) {
  return Array.from(new Set([...options, current])).sort((a, b) => a - b);
}

function AvailabilityForm({
  availability,
}: {
  availability: InterviewerAvailability;
}) {
  const update = useUpdateMyAvailabilityMutation();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: EMPTY_VALUES,
  });

  useResetOnKey(
    `${availability.userId}:${availability.isDefault}:${availability.timezone}`,
    () => reset(toValues(availability)),
  );

  const timezone = useWatch({ control, name: 'timezone' });

  const timeZones = useMemo(() => {
    const list = timeZoneOptions();
    const zones = list.includes(availability.timezone)
      ? list
      : [availability.timezone, ...list];
    return zones.map((tz) => ({ value: tz, label: tz.replace(/_/g, ' ') }));
  }, [availability.timezone]);

  const onSubmit = async (v: AvailabilityFormValues) => {
    try {
      const saved = await update.mutateAsync({
        timezone: v.timezone,
        weeklyHours: toWeeklyHours(v.days),
        bufferMinutes: v.bufferMinutes,
        minNoticeMinutes: v.minNoticeMinutes,
        maxDaysAhead: v.maxDaysAhead,
      });
      reset(toValues(saved));
      toast.success('Availability saved');
    } catch (err) {
      toast.error(
        'Could not save availability',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <PageHeader
          title="My availability"
          description="When candidates can book interviews with you through booking links"
          backHref="/dashboard/settings"
          actions={
            <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saving' : 'Save changes'}
            </Button>
          }
        />

        <SectionCard
          icon={CalendarClock}
          title="Weekly hours"
          subtitle={
            availability.isDefault
              ? 'Using default hours, save to make them your own'
              : 'Your regular working hours each week'
          }
          bodyClassName="px-4 py-1"
        >
          <WeeklyHoursEditor control={control} errors={errors} />
        </SectionCard>

        <SectionCard
          icon={Clock}
          title="Booking rules"
          subtitle="Time zone and limits for self scheduled interviews"
          bodyClassName="p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Time zone" error={errors.timezone?.message}>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={timeZones}
                    placeholder="Select time zone"
                    searchPlaceholder="Search time zone"
                  />
                )}
              />
            </Field>
            <Field
              label="Buffer between interviews"
              hint="Gap kept free before and after each interview"
              error={errors.bufferMinutes?.message}
            >
              <Controller
                name="bufferMinutes"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(BUFFER_OPTIONS, field.value).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {minutesLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Minimum notice"
              hint="How soon a candidate can book"
              error={errors.minNoticeMinutes?.message}
            >
              <Controller
                name="minNoticeMinutes"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(
                        MIN_NOTICE_OPTIONS.map((o) => o.value),
                        field.value,
                      ).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {MIN_NOTICE_OPTIONS.find((o) => o.value === m)
                            ?.label ?? minutesLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Days ahead"
              hint="How far into the future candidates can book"
              error={errors.maxDaysAhead?.message}
            >
              <Input
                type="number"
                min={1}
                max={180}
                className="h-9"
                {...register('maxDaysAhead', { valueAsNumber: true })}
              />
            </Field>
          </div>
        </SectionCard>
      </form>

      <TimeOffList timezone={timezone || availability.timezone} />
    </>
  );
}

export default function AvailabilityPage() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'My availability', active: true },
  ]);
  const { data, isLoading, isError } = useMyAvailabilityQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="My availability" backHref="/dashboard/settings" />
        <EmptyState title="Could not load your availability" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AvailabilityForm availability={data} />
    </div>
  );
}
