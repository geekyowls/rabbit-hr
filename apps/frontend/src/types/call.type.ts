import type { UserSummary } from './common.type';

export type CallDirection = 'outbound' | 'inbound';

export type CallStatus =
  'initiated' | 'completed' | 'no_answer' | 'busy' | 'failed' | 'cancelled';

export type CallDisposition =
  | 'connected'
  | 'no_answer'
  | 'voicemail'
  | 'busy'
  | 'wrong_number'
  | 'interested'
  | 'not_interested'
  | 'callback_requested';

export interface CandidateCall {
  id: string;
  organizationId: string;
  candidateId: string;
  applicationId: string | null;
  actorId: string | null;
  provider: string;
  requestUuid: string | null;
  callUuid: string | null;
  direction: CallDirection;
  status: CallStatus;
  hangupCause: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  staffNumber: string | null;
  durationSeconds: number;
  billDurationSeconds: number | null;
  startedAt: string | null;
  endedAt: string | null;
  disposition: CallDisposition | null;
  note: string | null;
  recordingUrl: string | null;
  recordingDurationSeconds: number | null;
  activityId: string | null;
  actor: UserSummary | null;
  application: {
    id: string;
    jobId: string;
    stage: string;
    job: { id: string; title: string; reference: string } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListCandidateCallsParams {
  page: number;
  limit: number;
}

export interface InitiateCallRequest {
  staffPhone: string;
  applicationId?: string;
}

export interface UpdateCallRequest {
  disposition?: CallDisposition | null;
  note?: string | null;
}
