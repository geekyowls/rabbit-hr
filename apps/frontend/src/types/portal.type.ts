import type {
  CareersCustomField,
  CustomFieldValues,
} from './custom-field.type';
import type { DocumentType, DocumentVerificationStatus } from './document.type';
import type { EmploymentType, RateUnit, WorkMode } from './job.type';
import type { InterviewStatus, InterviewType } from './interview.type';
import type { SalaryPeriod } from './ats-settings.type';

export type PortalStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export interface PortalBranding {
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  brandColor: string | null;
  welcomeMessage: string;
  portalEnabled: boolean;
}

export interface PortalProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  linkedinUrl: string | null;
  cvFileName: string | null;
  customFields: CustomFieldValues;
}

export interface PortalMe {
  candidate: PortalProfile;
  organization: PortalBranding;
  customFields: CareersCustomField[];
}

export interface PortalTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PortalAuthResponse extends PortalTokens {
  candidate: PortalProfile;
  organization: PortalBranding;
}

export interface PortalOtpRequested {
  sent: boolean;
  expiresIn: number;
}

export interface PortalApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  jobReference: string;
  jobLocation: string | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  status: PortalStatus;
  statusLabel: string;
  isClosed: boolean;
  appliedAt: string;
  updatedAt: string;
}

export interface PortalInterview {
  id: string;
  applicationId: string;
  jobTitle: string | null;
  title: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  location: string | null;
  meetingUrl: string | null;
  status: InterviewStatus;
  isUpcoming: boolean;
}

export interface PortalBookingLink {
  id: string;
  applicationId: string;
  jobTitle: string | null;
  title: string;
  type: InterviewType;
  durationMinutes: number;
  expiresAt: string;
  token: string;
}

export type PortalOfferSignStatus =
  | 'not_sent'
  | 'pending'
  | 'signed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'closed';

export interface PortalOffer {
  id: string;
  applicationId: string;
  jobTitle: string | null;
  title: string;
  salaryAmount: number | null;
  currency: string;
  salaryPeriod: SalaryPeriod;
  bonus: string | null;
  startDate: string | null;
  expiresAt: string | null;
  employmentType: EmploymentType | null;
  location: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  signedAt: string | null;
  signStatus: PortalOfferSignStatus;
  signToken: string | null;
}

export interface PortalDocument {
  id: string;
  applicationId: string | null;
  type: DocumentType;
  name: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  verificationStatus: DocumentVerificationStatus;
  expiresAt: string | null;
  createdAt: string;
}

export interface PortalDocumentRequest {
  type: DocumentType;
  jobTitles: string[];
  applicationIds: string[];
}

export interface PortalDocuments {
  documents: PortalDocument[];
  requests: PortalDocumentRequest[];
}

export interface PortalOverview {
  applications: PortalApplication[];
  upcomingInterviews: PortalInterview[];
  pendingOffers: PortalOffer[];
  documentRequests: PortalDocumentRequest[];
  bookingLinks: PortalBookingLink[];
}

export interface PortalTimelineStep {
  status: PortalStatus;
  label: string;
  state: 'done' | 'current' | 'upcoming';
  reachedAt: string | null;
}

export interface PortalApplicationDetail extends PortalApplication {
  description: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  payRate: number | null;
  rateUnit: RateUnit | null;
  currency: string;
  canWithdraw: boolean;
  timeline: PortalTimelineStep[];
  interviews: PortalInterview[];
  offers: PortalOffer[];
  bookingLinks: PortalBookingLink[];
}

export interface PortalInterviews {
  upcoming: PortalInterview[];
  past: PortalInterview[];
  bookingLinks: PortalBookingLink[];
}

export const PORTAL_UPLOAD_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
] as const;
export type PortalUploadExtension = (typeof PORTAL_UPLOAD_EXTENSIONS)[number];
export const PORTAL_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export interface PortalUploadUrlResponse {
  signedUrl: string;
  key: string;
}

export interface CreatePortalDocumentRequest {
  type: DocumentType;
  name?: string;
  fileKey: string;
  fileName: string;
  sizeBytes?: number;
  applicationId?: string;
}

export interface UpdatePortalProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  linkedinUrl?: string | null;
  customFields?: CustomFieldValues;
}

export interface PortalInviteResponse {
  sent: boolean;
  reason: string | null;
  portalInvitedAt: string;
  loginUrl: string;
}
