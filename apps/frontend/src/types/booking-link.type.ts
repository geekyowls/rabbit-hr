import type { UserSummary } from './common.type';
import type {
  InterviewMeetingProvider,
  InterviewStatus,
  InterviewType,
} from './interview.type';

export type BookingLinkStatus = 'open' | 'booked' | 'cancelled' | 'expired';

export type BookingLinkMode = 'any_interviewer' | 'all_interviewers';

export interface BookingLink {
  id: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  token: string;
  url: string;
  title: string;
  type: InterviewType;
  durationMinutes: number;
  interviewerIds: string[];
  interviewers: UserSummary[];
  mode: BookingLinkMode;
  meetingProvider: InterviewMeetingProvider;
  location: string | null;
  expiresAt: string;
  status: BookingLinkStatus;
  bookedInterviewId: string | null;
  bookedInterview: {
    id: string;
    scheduledAt: string;
    status: InterviewStatus;
  } | null;
  bookedAt: string | null;
  cancelledAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateBookingLinkResponse extends BookingLink {
  emailSent: boolean;
  emailError: string | null;
}

export interface CreateBookingLinkRequest {
  applicationId: string;
  title?: string;
  type?: InterviewType;
  durationMinutes?: number;
  interviewerIds: string[];
  mode?: BookingLinkMode;
  meetingProvider?: InterviewMeetingProvider;
  location?: string | null;
  expiresInDays?: number;
  sendEmail?: boolean;
  message?: string;
}

export interface ListBookingLinksParams {
  applicationId?: string;
  status?: BookingLinkStatus;
}

export interface PublicBookedSlot {
  interviewId: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  status: InterviewStatus;
  meetingUrl: string | null;
  location: string | null;
}

export interface PublicBookingLink {
  status: BookingLinkStatus;
  title: string;
  type: InterviewType;
  durationMinutes: number;
  jobTitle: string;
  companyName: string;
  companyLogo: string | null;
  candidateFirstName: string;
  timezone: string;
  locale: string;
  expiresAt: string;
  location: string | null;
  booking: PublicBookedSlot | null;
}

export interface PublicSlot {
  startsAt: string;
  time: string;
}

export interface PublicSlotDay {
  date: string;
  slots: PublicSlot[];
}

export interface PublicSlots {
  timezone: string;
  durationMinutes: number;
  days: PublicSlotDay[];
}

export interface PublicSlotsParams {
  from: string;
  to: string;
  timezone?: string;
}

export interface BookSlotRequest {
  startsAt: string;
  timezone?: string;
}

export interface CancelPublicBookingRequest {
  reason?: string;
}
