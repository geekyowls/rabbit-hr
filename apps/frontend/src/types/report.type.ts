import type { UserSummary } from './common.type';
import type { CandidateSource } from './candidate.type';
import type { PipelineStageCategory } from './pipeline-stage.type';

export const TIME_TO_HIRE_METHOD = 'applied_at_to_first_hired_stage_entry';

export interface ReportSummaryRequest {
  from?: string;
  to?: string;
  jobId?: string;
  clientId?: string;
  recruiterId?: string;
}

export interface ReportTotals {
  applications: number;
  hires: number;
  interviews: number;
  offersSent: number;
}

export interface TimeToHireReport {
  method: string;
  hires: number;
  medianDays: number | null;
  averageDays: number | null;
}

export interface TimeInStageReport {
  stage: string;
  name: string;
  category: PipelineStageCategory;
  samples: number;
  medianDays: number | null;
  averageDays: number | null;
}

export interface FunnelStageReport {
  stage: string;
  name: string;
  category: PipelineStageCategory;
  reached: number;
  conversionToNext: number | null;
}

export interface SourceReport {
  source: CandidateSource;
  applications: number;
  hires: number;
  hireRate: number | null;
}

export interface WeeklyBucket {
  weekStart: string;
  applications: number;
  hires: number;
}

export interface OfferReport {
  created: number;
  sent: number;
  accepted: number;
  declined: number;
  pendingApproval: number;
  acceptanceRate: number | null;
}

export interface InterviewReport {
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  noShowRate: number | null;
  scorecards: number;
  averageRating: number | null;
}

export interface RecruiterReport {
  recruiter: UserSummary;
  jobs: number;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
}

export interface RejectionReasonReport {
  reason: string;
  count: number;
}

export interface ClientReport {
  clientId: string | null;
  name: string;
  applications: number;
  hires: number;
}

export interface ReportSummary {
  range: { from: string; to: string };
  totals: ReportTotals;
  timeToHire: TimeToHireReport;
  timeInStage: TimeInStageReport[];
  funnel: FunnelStageReport[];
  sources: SourceReport[];
  applicationsOverTime: WeeklyBucket[];
  offers: OfferReport;
  interviews: InterviewReport;
  recruiters: RecruiterReport[];
  rejectionReasons: RejectionReasonReport[];
  clients: ClientReport[];
}
