import type { PillTone } from '@/components/patterns';
import type { UserSummary } from '@/types/common.type';
import type {
  Interview,
  InterviewStatus,
  InterviewType,
  ScorecardRecommendation,
} from '@/types/interview.type';

export const INTERVIEW_TYPE_LABEL: Record<InterviewType, string> = {
  phone: 'Phone screen',
  video: 'Video call',
  onsite: 'Onsite',
  technical: 'Technical',
  panel: 'Panel',
  assessment: 'Assessment',
  other: 'Other',
};

export const INTERVIEW_TYPES = Object.keys(
  INTERVIEW_TYPE_LABEL,
) as InterviewType[];

export const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

export const INTERVIEW_STATUS_TONE: Record<InterviewStatus, PillTone> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'neutral',
  no_show: 'danger',
};

export const RECOMMENDATION_LABEL: Record<ScorecardRecommendation, string> = {
  strong_yes: 'Strong yes',
  yes: 'Yes',
  no: 'No',
  strong_no: 'Strong no',
};

export const RECOMMENDATION_TONE: Record<ScorecardRecommendation, PillTone> = {
  strong_yes: 'success',
  yes: 'success',
  no: 'danger',
  strong_no: 'danger',
};

export const RECOMMENDATIONS = Object.keys(
  RECOMMENDATION_LABEL,
) as ScorecardRecommendation[];

export const DURATIONS = [15, 30, 45, 60, 90, 120, 240];

export const DEFAULT_CRITERIA = [
  'Skills',
  'Experience',
  'Communication',
  'Culture add',
];

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function personLabel(user: UserSummary | null | undefined) {
  if (!user) return '';
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.email;
}

export function candidateLabel(interview: Pick<Interview, 'candidate'>) {
  return `${interview.candidate.firstName} ${interview.candidate.lastName}`.trim();
}

function partsIn(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
  };
}

function offsetMs(date: Date, timeZone: string) {
  const p = partsIn(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(date.getTime() / 60_000) * 60_000;
}

function safeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return 'UTC';
  }
}

export function zonedToIso(date: string, time: string, timeZone: string) {
  const zone = safeZone(timeZone);
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = guess - offsetMs(new Date(guess), zone);
  const second = guess - offsetMs(new Date(first), zone);
  return new Date(second).toISOString();
}

export function isoToZoned(iso: string, timeZone: string) {
  const p = partsIn(new Date(iso), safeZone(timeZone));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}
