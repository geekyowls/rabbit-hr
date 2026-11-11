export type PipelineStageCategory =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export const PIPELINE_STAGE_CATEGORIES: PipelineStageCategory[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
];

export const CLOSED_STAGE_CATEGORIES: PipelineStageCategory[] = [
  'rejected',
  'withdrawn',
];

export interface PipelineStage {
  id: string;
  key: string;
  name: string;
  order: number;
  category: PipelineStageCategory;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  applicationCount: number;
}

export interface PipelineStageInput {
  key?: string;
  name: string;
  category: PipelineStageCategory;
  color?: string;
  isActive?: boolean;
}

export interface PipelineStageMove {
  fromKey: string;
  toKey: string;
}

export interface ReplacePipelineStagesRequest {
  stages: PipelineStageInput[];
  moves?: PipelineStageMove[];
}
