import type { UserSummary } from './common.type';

export type DocumentType =
  'cv' | 'id' | 'right_to_work' | 'reference' | 'certificate' | 'dbs' | 'other';

export const DOCUMENT_TYPES: DocumentType[] = [
  'cv',
  'id',
  'right_to_work',
  'reference',
  'certificate',
  'dbs',
  'other',
];

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';

export type DocumentReviewStatus = Exclude<
  DocumentVerificationStatus,
  'pending'
>;

export interface CandidateDocument {
  id: string;
  organizationId: string;
  candidateId: string;
  applicationId: string | null;
  type: DocumentType;
  name: string;
  fileKey: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy: string | null;
  verifier: UserSummary | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateDocumentRequest {
  type: DocumentType;
  name?: string;
  fileKey: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  applicationId?: string;
  expiresAt?: string;
  notes?: string;
}

export interface VerifyDocumentRequest {
  status: DocumentReviewStatus;
  notes?: string;
}

export interface DocumentDownloadUrl {
  url: string;
}
