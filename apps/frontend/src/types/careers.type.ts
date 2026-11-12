import type {
  EmploymentType,
  RateUnit,
  ScreeningQuestion,
  WorkMode,
} from './job.type';
import type {
  CareersCustomField,
  CustomFieldValues,
} from './custom-field.type';

export const CAREERS_CV_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;
export type CareersCvExtension = (typeof CAREERS_CV_EXTENSIONS)[number];
export const CAREERS_CV_MAX_BYTES = 10 * 1024 * 1024;

export interface CareersOrganization {
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  brandColor: string | null;
  portalEnabled: boolean;
}

export interface CareersJobListItem {
  id: string;
  reference: string;
  title: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  payRate: number | null;
  rateUnit: RateUnit | null;
  currency: string;
  closingDate: string | null;
  publishedAt: string | null;
  skills: string[];
}

export interface CareersJobDetail extends CareersJobListItem {
  description: string | null;
  requirements: string | null;
  screeningQuestions: ScreeningQuestion[];
  requiredDocuments: string[];
  customFields: CareersCustomField[];
}

export interface ListCareersJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  employmentType?: EmploymentType;
  location?: string;
}

export interface CareersAnswer {
  questionId: string;
  answer: string;
}

export interface ApplyToJobRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  coverNote?: string;
  answers?: CareersAnswer[];
  gdprConsent: true;
  cvFileKey?: string;
  cvFileName?: string;
  customFields?: CustomFieldValues;
}

export interface ApplyToJobResponse {
  applied: boolean;
  jobTitle: string;
}

export interface CareersUploadUrlRequest {
  extension: CareersCvExtension;
  sizeBytes: number;
}

export interface CareersUploadUrlResponse {
  signedUrl: string;
  path: string;
  key: string;
}
