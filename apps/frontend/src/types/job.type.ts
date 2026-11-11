import type { UserSummary } from './common.type';
import type { StageCounts } from './application.type';

export type EmploymentType = 'permanent' | 'temporary' | 'contract';
export type WorkMode = 'onsite' | 'hybrid' | 'remote';
export type RateUnit = 'hour' | 'day' | 'year';
export type JobStatus = 'draft' | 'published' | 'on_hold' | 'closed' | 'filled';

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'permanent',
  'temporary',
  'contract',
];
export const WORK_MODES: WorkMode[] = ['onsite', 'hybrid', 'remote'];
export const RATE_UNITS: RateUnit[] = ['hour', 'day', 'year'];
export const JOB_STATUSES: JobStatus[] = [
  'draft',
  'published',
  'on_hold',
  'closed',
  'filled',
];

export interface ScreeningQuestion {
  id: string;
  question: string;
  required: boolean;
}

export interface JobClientSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
}

export interface Job {
  id: string;
  organizationId: string;
  reference: string;
  clientId: string | null;
  title: string;
  description: string | null;
  requirements: string | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  payRate: number | null;
  chargeRate: number | null;
  rateUnit: RateUnit | null;
  currency: string;
  openings: number;
  status: JobStatus;
  ownerId: string | null;
  closingDate: string | null;
  publishedAt: string | null;
  skills: string[];
  screeningQuestions: ScreeningQuestion[];
  requiredDocuments: string[];
  client: JobClientSummary | null;
  owner: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobListItem extends Job {
  applicationCount: number;
  stageCounts: StageCounts;
}

export type JobDetail = JobListItem;

export interface ListJobsRequest {
  page: number;
  limit: number;
  search?: string;
  status?: JobStatus;
  clientId?: string;
  employmentType?: EmploymentType;
  ownerId?: string;
}

export interface CreateJobRequest {
  title: string;
  clientId?: string | null;
  description?: string | null;
  requirements?: string | null;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  payRate?: number | null;
  chargeRate?: number | null;
  rateUnit?: RateUnit | null;
  currency?: string;
  openings?: number;
  status?: JobStatus;
  ownerId?: string | null;
  closingDate?: string | null;
  skills?: string[];
  screeningQuestions?: Array<Omit<ScreeningQuestion, 'id'> & { id?: string }>;
  requiredDocuments?: string[];
}

export type UpdateJobRequest = Partial<CreateJobRequest>;

export interface UpdateJobStatusRequest {
  status: JobStatus;
}
