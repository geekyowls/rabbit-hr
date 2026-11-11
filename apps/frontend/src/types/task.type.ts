import type { UserSummary } from './common.type';

export type TaskStatus = 'open' | 'done';
export type TaskDueFilter = 'overdue' | 'today' | 'upcoming';

export interface TaskCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TaskJobSummary {
  id: string;
  title: string;
  reference: string;
}

export interface TaskClientSummary {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  assigneeId: string | null;
  assignee: UserSummary | null;
  status: TaskStatus;
  completedAt: string | null;
  candidateId: string | null;
  candidate: TaskCandidateSummary | null;
  applicationId: string | null;
  jobId: string | null;
  job: TaskJobSummary | null;
  clientId: string | null;
  client: TaskClientSummary | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListTasksRequest {
  page: number;
  limit: number;
  search?: string;
  status?: TaskStatus;
  assigneeId?: string;
  mine?: boolean;
  due?: TaskDueFilter;
  candidateId?: string;
  applicationId?: string;
  jobId?: string;
  clientId?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  dueAt?: string | null;
  assigneeId?: string | null;
  candidateId?: string | null;
  applicationId?: string | null;
  jobId?: string | null;
  clientId?: string | null;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: TaskStatus;
}
