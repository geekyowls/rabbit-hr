'use client';

import { useState } from 'react';
import { CalendarPlus, CheckCircle2, MapPin, Video } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ApiError } from '@/utils/error-class';
import { useCancelPublicBookingMutation } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  PublicBookedSlot,
  PublicBookingLink,
} from '@/types/booking-link.type';
import { downloadIcs, formatSlotDate, formatSlotTime } from './booking-utils';

export function BookingConfirmed({
  token,
  link,
  booking,
  timezone,
  cancelOpenInitially,
}: {
  token: string;
  link: PublicBookingLink;
  booking: PublicBookedSlot;
  timezone: string;
  cancelOpenInitially?: boolean;
}) {
  const cancel = useCancelPublicBookingMutation(token);
  const [cancelOpen, setCancelOpen] = useState(!!cancelOpenInitially);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isPast = new Date(booking.scheduledAt).getTime() <= Date.now();
  const canCancel = booking.status === 'scheduled' && !isPast;

  const addToCalendar = () => {
    const details = [
      `${link.title} for ${link.jobTitle} at ${link.companyName}`,
      booking.meetingUrl ? `Join: ${booking.meetingUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    downloadIcs(
      {
        uid: booking.interviewId,
        startsAt: booking.scheduledAt,
        durationMinutes: booking.durationMinutes,
        summary: `${link.title} with ${link.companyName}`,
        description: details,
        location: booking.meetingUrl ?? booking.location ?? link.location,
        url: booking.meetingUrl,
      },
      'interview.ics',
    );
  };

  const confirmCancel = async () => {
    setError(null);
    try {
      await cancel.mutateAsync(reason.trim() ? { reason: reason.trim() } : {});
      setCancelOpen(false);
      toast.success('Booking cancelled');
    } catch (err) {
      setError(
        err instanceof ApiError && err.statusCode === 400
          ? err.message
          : 'Could not cancel the booking, please try again',
      );
    }
  };

  const location = booking.location ?? link.location;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#3F6650] dark:text-[#8FBFA1]" />
        <div>
          <h2 className="text-base font-semibold">Your interview is booked</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            We have sent the details to your email
          </p>
        </div>
      </div>

      <dl className="grid gap-3 rounded-lg border border-border p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Date</dt>
          <dd className="font-medium">
            {formatSlotDate(booking.scheduledAt, link.locale, timezone)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Time</dt>
          <dd className="font-medium">
            {formatSlotTime(booking.scheduledAt, link.locale, timezone)}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {timezone.replace(/_/g, ' ')}
            </span>
          </dd>
        </div>
        {booking.meetingUrl && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Meeting link</dt>
            <dd className="truncate font-medium">
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#3F6650] hover:underline dark:text-[#8FBFA1]"
              >
                <Video className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {booking.meetingUrl.replace(/^https?:\/\//, '')}
                </span>
              </a>
            </dd>
          </div>
        )}
        {location && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Location</dt>
            <dd className="inline-flex items-center gap-1.5 font-medium">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {location}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addToCalendar}
        >
          <CalendarPlus className="mr-1.5 h-4 w-4" />
          Add to calendar
        </Button>
        {canCancel && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setCancelOpen(true)}
          >
            Cancel booking
          </Button>
        )}
      </div>

      <Dialog
        open={cancelOpen && canCancel}
        onOpenChange={(o) => {
          setCancelOpen(o);
          if (!o) setError(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your interview</DialogTitle>
            <DialogDescription>
              The recruiter will be told you can no longer attend
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason" className="text-xs">
              Reason
            </Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional, helps the recruiter find another time"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(false)}
            >
              Keep booking
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={cancel.isPending}
              onClick={confirmCancel}
            >
              {cancel.isPending ? 'Cancelling' : 'Cancel booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
