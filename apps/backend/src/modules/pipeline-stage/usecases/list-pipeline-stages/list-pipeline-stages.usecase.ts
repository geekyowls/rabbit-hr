import { Injectable } from '@nestjs/common';
import { ApplicationRepository } from '@db/repositories';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { ListPipelineStagesCommand } from './list-pipeline-stages.command';

@Injectable()
export class ListPipelineStages {
  constructor(
    private readonly pipelineStageService: PipelineStageService,
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(command: ListPipelineStagesCommand) {
    const [stages, counts] = await Promise.all([
      this.pipelineStageService.getStages(command.organizationId),
      this.applicationRepository.query<Array<{ stage: string; count: string }>>(
        `SELECT stage, COUNT(*) AS count FROM applications WHERE "organizationId" = $1 GROUP BY stage`,
        [command.organizationId],
      ),
    ]);
    const countByKey = new Map(counts.map((r) => [r.stage, Number(r.count)]));
    return stages.map((stage) => ({
      id: stage.id,
      key: stage.key,
      name: stage.name,
      order: stage.order,
      category: stage.category,
      color: stage.color,
      isSystem: stage.isSystem,
      isActive: stage.isActive,
      applicationCount: countByKey.get(stage.key) ?? 0,
    }));
  }
}
