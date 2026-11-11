import type { UserSummary } from './common.type';
import type { CandidateSource, RightToWork } from './candidate.type';
import type { PipelineStageCategory } from './pipeline-stage.type';

export type ApplicationStage = string;

export type StageCounts = Record<ApplicationStage, number>;

export interface ApplicationAnswer {
  questionId: string;
  question?: string;
  answer: string;
}

export interface ApplicationCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  currentTitle: string | null;
  skills: string[];
  tags: string[];
  rightToWork: RightToWork;
}

export interface ApplicationClientSummary {
  id: string;
  name: string;
}

export interface ApplicationJobSummary {
  id: string;
  reference: string;
  title: string;
  clientId: string | null;
  client: ApplicationClientSummary | null;
}

export interface Application {
  id: string;
  organizationId: string;
  candidateId: string;
  jobId: string;
  stage: ApplicationStage;
  rejectionReason: string | null;
  rating: number | null;
  shortlisted: boolean;
  source: CandidateSource;
  answers: ApplicationAnswer[] | null;
  stageChangedAt: string;
  ownerId: string | null;
  appliedAt: string;
  candidate: ApplicationCandidateSummary;
  job: ApplicationJobSummary;
  owner: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardCard {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string | null;
  candidateLocation: string | null;
  candidateTags: string[];
  jobId: string;
  jobTitle: string;
  jobReference: string;
  clientId: string | null;
  clientName: string | null;
  stage: ApplicationStage;
  rating: number | null;
  shortlisted: boolean;
  source: CandidateSource;
  ownerId: string | null;
  appliedAt: string;
  stageChangedAt: string;
  nextInterviewAt?: string | null;
}

export interface BoardColumn {
  stage: ApplicationStage;
  name: string;
  category: PipelineStageCategory;
  color: string;
  order: number;
  count: number;
  cards: BoardCard[];
}

export interface ApplicationBoard {
  stages: BoardColumn[];
}

export interface ListApplicationsRequest {
  page: number;
  limit: number;
  jobId?: string;
  clientId?: string;
  candidateId?: string;
  stage?: ApplicationStage;
  stageCategory?: PipelineStageCategory;
  search?: string;
  shortlisted?: boolean;
  ownerId?: string;
}

export interface ApplicationBoardRequest {
  jobId?: string;
  clientId?: string;
  search?: string;
  limitPerStage?: number;
}

export interface CreateApplicationRequest {
  candidateId: string;
  jobId: string;
  stage?: ApplicationStage;
  source?: CandidateSource;
  ownerId?: string;
}

export interface UpdateApplicationStageRequest {
  stage: ApplicationStage;
  rejectionReason?: string;
}

export interface UpdateApplicationRequest {
  rating?: number | null;
  shortlisted?: boolean;
  ownerId?: string | null;
}
