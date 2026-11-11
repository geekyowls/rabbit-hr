'use client';

import { StatusPill } from '@/components/patterns';
import type { ApplicationStage } from '@/types/application.type';
import { usePipelineStageMeta } from './application-meta';

export function StagePill({
  stage,
  dot = true,
  className,
}: {
  stage: ApplicationStage;
  dot?: boolean;
  className?: string;
}) {
  const meta = usePipelineStageMeta();
  return (
    <StatusPill tone={meta.tone(stage)} dot={dot} className={className}>
      {meta.label(stage)}
    </StatusPill>
  );
}
