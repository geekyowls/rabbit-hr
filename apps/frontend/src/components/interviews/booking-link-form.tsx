'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { CheckCircle2 } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import {
  useCreateBookingLinkMutation,
  useUserNamesQuery,
} from '@/hooks/queries';
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
import { SegmentedControl } from '@/components/patterns';
import { CopyField } from '@/components/integrations/copy-field';
import { errorMessage } from '@/components/applications/application-meta';
import type {
  BookingLinkMode,
  CreateBookingLinkResponse,
} from '@/types/booking-link.type';
import type { InterviewType } from '@/types/interview.type';
import { ApplicationPicker } from './application-picker';
import { InterviewerPicker } from './interviewer-picker';
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABEL,
  formatDuration,
} from './interview-data';
import {
  MEETING_PROVIDER_LABEL,
  useMeetingIntegrations,
} from './meeting-providers';

const BOOKING_DURATIONS = [15, 20, 30, 45, 60, 90, 120];
const EXPIRY_DAYS = [3, 7, 14, 30];
const NO_MEETING = 'none';

const schema = z.object({
  applicationId: z.string().min(1, 'Select an application'),
  title: z.string().trim().max(200, 'Keep the title under 200 characters'),
  type: z.enum(INTERVIEW_TYPES as [InterviewType, ...InterviewType[]]),
  durationMinutes: z.number().int().min(10).max(240),
  interviewerIds: z
    .array(z.string())
    .min(1, 'Add at least one interviewer')
    .max(10, 'Up to 10 interviewers'),
  mode: z.enum(['any_interviewer', 'all_interviewers']),
  meetingProvider: z.string(),
  location: z
    .string()
    .trim()
    .max(300, 'Keep the location under 300 characters'),
  expiresInDays: z.number().int().min(1).max(60),
  sendEmail: z.boolean(),
  message: z.string().max(2000, 'Keep the message under 2000 characters'),
});

type BookingValues = z.infer<typeof schema>;

function blankValues(applicationId: string): BookingValues {
  return {
    applicationId,
    title: '',
    type: 'video',
    durationMinutes: 30,
    interviewerIds: [],
    mode: 'any_interviewer',
    meetingProvider: NO_MEETING,
    location: '',
    expiresInDays: 7,
    sendEmail: true,
    message: '',
  };
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
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
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function BookingLinkResult({
  link,
  onAnother,
  onDone,
}: {
  link: CreateBookingLinkResponse;
  onAnother: () => void;
  onDone: () => void;
}) {
  const fmt = useFormatters();
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
        <div className="text-sm">
          <p className="font-medium text-green-800 dark:text-green-300">
            Booking link created
          </p>
          <p className="text-green-700 dark:text-green-400">
            {link.emailSent
              ? 'The candidate has been emailed the link'
              : 'Share the link with the candidate'}
          </p>
        </div>
      </div>
      {link.emailError && (
        <p className="text-xs text-destructive">
          Email not sent: {link.emailError}
        </p>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Booking link
        </Label>
        <CopyField value={link.url} label="Copy booking link" />
        <p className="text-xs text-muted-foreground">
          Expires {fmt.dateLong(link.expiresAt)}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onAnother}>
          Create another
        </Button>
        <Button size="sm" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function BookingLinkForm({
  active,
  applicationId,
  onCancel,
  onDone,
}: {
  active: boolean;
  applicationId?: string | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { data: users = [] } = useUserNamesQuery(active);
  const { providers } = useMeetingIntegrations();
  const createLink = useCreateBookingLinkMutation();
  const [created, setCreated] = useState<CreateBookingLinkResponse | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: blankValues(applicationId ?? ''),
  });

  useResetOnKey(active ? `booking:${applicationId ?? ''}` : null, () => {
    setCreated(null);
    reset(blankValues(applicationId ?? ''));
  });

  const submit = handleSubmit(async (values) => {
    try {
      const link = await createLink.mutateAsync({
        applicationId: values.applicationId,
        ...(values.title && { title: values.title }),
        type: values.type,
        durationMinutes: values.durationMinutes,
        interviewerIds: values.interviewerIds,
        mode: values.mode as BookingLinkMode,
        ...(values.meetingProvider !== NO_MEETING && {
          meetingProvider:
            values.meetingProvider as CreateBookingLinkResponse['meetingProvider'],
        }),
        location: values.location || null,
        expiresInDays: values.expiresInDays,
        sendEmail: values.sendEmail,
        ...(values.message.trim() && { message: values.message.trim() }),
      });
      setCreated(link);
      toast.success('Booking link created');
    } catch (err) {
      toast.error('Could not create booking link', errorMessage(err));
    }
  });

  if (created) {
    return (
      <BookingLinkResult
        link={created}
        onAnother={() => {
          setCreated(null);
          reset(blankValues(applicationId ?? ''));
        }}
        onDone={onDone}
      />
    );
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <p className="text-sm text-muted-foreground">
        The candidate picks a time that suits them from your team&apos;s
        availability
      </p>
      <section className="space-y-3">
        <Field label="Application" error={errors.applicationId?.message}>
          <Controller
            name="applicationId"
            control={control}
            render={({ field }) => (
              <ApplicationPicker
                value={field.value}
                onChange={field.onChange}
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
                    {BOOKING_DURATIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {formatDuration(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Link expires after">
            <Controller
              name="expiresInDays"
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
                    {EXPIRY_DAYS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {`${d} days`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
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
        <Controller
          name="mode"
          control={control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <SegmentedControl
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'any_interviewer', label: 'Any one interviewer' },
                  { value: 'all_interviewers', label: 'All interviewers' },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                {field.value === 'any_interviewer'
                  ? 'Times when at least one interviewer is free'
                  : 'Only times when every interviewer is free'}
              </p>
            </div>
          )}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Where</h3>
        <div className="grid grid-cols-2 gap-3">
          {providers.length > 0 && (
            <Field label="Meeting link">
              <Controller
                name="meetingProvider"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_MEETING}>
                        No meeting link
                      </SelectItem>
                      {providers.map((p) => (
                        <SelectItem key={p} value={p}>
                          {MEETING_PROVIDER_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
          <Field label="Location" error={errors.location?.message}>
            <Input
              className="h-9"
              placeholder="Office address, room or phone"
              {...register('location')}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <Controller
          name="sendEmail"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="booking-send-email"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
              <Label
                htmlFor="booking-send-email"
                className="cursor-pointer text-sm font-normal"
              >
                Email the candidate the link
              </Label>
            </div>
          )}
        />
        <Field label="Message" error={errors.message?.message}>
          <Textarea
            rows={3}
            placeholder="Optional note included in the email"
            {...register('message')}
          />
        </Field>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Creating' : 'Create booking link'}
        </Button>
      </div>
    </form>
  );
}
