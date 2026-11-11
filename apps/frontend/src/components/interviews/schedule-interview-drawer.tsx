'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { Check, Clock } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { cn } from '@/lib/utils';
import { DetailDrawer, SegmentedControl } from '@/components/patterns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CANDIDATES,
  DURATIONS,
  INTERVIEWERS,
  INTERVIEW_TYPES,
  formatDay,
  type Interview,
} from './interview-data';

const schema = z.object({
  candidate: z.string().min(1, 'Select a candidate'),
  role: z.string().min(1, 'Role is required'),
  stage: z.string().min(1, 'Select an interview type'),
  date: z.string().min(1, 'Pick a date'),
  time: z.string().min(1, 'Pick a time'),
  duration: z.string().min(1),
  format: z.enum(['Video', 'Onsite']),
  panel: z.array(z.string()).min(1, 'Add at least one interviewer'),
  notes: z.string().optional(),
});

export type ScheduleValues = z.infer<typeof schema>;

const DEFAULTS: ScheduleValues = {
  candidate: '',
  role: '',
  stage: 'Phone screen',
  date: '',
  time: '',
  duration: '45 min',
  format: 'Video',
  panel: [],
  notes: '',
};

const SUGGESTED_SLOTS = [
  { date: '2026-10-13', time: '11:00' },
  { date: '2026-10-14', time: '14:30' },
  { date: '2026-10-15', time: '09:30' },
];

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function toValues(interview: Interview): ScheduleValues {
  return {
    candidate: interview.candidate,
    role: interview.role,
    stage: interview.stage,
    date: interview.isoDate,
    time: interview.time,
    duration: interview.duration,
    format: interview.format,
    panel: interview.panel,
    notes: interview.notes ?? '',
  };
}

export function ScheduleInterviewDrawer({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Interview | null;
  onSubmit: (values: ScheduleValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(initial ? toValues(initial) : DEFAULTS);
  }, [open, initial, reset]);

  const candidateOptions = useMemo(() => {
    if (initial && !CANDIDATES.some((c) => c.name === initial.candidate)) {
      return [{ name: initial.candidate, role: initial.role }, ...CANDIDATES];
    }
    return CANDIDATES;
  }, [initial]);

  const date = watch('date');
  const time = watch('time');

  const submit = handleSubmit(async (values) => {
    await new Promise((r) => setTimeout(r, 300));
    onSubmit(values);
    onOpenChange(false);
  });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? `Reschedule ${initial.candidate}` : 'Schedule interview'}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving'
              : initial
                ? 'Update interview'
                : 'Schedule and send invites'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={submit}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Candidate</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Candidate" error={errors.candidate?.message}>
              <Controller
                name="candidate"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      const match = candidateOptions.find((c) => c.name === v);
                      if (match)
                        setValue('role', match.role, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidateOptions.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Role" error={errors.role?.message}>
              <Input
                className="h-9 bg-muted/40"
                readOnly
                placeholder="Filled from candidate"
                {...register('role')}
              />
            </Field>
          </div>
          <Field label="Interview type" error={errors.stage?.message}>
            <Controller
              name="stage"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Set(
                        [...INTERVIEW_TYPES, field.value].filter(Boolean),
                      ),
                    ).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">When</h3>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Suggested slots, whole panel free
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SLOTS.map((slot) => {
                const active = date === slot.date && time === slot.time;
                return (
                  <button
                    key={`${slot.date}-${slot.time}`}
                    type="button"
                    onClick={() => {
                      setValue('date', slot.date, { shouldValidate: true });
                      setValue('time', slot.time, { shouldValidate: true });
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-[#3F6650] bg-[#EDF1EE] text-[#3F6650] dark:bg-[#3F6650]/25 dark:text-[#8FBFA1]'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDay(slot.date)} · {slot.time}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date" error={errors.date?.message}>
              <Input type="date" className="h-9" {...register('date')} />
            </Field>
            <Field label="Time" error={errors.time?.message}>
              <Input type="time" className="h-9" {...register('time')} />
            </Field>
            <Field label="Duration">
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
          <Field label="Format">
            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <SegmentedControl
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'Video', label: 'Google Meet' },
                    { value: 'Onsite', label: 'Office' },
                  ]}
                />
              )}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Panel</h3>
          <Controller
            name="panel"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-1.5">
                {INTERVIEWERS.map((name) => {
                  const selected = field.value.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((n) => n !== name)
                            : [...field.value, name],
                        )
                      }
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-medium transition-colors',
                        selected
                          ? 'border-[#3F6650] bg-[#EDF1EE] text-[#3F6650] dark:bg-[#3F6650]/25 dark:text-[#8FBFA1]'
                          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <InitialsAvatar
                        name={name}
                        className="h-5 w-5 text-[9px]"
                      />
                      {name}
                      {selected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.panel?.message && (
            <p className="text-xs text-red-500">{errors.panel.message}</p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Notes for the panel</h3>
          <Textarea
            rows={3}
            placeholder="Focus areas, links to the take-home, anything the panel should know"
            {...register('notes')}
          />
        </section>
      </form>
    </DetailDrawer>
  );
}
