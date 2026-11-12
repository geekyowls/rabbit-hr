'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import {
  useCreateTimeOffMutation,
  useUpdateTimeOffMutation,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isoToZoned, zonedToIso } from '@/components/interviews/interview-data';
import type { TimeOff } from '@/types/availability.type';
import { TIME_OPTIONS, addDays } from './availability-utils';

const schema = z
  .object({
    allDay: z.boolean(),
    startDate: z.string().min(1, 'Pick a date'),
    endDate: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    reason: z.string().trim().max(200, 'Keep the reason under 200 characters'),
  })
  .superRefine((v, ctx) => {
    if (v.allDay) {
      if (v.endDate && v.endDate < v.startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'End date must be on or after the start date',
        });
      }
      return;
    }
    if (!v.startTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['startTime'],
        message: 'Pick a start time',
      });
    }
    if (!v.endTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'Pick an end time',
      });
    }
    if (v.startTime && v.endTime && v.endTime <= v.startTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

type TimeOffValues = z.infer<typeof schema>;

function todayIn(timezone: string) {
  return isoToZoned(new Date().toISOString(), timezone).date;
}

function blank(timezone: string): TimeOffValues {
  return {
    allDay: true,
    startDate: todayIn(timezone),
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    reason: '',
  };
}

function toValues(item: TimeOff, timezone: string): TimeOffValues {
  const start = isoToZoned(item.startsAt, timezone);
  const end = isoToZoned(item.endsAt, timezone);
  if (item.allDay) {
    const lastDay = isoToZoned(
      new Date(new Date(item.endsAt).getTime() - 1).toISOString(),
      timezone,
    ).date;
    return {
      allDay: true,
      startDate: start.date,
      endDate: lastDay === start.date ? '' : lastDay,
      startTime: '09:00',
      endTime: '17:00',
      reason: item.reason ?? '',
    };
  }
  return {
    allDay: false,
    startDate: start.date,
    endDate: '',
    startTime: start.time,
    endTime: end.date === start.date ? end.time : '24:00',
    reason: item.reason ?? '',
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 dark:text-red-400">{message}</p>;
}

function TimeField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9" aria-label={label}>
        <SelectValue placeholder="Time" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {TIME_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TimeOffDialog({
  open,
  onOpenChange,
  timezone,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timezone: string;
  editing: TimeOff | null;
}) {
  const createTimeOff = useCreateTimeOffMutation();
  const updateTimeOff = useUpdateTimeOffMutation();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeOffValues>({
    resolver: zodResolver(schema),
    defaultValues: blank(timezone),
  });

  useResetOnKey(open ? `${editing?.id ?? 'new'}:${timezone}` : null, () =>
    reset(editing ? toValues(editing, timezone) : blank(timezone)),
  );

  const allDay = useWatch({ control, name: 'allDay' });

  const submit = handleSubmit(async (v) => {
    const data = v.allDay
      ? {
          allDay: true,
          startsAt: zonedToIso(v.startDate, '00:00', timezone),
          endsAt: zonedToIso(
            addDays(v.endDate || v.startDate, 1),
            '00:00',
            timezone,
          ),
          reason: v.reason || null,
        }
      : {
          allDay: false,
          startsAt: zonedToIso(v.startDate, v.startTime, timezone),
          endsAt:
            v.endTime === '24:00'
              ? zonedToIso(addDays(v.startDate, 1), '00:00', timezone)
              : zonedToIso(v.startDate, v.endTime, timezone),
          reason: v.reason || null,
        };
    try {
      if (editing) {
        await updateTimeOff.mutateAsync({ id: editing.id, data });
        toast.success('Time off updated');
      } else {
        await createTimeOff.mutateAsync(data);
        toast.success('Time off added');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        editing ? 'Could not update time off' : 'Could not add time off',
        err instanceof Error ? err.message : undefined,
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit time off' : 'Add time off'}
          </DialogTitle>
          <DialogDescription>
            Candidates cannot book interviews with you during this time
          </DialogDescription>
        </DialogHeader>
        <form id="time-off-form" onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <Label htmlFor="time-off-all-day" className="cursor-pointer">
              All day
            </Label>
            <Controller
              control={control}
              name="allDay"
              render={({ field }) => (
                <Switch
                  id="time-off-all-day"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="time-off-start"
                  className="text-xs text-muted-foreground"
                >
                  From
                </Label>
                <Input
                  id="time-off-start"
                  type="date"
                  className="h-9"
                  {...register('startDate')}
                />
                <FieldError message={errors.startDate?.message} />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="time-off-end"
                  className="text-xs text-muted-foreground"
                >
                  To
                </Label>
                <Input
                  id="time-off-end"
                  type="date"
                  className="h-9"
                  {...register('endDate')}
                />
                <FieldError message={errors.endDate?.message} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="time-off-date"
                  className="text-xs text-muted-foreground"
                >
                  Date
                </Label>
                <Input
                  id="time-off-date"
                  type="date"
                  className="h-9"
                  {...register('startDate')}
                />
                <FieldError message={errors.startDate?.message} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Controller
                    control={control}
                    name="startTime"
                    render={({ field }) => (
                      <TimeField
                        label="Start time"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldError message={errors.startTime?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Controller
                    control={control}
                    name="endTime"
                    render={({ field }) => (
                      <TimeField
                        label="End time"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldError message={errors.endTime?.message} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="time-off-reason"
              className="text-xs text-muted-foreground"
            >
              Reason
            </Label>
            <Input
              id="time-off-reason"
              className="h-9"
              placeholder="Annual leave, training, appointment"
              {...register('reason')}
            />
            <FieldError message={errors.reason?.message} />
          </div>
          <p className="text-xs text-muted-foreground">
            Times are in {timezone.replace(/_/g, ' ')}
          </p>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="time-off-form"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving'
              : editing
                ? 'Save changes'
                : 'Add time off'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
