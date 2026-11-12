'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { CalendarCheck } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { timeZoneOptions } from '@/lib/format';
import { useFormatters } from '@/hooks/use-formatters';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import {
  useCreateInterviewMutation,
  useUpdateInterviewMutation,
  useUserNamesQuery,
} from '@/hooks/queries';
import { DetailDrawer, SegmentedControl } from '@/components/patterns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { errorMessage } from '@/components/applications/application-meta';
import type {
  Interview,
  InterviewDetail,
  InterviewMeetingProvider,
  InterviewType,
} from '@/types/interview.type';
import { ApplicationPicker } from './application-picker';
import { BookingLinkForm } from './booking-link-form';
import { InterviewerPicker } from './interviewer-picker';
import {
  MEETING_PROVIDER_LABEL,
  isAutoMeetingProvider,
  useMeetingIntegrations,
} from './meeting-providers';
import {
  DURATIONS,
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABEL,
  candidateLabel,
  formatDuration,
  isoToZoned,
  zonedToIso,
} from './interview-data';

const MAX_INTERVIEWERS = 10;
const URL_PATTERN = /^https?:\/\/\S+$/i;

const schema = z.object({
  applicationId: z.string().min(1, 'Select an application'),
  title: z.string().trim().max(200, 'Keep the title under 200 characters'),
  type: z.enum(INTERVIEW_TYPES as [InterviewType, ...InterviewType[]]),
  date: z.string().min(1, 'Pick a date'),
  time: z.string().min(1, 'Pick a time'),
  durationMinutes: z.number().int().min(5).max(1440),
  timezone: z.string().min(1, 'Pick a timezone'),
  location: z
    .string()
    .trim()
    .max(300, 'Keep the location under 300 characters'),
  meetingUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => !v || URL_PATTERN.test(v),
      'Enter a full link starting with https://',
    ),
  interviewerIds: z
    .array(z.string())
    .min(1, 'Add at least one interviewer')
    .max(MAX_INTERVIEWERS, `Up to ${MAX_INTERVIEWERS} interviewers`),
  autoMeetingLink: z.boolean(),
  meetingProvider: z.string(),
  notes: z.string(),
  moveToInterviewStage: z.boolean(),
  notifyCandidate: z.boolean(),
});

type ScheduleValues = z.infer<typeof schema>;

export type ScheduleDrawerMode = 'schedule' | 'link';

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

function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}

function blankValues(applicationId: string, timezone: string): ScheduleValues {
  return {
    applicationId,
    title: '',
    type: 'video',
    date: '',
    time: '',
    durationMinutes: 45,
    timezone,
    location: '',
    meetingUrl: '',
    autoMeetingLink: false,
    meetingProvider: '',
    interviewerIds: [],
    notes: '',
    moveToInterviewStage: true,
    notifyCandidate: true,
  };
}

function toValues(interview: Interview): ScheduleValues {
  const { date, time } = isoToZoned(interview.scheduledAt, interview.timezone);
  const auto = isAutoMeetingProvider(interview.meetingProvider);
  return {
    applicationId: interview.applicationId,
    title: interview.title,
    type: interview.type,
    date,
    time,
    durationMinutes: interview.durationMinutes,
    timezone: interview.timezone,
    location: interview.location ?? '',
    meetingUrl: auto ? '' : (interview.meetingUrl ?? ''),
    autoMeetingLink: auto,
    meetingProvider: auto ? interview.meetingProvider : '',
    interviewerIds: interview.interviewerIds,
    notes: interview.notes ?? '',
    moveToInterviewStage: false,
    notifyCandidate: false,
  };
}

