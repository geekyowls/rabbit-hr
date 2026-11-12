import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PipelineStageEntity } from '@db/entities';
import { PipelineStageRepository } from '@db/repositories';
import {
  CLOSED_PIPELINE_STAGE_CATEGORIES,
  DEFAULT_PIPELINE_STAGES,
  PipelineStageCategory,
} from '@db/enums';

export async function createDefaultPipelineStages(
  manager: EntityManager,
  organizationId: string,
): Promise<PipelineStageEntity[]> {
  const repository = manager.getRepository(PipelineStageEntity);
  const existing = await repository.count({ where: { organizationId } });
  if (existing > 0) return [];
  await repository
    .createQueryBuilder()
    .insert()
    .values(
      DEFAULT_PIPELINE_STAGES.map((stage, index) => ({
        ...stage,
        organizationId,
        order: index,
        isSystem: true,
        isActive: true,
      })),
    )
    .orIgnore()
    .execute();
  return repository.find({
    where: { organizationId },
    order: { order: 'ASC' },
  });
}

@Injectable()
export class PipelineStageService {
  constructor(
    private readonly pipelineStageRepository: PipelineStageRepository,
  ) {}

  async getStages(
    organizationId: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<PipelineStageEntity[]> {
    let stages = await this.pipelineStageRepository.find({
      where: { organizationId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
    if (stages.length === 0) {
      stages = await createDefaultPipelineStages(
        this.pipelineStageRepository.manager,
        organizationId,
      );
    }
    return options.activeOnly ? stages.filter((s) => s.isActive) : stages;
  }

  async getStage(
    organizationId: string,
    key: string,
  ): Promise<PipelineStageEntity> {
    const stages = await this.getStages(organizationId);
    const stage = stages.find((s) => s.key === key);
    if (!stage || !stage.isActive) {
      throw new BadRequestException(`Unknown pipeline stage: ${key}`);
    }
    return stage;
  }

  async getInitialStage(organizationId: string): Promise<PipelineStageEntity> {
    const stages = await this.getStages(organizationId, { activeOnly: true });
    const initial =
      stages.find((s) => s.category === PipelineStageCategory.APPLIED) ??
      stages[0];
    if (!initial) {
      throw new BadRequestException('No pipeline stages configured');
    }
    return initial;
  }

  async getKeysByCategory(
    organizationId: string,
    categories: PipelineStageCategory[],
  ): Promise<string[]> {
    const stages = await this.getStages(organizationId);
    return stages
      .filter((s) => categories.includes(s.category))
      .map((s) => s.key);
  }

  isClosedCategory(category: PipelineStageCategory): boolean {
    return CLOSED_PIPELINE_STAGE_CATEGORIES.includes(category);
  }
}
