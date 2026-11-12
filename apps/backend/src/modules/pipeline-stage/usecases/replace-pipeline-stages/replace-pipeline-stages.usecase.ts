import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { ApplicationEntity, PipelineStageEntity } from '@db/entities';
import { PipelineStageCategory } from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { toSlugKey, uniqueSlugKey } from '@shared/helpers/slug-key';
import { PipelineStageInputDto } from '../../dtos/pipeline-stage.dto';
import { ListPipelineStages } from '../list-pipeline-stages/list-pipeline-stages.usecase';
import { ListPipelineStagesCommand } from '../list-pipeline-stages/list-pipeline-stages.command';
import { ReplacePipelineStagesCommand } from './replace-pipeline-stages.command';

const REQUIRED_CATEGORIES = [
  PipelineStageCategory.HIRED,
  PipelineStageCategory.REJECTED,
  PipelineStageCategory.WITHDRAWN,
];

const DEFAULT_COLOR = 'slate';

interface NormalizedStage {
  key: string;
  name: string;
  category: PipelineStageCategory;
  color: string;
  isActive: boolean;
}

function normalizeStages(inputs: PipelineStageInputDto[]): NormalizedStage[] {
  const explicitKeys = inputs.filter((s) => s.key).map((s) => s.key!);
  const duplicate = explicitKeys.find(
    (key, index) => explicitKeys.indexOf(key) !== index,
  );
  if (duplicate) {
    throw new BadRequestException(`Duplicate stage key: ${duplicate}`);
  }
  const taken = new Set(explicitKeys);
  return inputs.map((input) => ({
    key: input.key ?? uniqueSlugKey(toSlugKey(input.name, 'stage'), taken),
    name: input.name.trim(),
    category: input.category,
    color: input.color ?? DEFAULT_COLOR,
    isActive: input.isActive ?? true,
  }));
}

function assertStageRules(stages: NormalizedStage[]): void {
  const active = stages.filter((s) => s.isActive);
  const applied = active.filter(
    (s) => s.category === PipelineStageCategory.APPLIED,
  );
  if (
    applied.length !== 1 ||
    active[0]?.category !== PipelineStageCategory.APPLIED
  ) {
    throw new BadRequestException(
      'The pipeline must start with exactly one active applied stage',
    );
  }
  const missing = REQUIRED_CATEGORIES.filter(
    (category) => !active.some((s) => s.category === category),
  );
  if (missing.length > 0) {
    throw new BadRequestException(
      `The pipeline needs at least one active stage in: ${missing.join(', ')}`,
    );
  }
}

@Injectable()
export class ReplacePipelineStages {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pipelineStageService: PipelineStageService,
    private readonly listPipelineStages: ListPipelineStages,
  ) {}

  async execute(command: ReplacePipelineStagesCommand) {
    const { organizationId } = command;
    const stages = normalizeStages(command.payload.stages);
    assertStageRules(stages);

    const existing = await this.pipelineStageService.getStages(organizationId);
    const nextByKey = new Map(stages.map((s) => [s.key, s]));
    const retiredKeys = existing
      .filter((s) => !nextByKey.get(s.key)?.isActive)
      .map((s) => s.key);
    const removedKeys = existing
      .filter((s) => !nextByKey.has(s.key))
      .map((s) => s.key);

    const moves = command.payload.moves ?? [];
    const moveByKey = new Map<string, string>();
    for (const move of moves) {
      if (!retiredKeys.includes(move.fromKey)) {
        throw new BadRequestException(
          `${move.fromKey} is not being removed or deactivated`,
        );
      }
      if (!nextByKey.get(move.toKey)?.isActive) {
        throw new BadRequestException(
          `${move.toKey} must be an active stage in the new pipeline`,
        );
      }
      moveByKey.set(move.fromKey, move.toKey);
    }

    const counts = retiredKeys.length
      ? await this.dataSource.query<Array<{ stage: string; count: string }>>(
          `SELECT stage, COUNT(*) AS count FROM applications WHERE "organizationId" = $1 AND stage = ANY($2::varchar[]) GROUP BY stage`,
          [organizationId, retiredKeys],
        )
      : [];
    const blocked = counts.filter((row) => !moveByKey.has(row.stage));
    if (blocked.length > 0) {
      throw new BadRequestException(
        `Stages with applications need a moveToKey: ${blocked.map((r) => `${r.stage} (${r.count})`).join(', ')}`,
      );
    }

    const systemKeys = new Set(
      existing.filter((s) => s.isSystem).map((s) => s.key),
    );

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      for (const [fromKey, toKey] of moveByKey) {
        await manager.update(
          ApplicationEntity,
          { organizationId, stage: fromKey },
          { stage: toKey, stageChangedAt: now },
        );
      }
      if (removedKeys.length > 0) {
        await manager.delete(PipelineStageEntity, {
          organizationId,
          key: In(removedKeys),
        });
      }
      await manager.upsert(
        PipelineStageEntity,
        stages.map((stage, index) => ({
          ...stage,
          organizationId,
          order: index,
          isSystem: systemKeys.has(stage.key),
        })),
        ['organizationId', 'key'],
      );
    });

    return this.listPipelineStages.execute(
      ListPipelineStagesCommand.create({
        userId: command.userId,
        organizationId,
      }),
    );
  }
}
