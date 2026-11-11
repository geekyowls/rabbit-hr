export interface WeeklyHoursInterval {
  day: number;
  start: string;
  end: string;
}

export interface InterviewerAvailability {
  userId: string;
  timezone: string;
  weeklyHours: WeeklyHoursInterval[];
  bufferMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  isDefault: boolean;
}

export interface UpdateAvailabilityRequest {
  timezone: string;
  weeklyHours: WeeklyHoursInterval[];
  bufferMinutes?: number;
  minNoticeMinutes?: number;
  maxDaysAhead?: number;
}

export interface TimeOff {
  id: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  reason: string | null;
  createdAt: string;
}

export interface TimeOffRequest {
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  reason?: string | null;
}

export interface ListTimeOffParams {
  from?: string;
  to?: string;
}
