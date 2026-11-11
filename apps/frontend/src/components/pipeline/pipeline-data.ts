import type {
  ApplicationBoard,
  ApplicationStage,
  BoardCard,
  BoardColumn,
} from '@/types/application.type';
import type { PipelineStageCategory } from '@/types/pipeline-stage.type';
import {
  CATEGORY_SLA_DAYS,
  daysSince,
  isClosedCategory,
  stageColor,
} from '@/components/applications/application-meta';

export type PipelineCandidate = BoardCard & {
  stageName: string;
  stageCategory: PipelineStageCategory;
};

export interface StageDef {
  id: ApplicationStage;
  label: string;
  color: string;
  category: PipelineStageCategory;
  slaDays: number;
}

export function toStageDef(column: BoardColumn): StageDef {
  return {
    id: column.stage,
    label: column.name,
    color: stageColor(column),
    category: column.category,
    slaDays: CATEGORY_SLA_DAYS[column.category],
  };
}

export function flowStageDefs(board: ApplicationBoard | undefined) {
  return (board?.stages ?? [])
    .filter((s) => !isClosedCategory(s.category))
    .map(toStageDef);
}

export function nextStage(
  stages: StageDef[],
  stage: ApplicationStage,
): StageDef | undefined {
  const index = stages.findIndex((s) => s.id === stage);
  return index === -1 ? undefined : stages[index + 1];
}

export function daysInStage(c: PipelineCandidate) {
  return daysSince(c.stageChangedAt);
}

export function slaState(c: PipelineCandidate): 'ok' | 'warn' | 'over' {
  if (c.stageCategory === 'hired') return 'ok';
  const days = daysInStage(c);
  const target = CATEGORY_SLA_DAYS[c.stageCategory];
  if (days > target) return 'over';
  if (days >= target - 1) return 'warn';
  return 'ok';
}

export function columnCards(column: BoardColumn): PipelineCandidate[] {
  return column.cards.map((card) => ({
    ...card,
    stageName: column.name,
    stageCategory: column.category,
  }));
}

export function boardCards(
  board: ApplicationBoard | undefined,
): PipelineCandidate[] {
  return board?.stages.flatMap(columnCards) ?? [];
}

export function moveCardInBoard(
  board: ApplicationBoard,
  id: string,
  stage: ApplicationStage,
): ApplicationBoard {
  const card = board.stages.flatMap((s) => s.cards).find((c) => c.id === id);
  if (!card || card.stage === stage) return board;
  const moved: BoardCard = {
    ...card,
    stage,
    stageChangedAt: new Date().toISOString(),
  };
  return {
    stages: board.stages.map((col) => {
      if (col.stage === card.stage) {
        return {
          ...col,
          count: Math.max(0, col.count - 1),
          cards: col.cards.filter((c) => c.id !== id),
        };
      }
      if (col.stage === stage) {
        return { ...col, count: col.count + 1, cards: [moved, ...col.cards] };
      }
      return col;
    }),
  };
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function sampleMatchScore(id: string) {
  return 55 + (hash(id) % 41);
}

export const SAMPLE_NEXT_STEP: Record<PipelineStageCategory, string> = {
  applied: 'Review application',
  screening: 'Phone screen',
  interview: 'Collect feedback',
  offer: 'Chase offer response',
  hired: 'Start onboarding',
  rejected: 'Archived',
  withdrawn: 'Archived',
};