export function ScheduleInterviewDrawer({
  open,
  onOpenChange,
  interview,
  applicationId,
  onSaved,
  initialMode = 'schedule',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview?: Interview | null;
  applicationId?: string | null;
  onSaved?: (interview: InterviewDetail) => void;
  initialMode?: ScheduleDrawerMode;
}) {
  const fmt = useFormatters();
  const orgTimezone = fmt.settings.timezone;
  const editing = interview ?? null;
  const { data: users = [] } = useUserNamesQuery(open);
  const createInterview = useCreateInterviewMutation();
  const updateInterview = useUpdateInterviewMutation();
  const { providers, calendars } = useMeetingIntegrations();
  const [mode, setMode] = useState<ScheduleDrawerMode>(initialMode);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(schema),
    defaultValues: blankValues(applicationId ?? '', orgTimezone),
  });

  useResetOnKey(
    open
      ? `${editing?.id ?? 'new'}:${applicationId ?? ''}:${initialMode}`
      : null,
    () => {
      setMode(editing ? 'schedule' : initialMode);
      reset(
        editing
          ? toValues(editing)
          : {
              ...blankValues(applicationId ?? '', orgTimezone),
              meetingProvider: providers[0] ?? '',
            },
      );
    },
  );

  const autoMeetingLink = useWatch({ control, name: 'autoMeetingLink' });
  const canAutoLink = providers.length > 0;
  const showBookingTab = !editing;

  const zones = useMemo(() => {
    const list = timeZoneOptions();
    return list.includes(orgTimezone) ? list : [orgTimezone, ...list];
  }, [orgTimezone]);

  const submit = handleSubmit(async (values) => {
    const scheduledAt = zonedToIso(values.date, values.time, values.timezone);
    const useAuto =
      canAutoLink &&
      values.autoMeetingLink &&
      providers.includes(values.meetingProvider as never);
    const common = {
      type: values.type,
      scheduledAt,
      durationMinutes: values.durationMinutes,
      timezone: values.timezone,
      location: values.location || null,
      ...(useAuto
        ? {
            autoMeetingLink: true,
            meetingProvider: values.meetingProvider as InterviewMeetingProvider,
          }
        : { autoMeetingLink: false, meetingUrl: values.meetingUrl || null }),
      interviewerIds: values.interviewerIds,
      notes: values.notes.trim() || null,
      notifyCandidate: values.notifyCandidate,
    };
    try {
      const saved = editing
        ? await updateInterview.mutateAsync({
            id: editing.id,
            data: {
              ...common,
              title: values.title || INTERVIEW_TYPE_LABEL[values.type],
            },
          })
        : await createInterview.mutateAsync({
            ...common,
            applicationId: values.applicationId,
            ...(values.title && { title: values.title }),
            moveToInterviewStage: values.moveToInterviewStage,
          });
      toast.success(
        editing ? 'Interview updated' : 'Interview scheduled',
        `${candidateLabel(saved)}, ${fmt.dateLong(saved.scheduledAt)} ${fmt.time(saved.scheduledAt)}`,
      );
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        editing ? 'Could not update interview' : 'Could not schedule interview',
        errorMessage(err),
      );
    }
  });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        editing
          ? `Edit interview with ${candidateLabel(editing)}`
          : 'Schedule interview'
      }
      footer={
        mode === 'schedule' && (
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
                : editing
                  ? 'Save changes'
                  : 'Schedule interview'}
            </Button>
          </div>
        )
      }
    >
      {showBookingTab && (
        <SegmentedControl
          className="mb-5"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'schedule', label: 'Pick a time' },
            { value: 'link', label: 'Send booking link' },
          ]}
        />
      )}
      {mode === 'link' && showBookingTab ? (
        <BookingLinkForm
          active={open && mode === 'link'}
          applicationId={applicationId}
          onCancel={() => onOpenChange(false)}
          onDone={() => onOpenChange(false)}
        />
      ) : (
        <form className="space-y-6" onSubmit={submit}>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Candidate</h3>
            <Field label="Application" error={errors.applicationId?.message}>
              <Controller
                name="applicationId"
                control={control}
                render={({ field }) => (
                  <ApplicationPicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!!editing}
                  />
                )}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Interview type">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVIEW_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {INTERVIEW_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Title" error={errors.title?.message}>
                <Input
                  className="h-9"
                  placeholder="Defaults to the interview type"
                  {...register('title')}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">When</h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Date" error={errors.date?.message}>
                <Input type="date" className="h-9" {...register('date')} />
              </Field>
              <Field label="Time" error={errors.time?.message}>
                <Input type="time" className="h-9" {...register('time')} />
              </Field>
              <Field label="Duration">
                <Controller
                  name="durationMinutes"
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
                        {Array.from(new Set([...DURATIONS, field.value]))
                          .sort((a, b) => a - b)
                          .map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              {formatDuration(d)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field label="Timezone" error={errors.timezone?.message}>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {zones.map((z) => (
                        <SelectItem key={z} value={z}>
                          {z.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Where</h3>
            {canAutoLink && (
              <div className="space-y-2 rounded-md border border-border p-3">
                <Controller
                  name="autoMeetingLink"
                  control={control}
                  render={({ field }) => (
                    <CheckRow
                      id="auto-meeting-link"
                      label="Create meeting link automatically"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {autoMeetingLink && (
                  <Controller
                    name="meetingProvider"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={
                          providers.includes(field.value as never)
                            ? field.value
                            : providers[0]
                        }
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((p) => (
                            <SelectItem key={p} value={p}>
                              {MEETING_PROVIDER_LABEL[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location" error={errors.location?.message}>
                <Input
                  className="h-9"
                  placeholder="Office address or room"
                  {...register('location')}
                />
              </Field>
              {!(canAutoLink && autoMeetingLink) && (
                <Field label="Meeting link" error={errors.meetingUrl?.message}>
                  <Input
                    className="h-9"
                    placeholder="https://"
                    {...register('meetingUrl')}
                  />
                </Field>
              )}
            </div>
            {calendars.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                {calendars.length > 1
                  ? 'The interview is added to the connected calendar with invites for the panel'
                  : calendars[0] === 'Outlook'
                    ? 'The interview is added to the connected Outlook calendar with invites for the panel'
                    : 'The interview is added to the connected Google Calendar with invites for the panel'}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Interviewers</h3>
            <Controller
              name="interviewerIds"
              control={control}
              render={({ field }) => (
                <InterviewerPicker
                  users={users}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.interviewerIds?.message && (
              <p className="text-xs text-red-500">
                {errors.interviewerIds.message}
              </p>
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

          <section className="space-y-2.5">
            {!editing && (
              <Controller
                name="moveToInterviewStage"
                control={control}
                render={({ field }) => (
                  <CheckRow
                    id="move-to-interview-stage"
                    label="Move candidate to interview stage"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
            <Controller
              name="notifyCandidate"
              control={control}
              render={({ field }) => (
                <CheckRow
                  id="notify-candidate"
                  label={
                    editing
                      ? 'Email the candidate about the change'
                      : 'Email the candidate'
                  }
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </section>
        </form>
      )}
    </DetailDrawer>
  );
}
