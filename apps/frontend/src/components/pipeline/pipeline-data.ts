import type {
  ApplicationBoard,
  ApplicationStage,
  BoardCard,
} from '@/types/application.type';
import {
  ACTIVE_STAGES,
  STAGE_COLOR,
  STAGE_LABEL,
  STAGE_SLA_DAYS,
  daysSince,
} from '@/components/applications/application-meta';

export type PipelineCandidate = BoardCard;

export interface StageDef {
  id: ApplicationStage;
  label: string;
  color: string;
  slaDays: number;
}

export const STAGES: StageDef[] = ACTIVE_STAGES.map((id) => ({
  id,
  label: STAGE_LABEL[id],
  color: STAGE_COLOR[id],
  slaDays: STAGE_SLA_DAYS[id],
}));

export const STAGE_INDEX = Object.fromEntries(
  STAGES.map((s, i) => [s.id, i]),
) as Partial<Record<ApplicationStage, number>>;

export function nextStage(stage: ApplicationStage): StageDef | undefined {
  const index = STAGE_INDEX[stage];
  return index === undefined ? undefined : STAGES[index + 1];
}

export function daysInStage(c: PipelineCandidate) {
  return daysSince(c.stageChangedAt);
}

export function slaState(c: PipelineCandidate): 'ok' | 'warn' | 'over' {
  if (c.stage === 'placed') return 'ok';
  const days = daysInStage(c);
  const target = STAGE_SLA_DAYS[c.stage];
  if (days > target) return 'over';
  if (days >= target - 1) return 'warn';
  return 'ok';
}

export function boardCards(board: ApplicationBoard | undefined) {
  return board?.stages.flatMap((s) => s.cards) ?? [];
}

export function moveCardInBoard(
  board: ApplicationBoard,
  id: string,
  stage: ApplicationStage,
): ApplicationBoard {
  const card = boardCards(board).find((c) => c.id === id);
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

export const SAMPLE_NEXT_STEP: Record<ApplicationStage, string> = {
  applied: 'Review application',
  screening: 'Phone screen',
  interview: 'Collect feedback',
  offer: 'Chase offer response',
  placed: 'Start onboarding',
  rejected: 'Archived',
  withdrawn: 'Archived',
};

const SAMPLE_INTERVIEWERS = [
  'Neha Reddy',
  'Olivia Brown',
  'Kabir Shah',
  'Rohit Sharma',
  'Ana Martins',
];

export function sampleInterviewers(c: PipelineCandidate) {
  if (c.stage !== 'interview' && c.stage !== 'offer') return [];
  const start = hash(c.id) % SAMPLE_INTERVIEWERS.length;
  return [0, 1].map(
    (i) => SAMPLE_INTERVIEWERS[(start + i) % SAMPLE_INTERVIEWERS.length],
  );
}
