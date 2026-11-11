import type { UserSummary } from './common.type';
import type { ApplicationStage } from './application.type';
import type { CustomFieldValues } from './custom-field.type';
import type { PipelineStageCategory } from './pipeline-stage.type';

export type CandidateSource =
  | 'careers_page'
  | 'linkedin'
  | 'indeed'
  | 'reed'
  | 'totaljobs'
  | 'cv_library'
  | 'referral'
  | 'agency_database'
  | 'other';

export const CANDIDATE_SOURCES: CandidateSource[] = [
  'careers_page',
  'linkedin',
  'indeed',
  'reed',
  'totaljobs',
  'cv_library',
  'referral',
  'agency_database',
  'other',
];

export type RightToWork =
  | 'unknown'
  | 'uk_citizen'
  | 'settled_status'
  | 'visa_sponsorship_required'
  | 'work_visa';

export const RIGHT_TO_WORK_OPTIONS: RightToWork[] = [
  'unknown',
  'uk_citizen',
  'settled_status',
  'visa_sponsorship_required',
  'work_visa',
];

export interface Candidate {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  currentTitle: string | null;
  currentEmployer: string | null;
  yearsExperience: number | null;
  skills: string[];
  tags: string[];
  source: CandidateSource;
  cvFileKey: string | null;
  cvFileName: string | null;
  linkedinUrl: string | null;
  expectedSalary: number | null;
  noticePeriod: string | null;
  rightToWork: RightToWork;
  gdprConsentAt: string | null;
  ownerId: string | null;
  owner: UserSummary | null;
  rating: number | null;
  customFields: CustomFieldValues;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateLatestApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  stage: ApplicationStage;
  stageChangedAt: string;
}

export interface CandidateListItem extends Candidate {
  applicationCount: number;
  latestApplication: CandidateLatestApplication | null;
}

export interface CandidateApplicationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  jobReference: string;
  clientId: string | null;
  clientName: string | null;
  stage: ApplicationStage;
  rejectionReason: string | null;
  rating: number | null;
  shortlisted: boolean;
  appliedAt: string;
  stageChangedAt: string;
}

export interface CandidateDetail extends Candidate {
  applications: CandidateApplicationSummary[];
}

export interface ListCandidatesRequest {
  page: number;
  limit: number;
  search?: string;
  tags?: string[];
  source?: CandidateSource;
  jobId?: string;
  stage?: ApplicationStage;
  stageCategory?: PipelineStageCategory;
  rightToWork?: RightToWork;
  ownerId?: string;
}

export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  currentTitle?: string | null;
  currentEmployer?: string | null;
  yearsExperience?: number | null;
  skills?: string[];
  tags?: string[];
  source?: CandidateSource;
  cvFileKey?: string | null;
  cvFileName?: string | null;
  linkedinUrl?: string | null;
  expectedSalary?: number | null;
  noticePeriod?: string | null;
  rightToWork?: RightToWork;
  gdprConsentAt?: string | null;
  ownerId?: string | null;
  rating?: number | null;
  customFields?: CustomFieldValues;
}

export type UpdateCandidateRequest = Partial<CreateCandidateRequest>;
