import type { UserSummary } from './common.type';

export type InterviewType =
  'phone' | 'video' | 'onsite' | 'technical' | 'panel' | 'assessment' | 'other';

export type InterviewStatus =
  'scheduled' | 'completed' | 'cancelled' | 'no_show';

export type ScorecardRecommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';

export interface InterviewCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface InterviewJobSummary {
  id: string;
  title: string;
  reference: string;
  clientId: string | null;
}

export interface InterviewClientSummary {
  id: string;
  name: string;
}

export interface InterviewApplicationSummary {
  id: string;
  stage: string;
}

export interface ScorecardCriterion {
  name: string;
  rating: number;
  note?: string | null;
}

export interface Scorecard {
  id: string;
  interviewId: string;
  applicationId: string;
  interviewerId: string;
  interviewer: UserSummary | null;
  overallRating: number;
  recommendation: ScorecardRecommendation;
  criteria: ScorecardCriterion[];
  summary: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  organizationId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  title: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  location: string | null;
  meetingUrl: string | null;
  interviewerIds: string[];
  interviewers: UserSummary[];
  organizerId: string | null;
  organizer: UserSummary | null;
  status: InterviewStatus;
  notes: string | null;
  cancelledReason: string | null;
  candidate: InterviewCandidateSummary;
  job: InterviewJobSummary;
  client: InterviewClientSummary | null;
  application: InterviewApplicationSummary;
  scorecardCount: number;
  interviewerCount: number;
  averageRating: number | null;
  feedbackDue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewDetail extends Interview {
  scorecards: Scorecard[];
}

export interface ListInterviewsRequest {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  status?: InterviewStatus;
  jobId?: string;
  candidateId?: string;
  applicationId?: string;
  interviewerId?: string;
  mine?: boolean;
  needsFeedback?: boolean;
}

export interface CreateInterviewRequest {
  applicationId: string;
  title?: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes?: number;
  timezone?: string;
  location?: string | null;
  meetingUrl?: string | null;
  interviewerIds: string[];
  notes?: string | null;
  notifyCandidate?: boolean;
  moveToInterviewStage?: boolean;
}

export type UpdateInterviewRequest = Partial<
  Omit<CreateInterviewRequest, 'applicationId' | 'moveToInterviewStage'>
>;

export interface UpdateInterviewStatusRequest {
  status: InterviewStatus;
  reason?: string;
}

export interface SubmitScorecardRequest {
  interviewerId?: string;
  overallRating: number;
  recommendation: ScorecardRecommendation;
  criteria?: ScorecardCriterion[];
  summary?: string | null;
}
