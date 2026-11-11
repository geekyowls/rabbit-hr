import type { UserSummary } from './common.type';
import type { EmploymentType } from './job.type';
import type { SalaryPeriod } from './ats-settings.type';

export type OfferStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'expired';

export type OfferDecision = 'approved' | 'rejected';

export type OfferResponse = 'accepted' | 'declined';

export interface OfferApproval {
  userId: string;
  decision: OfferDecision;
  comment: string | null;
  decidedAt: string;
}

export interface OfferApprover extends UserSummary {
  decision: OfferDecision | null;
  comment: string | null;
  decidedAt: string | null;
}

export interface OfferCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OfferJobSummary {
  id: string;
  title: string;
  reference: string;
  department: string | null;
  clientId: string | null;
}

export interface OfferClientSummary {
  id: string;
  name: string;
}

export interface OfferApplicationSummary {
  id: string;
  stage: string;
}

export type OfferSignStatus =
  | 'not_sent'
  | 'pending'
  | 'signed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'closed';

export interface OfferSignature {
  status: OfferSignStatus;
  signUrl: string | null;
  expiresAt: string | null;
  signedAt: string | null;
  signedName: string | null;
  signedIp: string | null;
  signedUserAgent: string | null;
  signatureHash: string | null;
}

export interface PublicOfferSigning {
  status: OfferSignStatus;
  offerStatus: OfferStatus;
  canRespond: boolean;
  title: string;
  salaryAmount: number | null;
  currency: string;
  salaryPeriod: SalaryPeriod;
  salaryFormatted: string | null;
  bonus: string | null;
  equity: string | null;
  startDate: string | null;
  offerExpiresAt: string | null;
  linkExpiresAt: string;
  employmentType: EmploymentType | null;
  location: string | null;
  letterBody: string;
  letterHtml: string;
  candidate: { firstName: string; lastName: string };
  job: { title: string; reference: string; location: string | null };
  client: { name: string } | null;
  company: { name: string | null; logo: string | null; website: string | null };
  locale: string;
  timezone: string;
  sentAt: string | null;
  respondedAt: string | null;
  signedAt: string | null;
  signedName: string | null;
  declineReason: string | null;
}

export interface AcceptOfferSigningRequest {
  fullName: string;
  consent: boolean;
}

export interface DeclineOfferSigningRequest {
  reason?: string;
}

export interface Offer {
  id: string;
  organizationId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  status: OfferStatus;
  title: string;
  salaryAmount: number | null;
  currency: string;
  salaryPeriod: SalaryPeriod;
  bonus: string | null;
  equity: string | null;
  startDate: string | null;
  expiresAt: string | null;
  employmentType: EmploymentType | null;
  location: string | null;
  body: string | null;
  approverIds: string[];
  approvals: OfferApproval[];
  approvers: OfferApprover[];
  sentAt: string | null;
  respondedAt: string | null;
  declineReason: string | null;
  sentLetterBody: string | null;
  signTokenExpiresAt: string | null;
  signedAt: string | null;
  signedName: string | null;
  signedIp: string | null;
  signedUserAgent: string | null;
  signatureHash: string | null;
  signature: OfferSignature;
  createdBy: string | null;
  creator: UserSummary | null;
  candidate: OfferCandidateSummary;
  job: OfferJobSummary;
  client: OfferClientSummary | null;
  application: OfferApplicationSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ListOffersRequest {
  page: number;
  limit: number;
  status?: OfferStatus;
  jobId?: string;
  clientId?: string;
  candidateId?: string;
  applicationId?: string;
  search?: string;
}

export interface CreateOfferRequest {
  applicationId: string;
  title?: string;
  salaryAmount?: number | null;
  currency?: string;
  salaryPeriod?: SalaryPeriod;
  bonus?: string | null;
  equity?: string | null;
  startDate?: string | null;
  expiresAt?: string | null;
  employmentType?: EmploymentType | null;
  location?: string | null;
  body?: string | null;
  approverIds?: string[];
}

export type UpdateOfferRequest = Partial<
  Omit<CreateOfferRequest, 'applicationId'>
>;

export interface OfferDecisionRequest {
  comment?: string;
}

export interface RespondOfferRequest {
  response: OfferResponse;
  reason?: string;
}

export interface WithdrawOfferRequest {
  reason?: string;
}
