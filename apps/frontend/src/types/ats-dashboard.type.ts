import type { Activity } from './activity.type';
import type { ApplicationStage } from './application.type';
import type { PipelineStageCategory } from './pipeline-stage.type';
import type { Task } from './task.type';

export interface AtsDashboardTotals {
  openJobs: number;
  candidates: number;
  activeApplications: number;
  placementsThisMonth: number;
  interviews: number;
}

export interface StageCount {
  stage: ApplicationStage;
  name: string;
  category: PipelineStageCategory;
  color: string;
  count: number;
}

export interface ClientApplicationCount {
  clientId: string;
  clientName: string;
  count: number;
}

export interface DailyApplicationCount {
  date: string;
  count: number;
}

export interface AtsDashboard {
  totals: AtsDashboardTotals;
  funnel: StageCount[];
  applicationsByClient: ClientApplicationCount[];
  applicationsPerDay: DailyApplicationCount[];
  recentActivities: Activity[];
  myOpenTasks: Task[];
}
