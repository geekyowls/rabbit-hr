'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { CalendarClock, ExternalLink, Link2, X } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
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
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusPill, ToolbarButton } from '@/components/patterns';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useFormatters } from '@/hooks/use-formatters';
import { useSession } from '@/contexts/session-context';
import {
  useBookingLinksQuery,
  useCancelBookingLinkMutation,
  useCreateBookingLinkMutation,
  useUserNamesQuery,
} from '@/hooks/queries';
import type {
  BookingLink,
  BookingLinkMode,
  CreateBookingLinkResponse,
} from '@/types/booking-link.type';
import type { InterviewType } from '@/types/interview.type';
import type { CandidateApplicationSummary } from '@/types/candidate.type';
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABEL,
} from '@/components/interviews/interview-data';
import {
  errorMessage,
  userLabel,
} from '@/components/applications/application-meta';
import { CopyButton } from '@/components/comms/copy-button';

const DURATIONS = [15, 30, 45, 60, 90] as const;
const EXPIRY_DAYS = [3, 7, 14, 30] as const;

const MODE_LABEL: Record<BookingLinkMode, string> = {
  any_interviewer: 'Any one interviewer',
  all_interviewers: 'All interviewers together',
};

const bookingSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  type: z.enum(INTERVIEW_TYPES as [InterviewType, ...InterviewType[]]),
  durationMinutes: z.string(),
  interviewerIds: z
    .array(z.string())
    .min(1, 'Choose at least one interviewer')
    .max(10, 'Choose up to 10 interviewers'),
  mode: z.enum(['any_interviewer', 'all_interviewers']),
  expiresInDays: z.string(),
  sendEmail: z.boolean(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

function OpenLinkRow({ link }: { link: BookingLink }) {
  const fmt = useFormatters();
  const { hasPermission } = usePermissions();
  const cancel = useCancelBookingLinkMutation();

  const onCancel = async () => {
    try {
      await cancel.mutateAsync(link.id);
      toast.success('Booking link cancelled');
    } catch (err) {
      toast.error('Could not cancel link', errorMessage(err));
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{link.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            `${link.durationMinutes} min`,
            link.interviewers.map(userLabel).join(', '),
            `Expires ${fmt.date(link.expiresAt)}`,
          ].join(' · ')}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <CopyButton value={link.url} label="Copy" />
        {hasPermission(PERMISSIONS_ENUM.INTERVIEW_UPDATE) && (
          <ToolbarButton
            variant="ghost"
            icon={X}
            disabled={cancel.isPending}
            onClick={onCancel}
          >
            Cancel link
          </ToolbarButton>
        )}
      </div>
    </li>
  );
}

function CreatedLink({ link }: { link: CreateBookingLinkResponse }) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4 text-[#3F6650] dark:text-[#8FBFA1]" />
        Booking link ready
        {link.emailSent ? (
          <StatusPill tone="success">Emailed to candidate</StatusPill>
        ) : null}
      </div>
      <Input readOnly value={link.url} className="h-9 font-mono text-xs" />
      {link.emailError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Email not sent: {link.emailError}
        </p>
      )}
      <div className="flex gap-2">
        <CopyButton value={link.url} />
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          <ToolbarButton icon={ExternalLink}>Open</ToolbarButton>
        </a>
      </div>
    </div>
  );
}

export function BookingLinkDialog({
  open,
  onOpenChange,
  application,
  candidateName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: CandidateApplicationSummary | null;
  candidateName: string;
}) {
  const { user } = useSession();
  const { hasPermission } = usePermissions();
  const canList = hasPermission(PERMISSIONS_ENUM.INTERVIEW_LIST_READ);
  const { data: users = [] } = useUserNamesQuery(open);
  const { data: openLinks = [] } = useBookingLinksQuery(
    { applicationId: application?.id, status: 'open' },
    open && !!application && canList,
  );
  const create = useCreateBookingLinkMutation();
  const [created, setCreated] = useState<CreateBookingLinkResponse | null>(
    null,
  );

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: userLabel(u) })),
    [users],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: '',
      type: 'video',
      durationMinutes: '30',
      interviewerIds: [],
      mode: 'any_interviewer',
      expiresInDays: '7',
      sendEmail: true,
    },
  });

  useEffect(() => {
    if (!open || !application) return;
    setCreated(null);
    reset({
      title: `Interview for ${application.jobTitle}`.slice(0, 200),
      type: 'video',
      durationMinutes: '30',
      interviewerIds: user?.userId ? [user.userId] : [],
      mode: 'any_interviewer',
      expiresInDays: '7',
      sendEmail: true,
    });
  }, [open, application, user?.userId, reset]);

  const submit = handleSubmit(async (data) => {
    if (!application) return;
    try {
      const link = await create.mutateAsync({
        applicationId: application.id,
        title: data.title,
        type: data.type,
        durationMinutes: Number(data.durationMinutes),
        interviewerIds: data.interviewerIds,
        mode: data.mode,
        expiresInDays: Number(data.expiresInDays),
        sendEmail: data.sendEmail,
      });
      setCreated(link);
      toast.success(
        link.emailSent ? 'Booking link emailed' : 'Booking link created',
      );
    } catch (err) {
      toast.error('Could not create booking link', errorMessage(err));
    }
  });

  const otherLinks = openLinks.filter((l) => l.id !== created?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#3F6650] dark:text-[#8FBFA1]" />
            Send booking link
          </DialogTitle>
          <DialogDescription>
            {application
              ? `${candidateName} picks a time that suits the interviewers for ${application.jobTitle}`
              : 'Choose an application first'}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-3">
            <CreatedLink link={created} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreated(null)}
              >
                Create another
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="booking-title" className="text-xs">
                Title
              </Label>
              <Input
                id="booking-title"
                className="h-9"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration</Label>
                <Controller
                  name="durationMinutes"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {`${d} min`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expires after</Label>
                <Controller
                  name="expiresInDays"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Interviewers</Label>
              <Controller
                name="interviewerIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={userOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Choose interviewers"
                  />
                )}
              />
              {errors.interviewerIds && (
                <p className="text-xs text-destructive">
                  {errors.interviewerIds.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Who needs to be free</Label>
              <Controller
                name="mode"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MODE_LABEL) as BookingLinkMode[]).map(
                        (m) => (
                          <SelectItem key={m} value={m}>
                            {MODE_LABEL[m]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Controller
              name="sendEmail"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Email the link to the candidate
                </label>
              )}
            />
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
                size="sm"
                disabled={isSubmitting || !application}
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                {isSubmitting ? 'Creating...' : 'Create link'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {otherLinks.length > 0 && (
          <div className="space-y-1.5 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              Open links for this application
            </p>
            <ul className="divide-y divide-border rounded-md border border-border">
              {otherLinks.map((l) => (
                <OpenLinkRow key={l.id} link={l} />
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
