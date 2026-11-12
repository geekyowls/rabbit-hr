import { useMemo } from 'react';
import { useSession } from '@/contexts/session-context';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useInterviewsQuery,
  useOffersQuery,
  useReportSummaryQuery,
} from '@/hooks/queries';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';

const DAY_MS = 86_400_000;
const UPCOMING_START_DAYS = 30;
const SCHEDULED_WINDOW_DAYS = 7;

function localDayBounds(offsetDays = 0) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useHomeWidgets(rangeDays: number) {
  const { user } = useSession();
  const userId = user?.userId;
  const { hasPermission } = usePermissions();
  const canInterviews = hasPermission(PERMISSIONS_ENUM.INTERVIEW_LIST_READ);
  const canOffers = hasPermission(PERMISSIONS_ENUM.OFFER_LIST_READ);
  const canReports = hasPermission(PERMISSIONS_ENUM.REPORT_READ);

  const bounds = useMemo(() => {
    const today = localDayBounds();
    const weekEnd = localDayBounds(SCHEDULED_WINDOW_DAYS - 1).end;
    const startsEnd = localDayBounds(UPCOMING_START_DAYS).start;
    return {
      todayStart: today.start.toISOString(),
      todayEnd: today.end.toISOString(),
      weekEnd: weekEnd.toISOString(),
      todayKey: dateKey(today.start),
      startsEndKey: dateKey(startsEnd),
    };
  }, []);

  const reportRange = useMemo(() => {
    const { start } = localDayBounds(-(rangeDays - 1));
    return { from: start.toISOString(), to: bounds.todayEnd };
  }, [rangeDays, bounds.todayEnd]);

  const scorecards = useInterviewsQuery(
    { page: 1, limit: 1, interviewerId: userId, needsFeedback: true },
    canInterviews && !!userId,
  );
  const upcoming = useInterviewsQuery(
    {
      page: 1,
      limit: 1,
      status: 'scheduled',
      from: bounds.todayStart,
      to: bounds.weekEnd,
    },
    canInterviews,
  );
  const today = useInterviewsQuery(
    { page: 1, limit: 50, from: bounds.todayStart, to: bounds.todayEnd },
    canInterviews,
  );
  const pendingOffers = useOffersQuery(
    { page: 1, limit: 100, status: 'pending_approval' },
    canOffers && !!userId,
  );
  const acceptedOffers = useOffersQuery(
    { page: 1, limit: 100, status: 'accepted' },
    canOffers,
  );
  const report = useReportSummaryQuery(reportRange, canReports);

  const offersToApprove = useMemo(
    () =>
      (pendingOffers.data?.data ?? []).filter((o) =>
        o.approvers.some((a) => a.id === userId && a.decision === null),
      ),
    [pendingOffers.data, userId],
  );

  const upcomingStarts = useMemo(
    () =>
      (acceptedOffers.data?.data ?? [])
        .filter(
          (o) =>
            !!o.startDate &&
            o.startDate.slice(0, 10) >= bounds.todayKey &&
            o.startDate.slice(0, 10) <= bounds.startsEndKey,
        )
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '')),
    [acceptedOffers.data, bounds.todayKey, bounds.startsEndKey],
  );

  const daysUntil = (date: string) =>
    Math.round(
      (new Date(`${date.slice(0, 10)}T00:00:00`).getTime() -
        new Date(`${bounds.todayKey}T00:00:00`).getTime()) /
        DAY_MS,
    );

  return {
    canInterviews,
    canOffers,
    canReports,
    scorecardsDue: scorecards.data?.total,
    scorecardsLoading: scorecards.isLoading && canInterviews,
    interviewsThisWeek: upcoming.data?.total,
    interviewsThisWeekLoading: upcoming.isLoading && canInterviews,
    todaysInterviews: today.data?.data ?? [],
    todaysInterviewsLoading: today.isLoading && canInterviews,
    offersToApprove,
    offersToApproveLoading: pendingOffers.isLoading && canOffers,
    upcomingStarts,
    upcomingStartsLoading: acceptedOffers.isLoading && canOffers,
    report: report.data,
    reportLoading: report.isLoading && canReports,
    daysUntil,
    upcomingStartDays: UPCOMING_START_DAYS,
    scheduledWindowDays: SCHEDULED_WINDOW_DAYS,
  };
}
