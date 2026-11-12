'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Globe2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { timeZoneOptions } from '@/lib/format';
import { ApiError } from '@/utils/error-class';
import {
  publicBookingKeys,
  useBookPublicSlotMutation,
  usePublicBookingSlotsQuery,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/common/searchable-select';
import type { PublicBookingLink, PublicSlot } from '@/types/booking-link.type';
import {
  MAX_WINDOWS,
  WINDOW_DAYS,
  addDays,
  dateRange,
  dayParts,
  formatSlotDate,
  formatSlotTime,
  todayIn,
} from './booking-utils';
import { isoToZoned } from '@/components/interviews/interview-data';

export function SlotPicker({
  token,
  link,
  timezone,
  onTimezoneChange,
}: {
  token: string;
  link: PublicBookingLink;
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
}) {
  const [windowIndex, setWindowIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const today = todayIn(timezone);
  const from = addDays(today, windowIndex * WINDOW_DAYS);
  const to = addDays(from, WINDOW_DAYS - 1);
  const expiresOn = isoToZoned(link.expiresAt, timezone).date;
  const canGoNext =
    windowIndex < MAX_WINDOWS - 1 && addDays(to, 1) <= expiresOn;

  const slotsQuery = usePublicBookingSlotsQuery(token, { from, to, timezone });
  const book = useBookPublicSlotMutation(token);
  const queryClient = useQueryClient();

  const zones = useMemo(() => {
    const list = timeZoneOptions();
    const all = list.includes(timezone) ? list : [timezone, ...list];
    return all.map((tz) => ({ value: tz, label: tz.replace(/_/g, ' ') }));
  }, [timezone]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, PublicSlot[]>();
    for (const day of slotsQuery.data?.days ?? []) {
      if (day.slots.length > 0) map.set(day.date, day.slots);
    }
    return map;
  }, [slotsQuery.data]);

  const dates = dateRange(from, WINDOW_DAYS);

  const activeDate =
    selectedDate && slotsByDate.has(selectedDate)
      ? selectedDate
      : (dates.find((d) => slotsByDate.has(d)) ?? null);
  const daySlots = activeDate ? (slotsByDate.get(activeDate) ?? []) : [];
  const activeSlot =
    selectedSlot && daySlots.some((s) => s.startsAt === selectedSlot.startsAt)
      ? selectedSlot
      : null;

  const confirm = async () => {
    if (!activeSlot) return;
    setNotice(null);
    try {
      await book.mutateAsync({ startsAt: activeSlot.startsAt, timezone });
      toast.success('Interview booked');
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setNotice('That time was just taken, pick another');
        setSelectedSlot(null);
        slotsQuery.refetch();
        return;
      }
      if (err instanceof ApiError && err.statusCode === 429) {
        setNotice('Too many attempts, wait a moment and try again');
        return;
      }
      if (err instanceof ApiError && err.statusCode === 400) {
        queryClient.invalidateQueries({
          queryKey: publicBookingKeys.details(token),
        });
      }
      setNotice(
        err instanceof ApiError && err.statusCode === 400
          ? err.message
          : 'Something went wrong, please try again',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">Pick a time</h2>
        <div className="flex items-center gap-2 sm:w-72">
          <Globe2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SearchableSelect
            value={timezone}
            onChange={onTimezoneChange}
            options={zones}
            placeholder="Select time zone"
            searchPlaceholder="Search time zone"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Earlier dates"
          disabled={windowIndex === 0}
          onClick={() => {
            setSelectedDate(null);
            setWindowIndex((i) => Math.max(0, i - 1));
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="grid flex-1 grid-cols-4 gap-1.5 sm:grid-cols-7">
          {dates.map((date) => {
            const parts = dayParts(date, link.locale);
            const available = slotsByDate.has(date);
            const active = date === activeDate;
            return (
              <button
                key={date}
                type="button"
                disabled={!available}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }}
                aria-pressed={active}
                aria-label={parts.long}
                className={cn(
                  'flex flex-col items-center rounded-md border px-1 py-1.5 text-xs transition-colors',
                  active
                    ? 'border-[#3F6650] bg-[#3F6650] text-white dark:border-[#8FBFA1] dark:bg-[#8FBFA1] dark:text-[#16201A]'
                    : available
                      ? 'border-border bg-background hover:border-[#3F6650] hover:text-[#3F6650] dark:hover:border-[#8FBFA1] dark:hover:text-[#8FBFA1]'
                      : 'cursor-not-allowed border-dashed border-border text-muted-foreground/50',
                )}
              >
                <span>{parts.weekday}</span>
                <span className="text-base font-semibold leading-tight">
                  {parts.day}
                </span>
                <span>{parts.month}</span>
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Later dates"
          disabled={!canGoNext}
          onClick={() => {
            setSelectedDate(null);
            setWindowIndex((i) => i + 1);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {notice && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
          {notice}
        </p>
      )}

      {slotsQuery.isLoading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : slotsQuery.isError ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-3 text-sm">
          <span className="text-muted-foreground">
            Could not load available times
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => slotsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : slotsByDate.size === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {canGoNext
            ? 'No times available in these dates, try later dates'
            : 'No times available, contact the recruiter for another time'}
        </p>
      ) : activeDate ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {dayParts(activeDate, link.locale).long}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {daySlots.map((slot) => {
              const active = activeSlot?.startsAt === slot.startsAt;
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={active}
                  className={cn(
                    'h-9 rounded-md border text-sm font-medium tabular-nums transition-colors',
                    active
                      ? 'border-[#3F6650] bg-[#3F6650] text-white dark:border-[#8FBFA1] dark:bg-[#8FBFA1] dark:text-[#16201A]'
                      : 'border-border bg-background hover:border-[#3F6650] hover:text-[#3F6650] dark:hover:border-[#8FBFA1] dark:hover:text-[#8FBFA1]',
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeSlot && (
        <div className="space-y-3 rounded-lg border border-[#3F6650]/40 bg-[#EDF1EE] p-4 dark:border-[#8FBFA1]/40 dark:bg-[#3F6650]/20">
          <div>
            <p className="text-sm font-semibold">Confirm your interview</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {link.candidateFirstName
                ? `Hi ${link.candidateFirstName}, please check the time below before confirming`
                : 'Please check the time below before confirming'}
            </p>
          </div>
          <p className="text-sm font-medium">
            {formatSlotDate(activeSlot.startsAt, link.locale, timezone)},{' '}
            {formatSlotTime(activeSlot.startsAt, link.locale, timezone)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={confirm}
              disabled={book.isPending}
              className="bg-[#3F6650] text-white hover:bg-[#355847] dark:bg-[#8FBFA1] dark:text-[#16201A] dark:hover:bg-[#8FBFA1]/90"
            >
              {book.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {book.isPending ? 'Booking' : 'Confirm booking'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedSlot(null)}
              disabled={book.isPending}
            >
              Choose another time
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
