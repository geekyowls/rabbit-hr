import type { UserSummary } from './common.type';

export type ActivityType =
  'note' | 'stage_change' | 'email' | 'call' | 'created' | 'document' | 'task';

export type ManualActivityType = Extract<
  ActivityType,
  'note' | 'call' | 'email'
>;

export interface Activity {
  id: string;
  organizationId: string;
  candidateId: string | null;
  applicationId: string | null;
  jobId: string | null;
  clientId: string | null;
  type: ActivityType;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  actorId: string | null;
  actor: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFilters {
  candidateId?: string;
  applicationId?: string;
  jobId?: string;
  clientId?: string;
}

export interface ListActivitiesRequest extends ActivityFilters {
  page: number;
  limit: number;
}

export interface CreateActivityRequest extends ActivityFilters {
  type?: ManualActivityType;
  title?: string;
  body: string;
}
