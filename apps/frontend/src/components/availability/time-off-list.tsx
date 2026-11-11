'use client';

import { useState } from 'react';
import { CalendarOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { formatDateLong, formatTime } from '@/lib/format';
import { useFormatters } from '@/hooks/use-formatters';
import { useDeleteTimeOffMutation, useMyTimeOffQuery } from '@/hooks/queries';
import { EmptyState, SectionCard, ToolbarButton } from '@/components/patterns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TimeOff } from '@/types/availability.type';
import { TimeOffDialog } from './time-off-dialog';

function useRangeLabel(timezone: string) {
  const { settings } = useFormatters();
  const opts = { locale: settings.locale, timezone };
  const day = (iso: string) =>
    formatDateLong(iso, opts, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  return (item: TimeOff) => {
    if (item.allDay) {
      const last = new Date(new Date(item.endsAt).getTime() - 1).toISOString();
      const first = day(item.startsAt);
      const end = day(last);
      return first === end ? first : `${first} to ${end}`;
    }
    return `${day(item.startsAt)}, ${formatTime(item.startsAt, opts)} to ${formatTime(item.endsAt, opts)}`;
  };
}

export function TimeOffList({ timezone }: { timezone: string }) {
  const [from] = useState(() => new Date().toISOString());
  const { data, isLoading, isError } = useMyTimeOffQuery({ from });
  const deleteTimeOff = useDeleteTimeOffMutation();
  const rangeLabel = useRangeLabel(timezone);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimeOff | null>(null);
  const [deleting, setDeleting] = useState<TimeOff | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTimeOff.mutateAsync(deleting.id);
      toast.success('Time off removed');
    } catch (err) {
      toast.error(
        'Could not remove time off',
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setDeleting(null);
    }
  };

  const items = data ?? [];

  return (
    <SectionCard
      icon={CalendarOff}
      title="Time off"
      subtitle="Holidays and blocked time hidden from booking links"
      bodyClassName="p-0"
      actions={
        <ToolbarButton icon={Plus} onClick={openAdd}>
          Add time off
        </ToolbarButton>
      }
    >
      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <EmptyState compact title="Could not load time off" />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={<CalendarOff className="h-6 w-6" />}
          title="No upcoming time off"
          description="Add holidays or appointments so candidates cannot book over them"
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {rangeLabel(item)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.reason || (item.allDay ? 'All day' : 'Blocked time')}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label="Edit time off"
                onClick={() => {
                  setEditing(item);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label="Remove time off"
                onClick={() => setDeleting(item)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <TimeOffDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        timezone={timezone}
        editing={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove time off</AlertDialogTitle>
            <AlertDialogDescription>
              Candidates will be able to book interviews in this time again
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
